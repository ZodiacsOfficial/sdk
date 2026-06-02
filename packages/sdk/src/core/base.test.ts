import { describe, expect, it, vi } from "vitest";
import {
  getBaseZodiacBalance,
  getBaseZodiacsOwnership,
  getSolanaZodiacBalance
} from "./index.js";
import type { PublicClient } from "viem";
import type { SolanaBalanceConnection } from "./types.js";

const ownerAddress = "0x1111111111111111111111111111111111111111";

function mockPublicClient(readContract: ReturnType<typeof vi.fn>): PublicClient {
  return { readContract } as unknown as PublicClient;
}

describe("Base read-only balances", () => {
  it("returns an ok balance for positive ERC-20 balanceOf reads", async () => {
    const readContract = vi.fn(async (_request: { readonly functionName: string }) => 1234500000000000000000000n);
    const client = mockPublicClient(readContract);

    await expect(getBaseZodiacBalance(client, ownerAddress, "aries")).resolves.toMatchObject({
      sign: "aries",
      chain: "base",
      kind: "bridged",
      tokenStandard: "ERC20",
      rawAmount: "1234500000000000000000000",
      uiAmountString: "1234500000000000000",
      status: "ok"
    });
    expect(readContract).toHaveBeenCalledOnce();
    expect(readContract.mock.calls[0]?.[0]).toMatchObject({ functionName: "balanceOf" });
  });

  it("returns zero for empty balances", async () => {
    const readContract = vi.fn(async (_request: { readonly functionName: string }) => 0n);
    const client = mockPublicClient(readContract);

    await expect(getBaseZodiacBalance(client, ownerAddress, "taurus")).resolves.toMatchObject({
      rawAmount: "0",
      uiAmountString: "0",
      status: "zero"
    });
    expect(readContract).toHaveBeenCalledOnce();
  });

  it("returns unavailable for read errors without breaking ownership reads", async () => {
    const readContract = vi.fn(async ({ address, functionName }) => {
      if (String(address).toLowerCase() === "0x3ffb5282f5891dd8c813e64059edb0607537ec91") {
        throw new Error("RPC unavailable");
      }

      expect(functionName).toBe("balanceOf");
      return 0n;
    });
    const client = mockPublicClient(readContract);
    const ownership = await getBaseZodiacsOwnership(client, ownerAddress);

    expect(ownership.holdings).toHaveLength(12);
    expect(ownership.status).toBe("partial");
    expect(ownership.errors[0]).toMatchObject({
      code: "zodiac-read-unavailable",
      message: "RPC unavailable"
    });
  });
});

describe("explicit Solana read aliases", () => {
  it("marks Solana reads as native SPL representations", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () => ({
        value: []
      }))
    };

    await expect(getSolanaZodiacBalance(connection, "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ", "aries")).resolves.toMatchObject({
      chain: "solana",
      kind: "native",
      tokenStandard: "SPL",
      representation: {
        chain: "solana",
        isCanonicalOrigin: true
      }
    });
  });
});
