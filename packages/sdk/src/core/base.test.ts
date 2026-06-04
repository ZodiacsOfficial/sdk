import { describe, expect, it, vi } from "vitest";
import {
  BASE_BRIDGED_ZODIAC_ADDRESSES,
  PartialOwnershipReadError,
  getBaseZodiacBalance,
  getBaseZodiacsOwnershipBatched,
  getBaseZodiacsOwnership,
  getSolanaZodiacBalance
} from "./index.js";
import type { PublicClient } from "viem";
import type { SolanaBalanceConnection } from "./types.js";

const ownerAddress = "0x1111111111111111111111111111111111111111";

function mockPublicClient(readContract: ReturnType<typeof vi.fn>): PublicClient {
  return { readContract } as unknown as PublicClient;
}

function mockBatchedPublicClient(readContracts: ReturnType<typeof vi.fn>): PublicClient {
  return {
    chain: { id: 8453 },
    getBlockNumber: vi.fn(async () => 123n),
    readContracts
  } as unknown as PublicClient;
}

describe("Base read-only balances", () => {
  it("returns an ok balance for positive ERC-20 balanceOf reads", async () => {
    const readContract = vi.fn(async ({ functionName }) =>
      functionName === "decimals" ? 6 : 1234500000000000000000000n
    );
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
    expect(readContract).toHaveBeenCalledTimes(2);
    expect(readContract.mock.calls[0]?.[0]).toMatchObject({ functionName: "balanceOf" });
    expect(readContract.mock.calls[1]?.[0]).toMatchObject({ functionName: "decimals" });
  });

  it("returns zero for empty balances", async () => {
    const readContract = vi.fn(async ({ functionName }) => (functionName === "decimals" ? 6 : 0n));
    const client = mockPublicClient(readContract);

    await expect(getBaseZodiacBalance(client, ownerAddress, "taurus")).resolves.toMatchObject({
      rawAmount: "0",
      uiAmountString: "0",
      status: "zero"
    });
    expect(readContract).toHaveBeenCalledTimes(2);
  });

  it("returns unavailable for read errors without breaking ownership reads", async () => {
    const readContract = vi.fn(async ({ address, functionName }) => {
      if (String(address).toLowerCase() === "0x3ffb5282f5891dd8c813e64059edb0607537ec91") {
        throw new Error("RPC unavailable");
      }

      return functionName === "decimals" ? 6 : 0n;
    });
    const client = mockPublicClient(readContract);
    const ownership = await getBaseZodiacsOwnership(client, ownerAddress);

    expect(ownership.holdings).toHaveLength(12);
    expect(readContract).toHaveBeenCalledTimes(24);
    expect(ownership.status).toBe("partial");
    expect(ownership.unavailableSigns).toEqual(["aries"]);
    expect(ownership.confirmedAbsentSigns).not.toContain("aries");
    expect(ownership.errors[0]).toMatchObject({
      code: "zodiac-read-unavailable",
      message: "RPC unavailable"
    });
  });

  it("passes block options through fallback readContract reads", async () => {
    const readContract = vi.fn(async ({ functionName }) =>
      functionName === "decimals" ? 6 : 1_000_000n
    );
    const client = mockPublicClient(readContract);
    const ownership = await getBaseZodiacsOwnership(client, ownerAddress, {
      blockNumber: 456n
    });

    expect(ownership.blockNumber).toBe(456n);
    expect(readContract).toHaveBeenCalledTimes(24);
    expect(readContract.mock.calls[0]?.[0]).toMatchObject({
      functionName: "balanceOf",
      blockNumber: 456n
    });
    expect(readContract.mock.calls[1]?.[0]).toMatchObject({
      functionName: "decimals",
      blockNumber: 456n
    });
  });

  it("batches Base ownership reads and caches decimals by client and token", async () => {
    const readContracts = vi.fn(async ({ contracts }) =>
      contracts.map((contract: { readonly address: string; readonly functionName: string }) => {
        if (contract.functionName === "decimals") {
          return { status: "success", result: 6 };
        }

        return {
          status: "success",
          result:
            contract.address.toLowerCase() === BASE_BRIDGED_ZODIAC_ADDRESSES.aries.toLowerCase()
              ? 2_500_000n
              : 0n
        };
      })
    );
    const client = mockBatchedPublicClient(readContracts);

    const first = await getBaseZodiacsOwnershipBatched(client, ownerAddress, {
      includeZeroBalances: false,
      blockTag: "safe"
    });
    const second = await getBaseZodiacsOwnership(client, ownerAddress);

    expect(readContracts).toHaveBeenCalledTimes(3);
    expect(readContracts.mock.calls[0]?.[0].contracts).toHaveLength(12);
    expect(readContracts.mock.calls[0]?.[0].contracts[0].functionName).toBe("decimals");
    expect(readContracts.mock.calls[1]?.[0].contracts).toHaveLength(12);
    expect(readContracts.mock.calls[1]?.[0].contracts[0].functionName).toBe("balanceOf");
    expect(readContracts.mock.calls[1]?.[0].blockTag).toBe("safe");
    expect(readContracts.mock.calls[2]?.[0].contracts[0].functionName).toBe("balanceOf");
    expect(first).toMatchObject({
      owner: ownerAddress,
      ownerAddress,
      chain: "base",
      status: "available",
      heldSigns: ["aries"],
      zeroBalanceSigns: expect.arrayContaining(["taurus"]),
      unavailableSigns: [],
      confirmedAbsentSigns: expect.arrayContaining(["taurus"]),
      missingSigns: expect.arrayContaining(["taurus"]),
      totalHeld: 1,
      blockNumber: 123n
    });
    expect(first.holdings).toHaveLength(1);
    expect(first.balancesBySign?.aries.rawAmount).toBe("2500000");
    expect(first.representations).toHaveLength(12);
    expect(second.holdings).toHaveLength(12);
  });

  it("applies minBalance without hiding zero-balance output", async () => {
    const readContracts = vi.fn(async ({ contracts }) =>
      contracts.map((contract: { readonly address: string; readonly functionName: string }) => ({
        status: "success",
        result:
          contract.functionName === "decimals"
            ? 6
            : contract.address.toLowerCase() === BASE_BRIDGED_ZODIAC_ADDRESSES.aries.toLowerCase()
              ? 500_000n
              : 0n
      }))
    );
    const client = mockBatchedPublicClient(readContracts);
    const ownership = await getBaseZodiacsOwnership(client, ownerAddress, {
      minBalance: 1_000_000n
    });

    expect(ownership.heldSigns).toEqual([]);
    expect(ownership.zeroBalanceSigns).toEqual(expect.arrayContaining(["taurus"]));
    expect(ownership.confirmedAbsentSigns).not.toContain("aries");
    expect(ownership.balancesBySign?.aries.rawAmount).toBe("500000");
  });

  it("throws on partial Base failures when requested", async () => {
    const readContracts = vi.fn(async ({ contracts }) =>
      contracts.map((contract: { readonly functionName: string }) =>
        contract.functionName === "decimals"
          ? { status: "success", result: 6 }
          : { status: "failure", error: new Error("multicall failed") }
      )
    );
    const client = mockBatchedPublicClient(readContracts);

    await expect(
      getBaseZodiacsOwnership(client, ownerAddress, { onPartialFailure: "throw" })
    ).rejects.toBeInstanceOf(PartialOwnershipReadError);
  });

  it("surfaces decimal read fallback as warnings", async () => {
    const readContracts = vi.fn(async ({ contracts }) =>
      contracts.map((contract: { readonly address: string; readonly functionName: string }) =>
        contract.functionName === "decimals"
          ? { status: "failure", error: new Error("decimals unavailable") }
          : {
              status: "success",
              result:
                contract.address.toLowerCase() === BASE_BRIDGED_ZODIAC_ADDRESSES.aries.toLowerCase()
                  ? 1_000_000n
                  : 0n
            }
      )
    );
    const client = mockBatchedPublicClient(readContracts);
    const ownership = await getBaseZodiacsOwnership(client, ownerAddress);

    expect(ownership.status).toBe("available");
    expect(ownership.errors).toEqual([]);
    expect(ownership.warnings?.[0]?.message).toContain("decimals read failed");
    expect(ownership.balancesBySign?.aries.warning?.message).toContain("used registry decimals");
  });
});

describe("explicit Solana read aliases", () => {
  it("marks Solana reads as native SPL representations", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () => ({
        value: []
      }))
    };

    await expect(
      getSolanaZodiacBalance(connection, "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ", "aries")
    ).resolves.toMatchObject({
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
