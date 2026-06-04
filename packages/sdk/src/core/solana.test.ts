import { describe, expect, it, vi } from "vitest";
import {
  ZodiacsValidationError,
  PartialOwnershipReadError,
  getZodiacsOwnership,
  getHeldZodiacs,
  getSolanaZodiacsOwnershipBatched,
  getZodiacBalance,
  type ParsedTokenAccountResponse,
  type SolanaBalanceConnection
} from "./index.js";
import { getMintAddress } from "./registry.js";

const walletAddress = "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ";

function parsedTokenResponse(...amounts: readonly string[]): ParsedTokenAccountResponse {
  return {
    value: amounts.map((amount) => ({
      account: {
        data: {
          parsed: {
            info: {
              tokenAmount: {
                amount,
                decimals: 6,
                uiAmount: Number(amount) / 10 ** 6,
                uiAmountString: String(Number(amount) / 10 ** 6)
              }
            }
          }
        }
      }
    }))
  };
}

function parsedWalletTokenResponse(
  ...accounts: readonly {
    readonly mint: string;
    readonly amount: string;
    readonly decimals?: number;
  }[]
): ParsedTokenAccountResponse {
  return {
    value: accounts.map(({ mint, amount, decimals = 6 }) => ({
      account: {
        data: {
          parsed: {
            info: {
              mint,
              tokenAmount: {
                amount,
                decimals,
                uiAmount: Number(amount) / 10 ** decimals,
                uiAmountString: String(Number(amount) / 10 ** decimals)
              }
            }
          }
        }
      }
    }))
  };
}

describe("read-only Solana balances", () => {
  it("returns a normalized balance for a zodiac token", async () => {
    const getParsedTokenAccountsByOwner = vi.fn(async () => parsedTokenResponse("2500000"));
    const connection: SolanaBalanceConnection = { getParsedTokenAccountsByOwner };

    const balance = await getZodiacBalance(connection, walletAddress, "aries");

    expect(balance).toMatchObject({
      sign: "aries",
      walletAddress,
      mintAddress: getMintAddress("aries"),
      rawAmount: "2500000",
      decimals: 6,
      uiAmount: 2.5,
      uiAmountString: "2.5",
      status: "ok"
    });
    expect(getParsedTokenAccountsByOwner).toHaveBeenCalledOnce();
  });

  it("returns zero when the wallet has no token account for the mint", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () => ({ value: [] }))
    };

    const balance = await getZodiacBalance(connection, walletAddress, "taurus");

    expect(balance.rawAmount).toBe("0");
    expect(balance.uiAmount).toBe(0);
    expect(balance.uiAmountString).toBe("0");
    expect(balance.status).toBe("zero");
  });

  it("sums multiple token accounts for the same mint", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () =>
        parsedTokenResponse("1000000", "2250000", "750000")
      )
    };

    const balance = await getZodiacBalance(connection, walletAddress, "leo");

    expect(balance.rawAmount).toBe("4000000");
    expect(balance.uiAmount).toBe(4);
    expect(balance.uiAmountString).toBe("4");
    expect(balance.status).toBe("ok");
  });

  it("returns a typed unavailable state when RPC fails", async () => {
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner: vi.fn(async () => {
        throw new Error("RPC unavailable");
      })
    };

    const balance = await getZodiacBalance(connection, walletAddress, "gemini");

    expect(balance.status).toBe("unavailable");
    expect(balance.error).toEqual({
      code: "rpc-error",
      message: "RPC unavailable"
    });
    expect(balance.uiAmount).toBe(0);
    expect(balance.uiAmountString).toBe("0");
  });

  it("throws for invalid inputs before making RPC calls", async () => {
    const getParsedTokenAccountsByOwner = vi.fn(async () => ({ value: [] }));
    const connection: SolanaBalanceConnection = { getParsedTokenAccountsByOwner };

    await expect(getZodiacBalance(connection, "not-a-wallet", "aries")).rejects.toMatchObject({
      code: "invalid-wallet-address",
      name: "ZodiacsValidationError"
    });
    await expect(
      getZodiacBalance(connection, walletAddress, "ophiuchus" as never)
    ).rejects.toMatchObject({
      code: "invalid-zodiac-sign",
      name: "ZodiacsValidationError"
    });
    await expect(getZodiacBalance(connection, walletAddress, "aries")).resolves.toBeDefined();
    expect(getParsedTokenAccountsByOwner).toHaveBeenCalledOnce();
  });

  it("exposes validation errors as typed errors", async () => {
    await expect(
      getZodiacBalance({} as SolanaBalanceConnection, walletAddress, "aries")
    ).rejects.toBeInstanceOf(ZodiacsValidationError);
  });

  it("returns a normalized Zodiacs ownership object", async () => {
    const getParsedTokenAccountsByOwner = vi.fn(async () =>
      parsedWalletTokenResponse(
        { mint: getMintAddress("aries"), amount: "1000000" },
        { mint: "11111111111111111111111111111111", amount: "999999999" }
      )
    );
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner
    };

    const ownership = await getZodiacsOwnership(connection, walletAddress);
    const held = await getHeldZodiacs(connection, walletAddress);
    const firstCall = getParsedTokenAccountsByOwner.mock.calls[0] as unknown[] | undefined;

    expect(getParsedTokenAccountsByOwner).toHaveBeenCalledTimes(2);
    expect(firstCall?.[1]).toHaveProperty("programId");
    expect(ownership.status).toBe("available");
    expect(ownership.owner).toBe(walletAddress);
    expect(ownership.checkedAt).toEqual(expect.any(String));
    expect(ownership.holdings).toHaveLength(12);
    expect(ownership.holdings.map((holding) => holding.sign)).toHaveLength(12);
    expect(ownership.heldSigns).toEqual(["aries"]);
    expect(ownership.zeroBalanceSigns).toEqual(expect.arrayContaining(["taurus"]));
    expect(ownership.unavailableSigns).toEqual([]);
    expect(ownership.confirmedAbsentSigns).toEqual(expect.arrayContaining(["taurus"]));
    expect(ownership.balancesBySign?.aries.rawAmount).toBe("1000000");
    expect(ownership.representations).toHaveLength(12);
    expect(ownership.totalHeld).toBe(1);
    expect(ownership.errors).toEqual([]);
    expect(held.map((holding) => holding.sign)).toEqual(["aries"]);
    expect(held.every((holding) => holding.balance.rawAmount !== "0")).toBe(true);
  });

  it("resolves ownership from one wallet-level token account scan", async () => {
    const getParsedTokenAccountsByOwner = vi.fn(async () =>
      parsedWalletTokenResponse(
        { mint: getMintAddress("aries"), amount: "1000000" },
        { mint: getMintAddress("taurus"), amount: "0" },
        { mint: getMintAddress("gemini"), amount: "2500000" }
      )
    );
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner
    };

    const ownership = await getSolanaZodiacsOwnershipBatched(connection, walletAddress);
    const firstCall = getParsedTokenAccountsByOwner.mock.calls[0] as unknown[] | undefined;

    expect(getParsedTokenAccountsByOwner).toHaveBeenCalledTimes(1);
    expect(firstCall?.[1]).toHaveProperty("programId");
    expect(ownership.heldSigns).toEqual(["aries", "gemini"]);
    expect(ownership.holdings).toHaveLength(12);
  });

  it("falls back to per-mint reads when wallet-level scans are unavailable", async () => {
    const getParsedTokenAccountsByOwner = vi.fn(async (_owner, filter) => {
      if ("programId" in filter) {
        throw new Error("program scan unsupported");
      }

      return String(filter.mint) === getMintAddress("cancer")
        ? parsedTokenResponse("3000000")
        : { value: [] };
    });
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner
    };

    const ownership = await getSolanaZodiacsOwnershipBatched(connection, walletAddress);

    expect(getParsedTokenAccountsByOwner).toHaveBeenCalledTimes(13);
    expect(ownership.status).toBe("available");
    expect(ownership.heldSigns).toEqual(["cancer"]);
  });

  it("supports Solana partial failure throw and ignore modes", async () => {
    const getParsedTokenAccountsByOwner = vi.fn(async () =>
      parsedWalletTokenResponse({ mint: getMintAddress("aries"), amount: "not-an-amount" })
    );
    const connection: SolanaBalanceConnection = {
      getParsedTokenAccountsByOwner
    };

    await expect(
      getSolanaZodiacsOwnershipBatched(connection, walletAddress, { onPartialFailure: "throw" })
    ).rejects.toBeInstanceOf(PartialOwnershipReadError);

    const ignored = await getSolanaZodiacsOwnershipBatched(connection, walletAddress, {
      onPartialFailure: "ignore"
    });

    expect(ignored).toMatchObject({
      status: "partial",
      unavailableSigns: ["aries"],
      errors: [],
      warnings: []
    });
    expect(ignored.confirmedAbsentSigns).not.toContain("aries");
  });
});
