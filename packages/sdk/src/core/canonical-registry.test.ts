import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RegistryInvariantError,
  ZODIACS_REGISTRY,
  assertValidZodiacsRegistrySchema,
  getAllBaseBridgedZodiacs,
  getAllSolanaNativeZodiacs,
  getBaseZodiacRepresentation,
  getBridgedCounterpart,
  getNativeCounterpart,
  getRepresentationByAddress,
  getZodiacSignByAddress,
  isOfficialBaseZodiacAddress,
  isOfficialSolanaZodiacMint,
  isOfficialZodiacAddress,
  isOfficialZodiacRepresentation,
  normalizeZodiacsRegistry,
  validateZodiacsRegistrySchema,
  type ZodiacSign,
  assertOfficialZodiacAddress
} from "./index.js";
import { ZODIAC_SIGNS } from "./types.js";

const ariesSolanaMint = "GhFiFrExPY3proVF96oth1gESWA5QPQzdtb8cy8b1YZv";
const ariesBaseAddress = "0x3ffB5282F5891Dd8c813E64059EdB0607537eC91";

describe("canonical Zodiacs registry", () => {
  it("contains exactly one asset for each sign", () => {
    expect(ZODIACS_REGISTRY.assets).toHaveLength(12);
    expect(ZODIACS_REGISTRY.assets.map((asset) => asset.sign)).toEqual(ZODIAC_SIGNS);
    expect(new Set(ZODIACS_REGISTRY.assets.map((asset) => asset.sign)).size).toBe(12);
  });

  it("models Solana as the native canonical origin and Base as bridged", () => {
    for (const asset of ZODIACS_REGISTRY.assets) {
      const solana = asset.representations.filter(
        (representation) => representation.chain === "solana"
      );
      const base = asset.representations.filter(
        (representation) => representation.chain === "base"
      );

      expect(solana).toHaveLength(1);
      expect(base).toHaveLength(1);
      expect(asset.native).toEqual(solana[0]);
      expect(solana[0]).toMatchObject({
        kind: "native",
        tokenStandard: "SPL",
        isCanonicalOrigin: true,
        isOfficialRepresentation: true
      });
      expect(base[0]).toMatchObject({
        chainId: 8453,
        kind: "bridged",
        tokenStandard: "ERC20",
        isCanonicalOrigin: false,
        isOfficialRepresentation: true,
        originChain: "solana",
        originAddress: solana[0]?.address,
        bridge: {
          status: "official-bridged",
          protocol: "wormhole",
          sourceChain: "solana",
          destinationChain: "base"
        }
      });
    }
  });

  it("has unique addresses per chain and keeps Base out of canonical origin", () => {
    const solanaAddresses = getAllSolanaNativeZodiacs().map(
      (representation) => representation.address
    );
    const baseAddresses = getAllBaseBridgedZodiacs().map((representation) =>
      representation.address.toLowerCase()
    );

    expect(new Set(solanaAddresses).size).toBe(12);
    expect(new Set(baseAddresses).size).toBe(12);
    expect(
      getAllBaseBridgedZodiacs().every((representation) => !representation.isCanonicalOrigin)
    ).toBe(true);
    expect(
      getAllBaseBridgedZodiacs().every((representation) =>
        isOfficialBaseZodiacAddress(representation.address)
      )
    ).toBe(true);
  });

  it("keeps the JSON registry artifact in sync with the TypeScript registry", () => {
    const artifact = JSON.parse(
      readFileSync(new URL("../../registry/zodiacs.registry.json", import.meta.url), "utf8")
    );

    expect(artifact).toEqual(ZODIACS_REGISTRY);
  });

  it("passes runtime schema and invariant validation", () => {
    const result = validateZodiacsRegistrySchema(ZODIACS_REGISTRY);

    expect(result).toEqual({ valid: true, issues: [], errors: [] });
    expect(() => assertValidZodiacsRegistrySchema(ZODIACS_REGISTRY)).not.toThrow();
    expect(normalizeZodiacsRegistry(ZODIACS_REGISTRY)).toEqual(ZODIACS_REGISTRY);
  });

  it("rejects missing representation metadata fields", () => {
    const firstAsset = ZODIACS_REGISTRY.assets[0]!;
    const invalidRegistry = {
      ...ZODIACS_REGISTRY,
      assets: [
        {
          ...firstAsset,
          representations: firstAsset.representations.map((representation) =>
            representation.chain === "base" ? { ...representation, symbol: "" } : representation
          )
        },
        ...ZODIACS_REGISTRY.assets.slice(1)
      ]
    };
    const result = validateZodiacsRegistrySchema(invalidRegistry);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain(
      "$.assets[0].representations[1].symbol"
    );
  });

  it("rejects duplicate signs, duplicate addresses, and mismatched bridge origins", () => {
    const invalidRegistry = {
      ...ZODIACS_REGISTRY,
      assets: [
        {
          ...ZODIACS_REGISTRY.assets[0],
          representations: ZODIACS_REGISTRY.assets[0]?.representations.map((representation) =>
            representation.chain === "base"
              ? { ...representation, originAddress: "EjkkxYpfSwS6TAtKKuiJuNMMngYvumc1t1v9ZX1WJKMp" }
              : representation
          )
        },
        {
          ...ZODIACS_REGISTRY.assets[0],
          native: {
            ...ZODIACS_REGISTRY.assets[0]?.native,
            address: ZODIACS_REGISTRY.assets[1]?.native.address
          },
          representations: ZODIACS_REGISTRY.assets[0]?.representations.map((representation) =>
            representation.chain === "solana"
              ? { ...representation, address: ZODIACS_REGISTRY.assets[1]?.native.address }
              : representation
          )
        },
        ...ZODIACS_REGISTRY.assets.slice(2)
      ]
    };
    const result = validateZodiacsRegistrySchema(invalidRegistry);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["duplicate-sign", "duplicate-address", "invalid-origin"])
    );
    expect(() => assertValidZodiacsRegistrySchema(invalidRegistry)).toThrow(RegistryInvariantError);
  });

  it("stores a checksum for the registry artifact", () => {
    const artifact = readFileSync(new URL("../../registry/zodiacs.registry.json", import.meta.url));
    const checksum = readFileSync(
      new URL("../../registry/zodiacs.registry.sha256", import.meta.url),
      "utf8"
    )
      .trim()
      .split(/\s+/u)[0];
    const actual = createHash("sha256").update(artifact).digest("hex");

    expect(actual).toBe(checksum);
  });

  it("verifies native Solana and bridged Base addresses", () => {
    const baseLowercase = ariesBaseAddress.toLowerCase();

    expect(isOfficialSolanaZodiacMint(ariesSolanaMint)).toBe(true);
    expect(isOfficialBaseZodiacAddress(baseLowercase)).toBe(true);
    expect(isOfficialZodiacAddress(baseLowercase)).toBe(true);
    expect(getRepresentationByAddress(ariesSolanaMint)).toMatchObject({
      sign: "aries",
      chain: "solana",
      kind: "native"
    });
    expect(getRepresentationByAddress(baseLowercase)).toMatchObject({
      sign: "aries",
      chain: "base",
      kind: "bridged",
      originAddress: ariesSolanaMint
    });
    expect(isOfficialZodiacRepresentation(getRepresentationByAddress(baseLowercase))).toBe(true);
    expect(isOfficialZodiacRepresentation(baseLowercase)).toBe(true);
    expect(
      isOfficialZodiacRepresentation({
        ...getBaseZodiacRepresentation("aries"),
        address: unknownBaseAddress()
      })
    ).toBe(false);
  });

  it("returns null or false for unknown addresses and throws only from assertions", () => {
    const unknownSolana = "11111111111111111111111111111111";
    const unknownBase = "0x0000000000000000000000000000000000000000";

    expect(isOfficialZodiacAddress(unknownSolana)).toBe(false);
    expect(isOfficialZodiacAddress(unknownBase)).toBe(false);
    expect(getRepresentationByAddress(unknownBase)).toBeNull();
    expect(() => assertOfficialZodiacAddress(unknownBase)).toThrow("official Zodiacs.org registry");
    expect(() => assertOfficialZodiacAddress(ariesBaseAddress)).not.toThrow();
  });

  it("resolves signs and counterparts across native and bridged representations", () => {
    expect(getZodiacSignByAddress(ariesSolanaMint)).toBe("aries");
    expect(getZodiacSignByAddress(ariesBaseAddress.toLowerCase())).toBe("aries");
    expect(getNativeCounterpart(ariesBaseAddress)).toMatchObject({
      chain: "solana",
      address: ariesSolanaMint
    });
    expect(getBridgedCounterpart("aries", "base")).toEqual(getBaseZodiacRepresentation("aries"));
  });

  it("contains all supplied Base bridged addresses", () => {
    const expected = new Map<ZodiacSign, string>([
      ["gemini", "0x8F6eb25aB4CD2F8f064f7da5E35136D4EC600b4f"],
      ["virgo", "0xAcFd97106bbE5D931aC430Be76A8E362832D48f4"],
      ["aquarius", "0xccA7CD4F96336Fd26eF6c5F579eaC651bAC5535F"],
      ["capricorn", "0xbFB102C18FDf49f2ffCB9B3aF4522f7DC9f51018"],
      ["aries", ariesBaseAddress],
      ["scorpio", "0x0057C9cB6D16C2ecA808788f14d0d0c367b26676"],
      ["leo", "0x4f7B4c12DE5d47314C86Ed3BA25E289aA139CF75"],
      ["pisces", "0x43fA1855a89b7A3e07426Fa7a1B44b4187d29Daf"],
      ["taurus", "0xd5356c6E529569c6912978433DAfb7ca72B5f09C"],
      ["libra", "0x4201eff5F419CD6EEDFb28fa240edeaFc9002204"],
      ["sagittarius", "0xD21fAb1EB5E11AC3C281F7cF8096eCC4683eEa9c"],
      ["cancer", "0xb9Fd3c3157C7b69260Ca285FbbC74F6309226378"]
    ]);

    for (const [sign, address] of expected) {
      expect(getBaseZodiacRepresentation(sign).address).toBe(address);
    }
  });
});

function unknownBaseAddress(): string {
  return "0x0000000000000000000000000000000000000000";
}
