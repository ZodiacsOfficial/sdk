import {
  getAllBaseBridgedZodiacs,
  getAllZodiacTokens,
  getSolanaZodiacRepresentation,
  ZODIACS_REGISTRY
} from "./core/index.js";
import type {
  BaseZodiacBalance,
  BaseZodiacsHolding,
  BaseZodiacsOwnership,
  CrossChainZodiacsOwnership,
  ParsedTokenAccountResponse,
  SolanaBalanceConnection,
  ZodiacsBasePublicClient,
  ZodiacBalance,
  ZodiacSign,
  ZodiacsHolding,
  ZodiacsOwnership
} from "./core/index.js";
import { formatTokenAmount, rawAmountToNumber } from "./core/format.js";
import { ZODIAC_SIGNS } from "./core/types.js";

export interface MockOwnershipOptions {
  readonly heldSigns?: readonly ZodiacSign[];
  readonly walletAddress?: string;
}

export interface MockBasePublicClientOptions {
  readonly heldSigns?: readonly ZodiacSign[];
  readonly rawAmountsBySign?: Partial<Record<ZodiacSign, bigint>>;
  readonly decimals?: number;
  readonly blockNumber?: bigint;
}

export interface MockSolanaConnectionOptions {
  readonly heldSigns?: readonly ZodiacSign[];
  readonly rawAmountsBySign?: Partial<Record<ZodiacSign, string>>;
  readonly decimals?: number;
}

export function createMockOwnership(options: MockOwnershipOptions = {}): ZodiacsOwnership {
  const heldSigns = options.heldSigns ?? [];
  const walletAddress = options.walletAddress ?? "CWKQJJYec89wcx871C8vmyTPc3jhsdoAYs5aGffUtELJ";
  const checkedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
  const holdings = getAllZodiacTokens().map<ZodiacsHolding>((token) => {
    const held = heldSigns.includes(token.sign);
    const rawAmount = held ? String(10n ** BigInt(token.decimals)) : "0";
    const balance: ZodiacBalance = {
      sign: token.sign,
      token,
      representation: getSolanaZodiacRepresentation(token.sign),
      chain: "solana",
      kind: "native",
      tokenStandard: "SPL",
      walletAddress,
      mintAddress: token.mintAddress,
      rawAmount,
      decimals: token.decimals,
      uiAmount: rawAmountToNumber(rawAmount, token.decimals),
      uiAmountString: formatTokenAmount(rawAmount, token.decimals),
      status: held ? "ok" : "zero"
    };

    return {
      sign: token.sign,
      token,
      balance,
      held
    };
  });

  return {
    owner: walletAddress,
    walletAddress,
    chain: "solana",
    checkedAt,
    status: "available",
    holdings,
    heldSigns,
    zeroBalanceSigns: ZODIAC_SIGNS.filter((sign) => !heldSigns.includes(sign)),
    balancesBySign: Object.fromEntries(
      holdings.map((holding) => [holding.sign, holding.balance])
    ) as Readonly<Record<ZodiacSign, ZodiacBalance>>,
    representations: getAllZodiacTokens().map((token) => getSolanaZodiacRepresentation(token.sign)),
    totalHeld: heldSigns.length,
    errors: [],
    warnings: []
  };
}

export const mockEmptyOwnership: ZodiacsOwnership = createMockOwnership();

export const mockOneSignOwnership: ZodiacsOwnership = createMockOwnership({
  heldSigns: ["aries"]
});

export const mockFullWheelOwnership: ZodiacsOwnership = createMockOwnership({
  heldSigns: ZODIAC_SIGNS
});

export const mockMixedCrossChainOwnership: CrossChainZodiacsOwnership = {
  solana: createMockOwnership({
    heldSigns: ["aries", "gemini"]
  }),
  base: createMockBaseOwnership({
    heldSigns: ["gemini", "taurus"]
  })
};

export const mockRegistry = ZODIACS_REGISTRY;

export function mockBasePublicClient(
  options: MockBasePublicClientOptions = {}
): ZodiacsBasePublicClient {
  const decimals = options.decimals ?? 6;
  const blockNumber = options.blockNumber ?? 123n;
  const rawAmountsBySign = new Map<ZodiacSign, bigint>(
    ZODIAC_SIGNS.map((sign) => [
      sign,
      options.rawAmountsBySign?.[sign] ??
        (options.heldSigns?.includes(sign) ? 10n ** BigInt(decimals) : 0n)
    ])
  );

  const readContract = async ({
    address,
    functionName
  }: {
    readonly address: string;
    readonly functionName: string;
  }) => {
    if (functionName === "decimals") {
      return decimals;
    }

    return rawAmountsBySign.get(getSignByBaseAddress(address)) ?? 0n;
  };

  const readContracts = async ({
    contracts
  }: {
    readonly contracts: readonly { readonly address: string; readonly functionName: string }[];
  }) =>
    contracts.map((contract) => ({
      status: "success" as const,
      result:
        contract.functionName === "decimals"
          ? decimals
          : (rawAmountsBySign.get(getSignByBaseAddress(contract.address)) ?? 0n)
    }));

  return {
    chain: { id: 8453 },
    getBlockNumber: async () => blockNumber,
    readContract,
    readContracts
  };
}

export const mockBasePublicClientWithReadContracts = mockBasePublicClient;

export function mockBasePublicClientWithoutReadContracts(
  options: MockBasePublicClientOptions = {}
): ZodiacsBasePublicClient {
  const client = mockBasePublicClient(options);

  return {
    ...(client.chain ? { chain: client.chain } : {}),
    ...(client.getBlockNumber ? { getBlockNumber: client.getBlockNumber } : {}),
    readContract: client.readContract
  };
}

export function mockPartialFailureBaseClient(
  options: MockBasePublicClientOptions = {}
): ZodiacsBasePublicClient {
  const healthy = mockBasePublicClient(options);

  return {
    ...healthy,
    readContract: async ({
      address,
      functionName
    }: {
      readonly address: string;
      readonly functionName: string;
    }) => {
      if (functionName === "balanceOf" && getSignByBaseAddress(address) === "aries") {
        throw new Error("aries Base read unavailable");
      }

      return healthy.readContract({ address, functionName });
    },
    readContracts: async ({
      contracts
    }: {
      readonly contracts: readonly { readonly address: string; readonly functionName: string }[];
    }) =>
      contracts.map((contract) => {
        if (
          contract.functionName === "balanceOf" &&
          getSignByBaseAddress(contract.address) === "aries"
        ) {
          return {
            status: "failure" as const,
            error: new Error("aries Base read unavailable")
          };
        }

        return {
          status: "success" as const,
          result: contract.functionName === "decimals" ? (options.decimals ?? 6) : 0n
        };
      })
  };
}

export function mockSolanaConnection(
  options: MockSolanaConnectionOptions = {}
): SolanaBalanceConnection {
  const decimals = options.decimals ?? 6;
  const rawAmountsBySign = new Map<ZodiacSign, string>(
    ZODIAC_SIGNS.map((sign) => [
      sign,
      options.rawAmountsBySign?.[sign] ??
        (options.heldSigns?.includes(sign) ? String(10n ** BigInt(decimals)) : "0")
    ])
  );

  return {
    getParsedTokenAccountsByOwner: async (
      _ownerAddress,
      filter
    ): Promise<ParsedTokenAccountResponse> => {
      const tokens = getAllZodiacTokens();

      if ("mint" in filter) {
        const token = tokens.find((item) => item.mintAddress === String(filter.mint));
        const amount = token ? (rawAmountsBySign.get(token.sign) ?? "0") : "0";
        return amount === "0" || !token
          ? { value: [] }
          : parsedTokenAccounts([{ mint: token.mintAddress, amount, decimals }]);
      }

      return parsedTokenAccounts(
        tokens.flatMap((token) => {
          const amount = rawAmountsBySign.get(token.sign) ?? "0";
          return amount === "0" ? [] : [{ mint: token.mintAddress, amount, decimals }];
        })
      );
    }
  };
}

export const mockSolanaConnectionWithWalletScan = mockSolanaConnection;

export function mockPartialFailureSolanaConnection(): SolanaBalanceConnection {
  return {
    getParsedTokenAccountsByOwner: async (
      _ownerAddress,
      filter
    ): Promise<ParsedTokenAccountResponse> => {
      if ("mint" in filter) {
        return { value: [] };
      }

      return {
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    mint: getAllZodiacTokens()[0]!.mintAddress,
                    tokenAmount: {
                      amount: "not-an-amount",
                      decimals: 6,
                      uiAmount: null,
                      uiAmountString: "not-an-amount"
                    }
                  }
                }
              }
            }
          }
        ]
      };
    }
  };
}

export function createMockBaseOwnership(
  options: MockBasePublicClientOptions = {}
): BaseZodiacsOwnership {
  const heldSigns = options.heldSigns ?? [];
  const checkedAt = new Date("2026-01-01T00:00:00.000Z").toISOString();
  const representations = getAllBaseBridgedZodiacs();
  const balances = representations.map<BaseZodiacBalance>((representation) => {
    const rawAmount =
      options.rawAmountsBySign?.[representation.sign] ??
      (heldSigns.includes(representation.sign) ? 1_000_000n : 0n);
    const rawAmountString = rawAmount.toString();

    return {
      sign: representation.sign,
      ownerAddress: "0x1111111111111111111111111111111111111111",
      representation,
      chain: "base",
      kind: "bridged",
      tokenStandard: "ERC20",
      rawAmount: rawAmountString,
      uiAmountString: formatTokenAmount(rawAmountString, representation.decimals ?? 6),
      decimals: representation.decimals ?? 6,
      status: rawAmount === 0n ? "zero" : "ok"
    };
  });
  const holdings = balances.map<BaseZodiacsHolding>((balance) => ({
    sign: balance.sign,
    representation: balance.representation,
    balance,
    held: balance.rawAmount !== "0"
  }));

  return {
    ownerAddress: "0x1111111111111111111111111111111111111111",
    owner: "0x1111111111111111111111111111111111111111",
    chain: "base",
    checkedAt,
    status: "available",
    holdings,
    heldSigns,
    zeroBalanceSigns: ZODIAC_SIGNS.filter((sign) => !heldSigns.includes(sign)),
    confirmedAbsentSigns: ZODIAC_SIGNS.filter((sign) => !heldSigns.includes(sign)),
    missingSigns: ZODIAC_SIGNS.filter((sign) => !heldSigns.includes(sign)),
    balancesBySign: Object.fromEntries(
      balances.map((balance) => [balance.sign, balance])
    ) as Readonly<Record<ZodiacSign, BaseZodiacBalance>>,
    representations,
    totalHeld: heldSigns.length,
    errors: [],
    warnings: []
  };
}

function getSignByBaseAddress(address: string): ZodiacSign {
  return (
    getAllBaseBridgedZodiacs().find(
      (representation) => representation.address.toLowerCase() === address.toLowerCase()
    )?.sign ?? "aries"
  );
}

function parsedTokenAccounts(
  accounts: readonly { readonly mint: string; readonly amount: string; readonly decimals: number }[]
): ParsedTokenAccountResponse {
  return {
    value: accounts.map((account) => ({
      account: {
        data: {
          parsed: {
            info: {
              mint: account.mint,
              tokenAmount: {
                amount: account.amount,
                decimals: account.decimals,
                uiAmount: rawAmountToNumber(account.amount, account.decimals),
                uiAmountString: formatTokenAmount(account.amount, account.decimals)
              }
            }
          }
        }
      }
    }))
  };
}
