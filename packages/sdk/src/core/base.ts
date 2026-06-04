import { erc20Abi, getAddress, isAddress } from "viem";
import { PartialOwnershipReadError } from "./errors.js";
import { formatTokenAmount } from "./format.js";
import { getAllBaseBridgedZodiacs, getBaseZodiacRepresentation } from "./official-registry.js";
import type {
  BaseZodiacBalance,
  BaseZodiacsHolding,
  BaseZodiacsOwnership,
  ZodiacRepresentation,
  ZodiacSerializableError,
  ZodiacSign,
  ZodiacsOwnershipStatus
} from "./types.js";

export type BaseZodiacsBlockTag = "latest" | "safe" | "finalized" | "pending";

export interface BaseZodiacsReadOptions {
  readonly includeZeroBalances?: boolean;
  readonly minBalance?: bigint;
  readonly blockNumber?: bigint;
  readonly blockTag?: BaseZodiacsBlockTag;
  readonly signal?: AbortSignal;
  readonly onPartialFailure?: "throw" | "warn" | "ignore";
}

export interface ZodiacsBasePublicClient {
  readonly readContract: (...parameters: any[]) => Promise<unknown>;
  readonly readContracts?: (...parameters: any[]) => Promise<readonly ReadContractsResult[]>;
  readonly getBlockNumber?: () => Promise<bigint>;
  readonly chain?: { readonly id?: number } | undefined;
}

type ReadContractsResult =
  | { readonly status: "success"; readonly result: unknown }
  | { readonly status: "failure"; readonly error?: unknown };

const decimalsCache = new WeakMap<object, Map<string, number>>();

export async function getBaseZodiacBalance(
  publicClient: ZodiacsBasePublicClient,
  ownerAddress: string,
  sign: ZodiacSign,
  options: BaseZodiacsReadOptions = {}
): Promise<BaseZodiacBalance> {
  throwIfAborted(options.signal);
  const representation = getBaseZodiacRepresentation(sign);
  const normalizedOwner = normalizeOwnerAddress(ownerAddress);

  if (!normalizedOwner) {
    return unavailableBaseBalance(representation, ownerAddress, {
      code: "invalid-zodiac-address",
      message: `Invalid Base owner address: ${ownerAddress}`
    });
  }

  try {
    const [rawAmount, decimals] = await Promise.all([
      publicClient.readContract({
        address: representation.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [normalizedOwner],
        ...getBlockReadOptions(options)
      }),
      publicClient.readContract({
        address: representation.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
        ...getBlockReadOptions(options)
      })
    ]);
    throwIfAborted(options.signal);
    const rawAmountBigInt = BigInt(rawAmount as bigint | number | string);
    const decimalsNumber = Number(decimals);
    const rawAmountString = rawAmountBigInt.toString();

    return {
      sign,
      ownerAddress: normalizedOwner,
      representation,
      chain: "base",
      kind: "bridged",
      tokenStandard: "ERC20",
      rawAmount: rawAmountString,
      uiAmountString: formatTokenAmount(rawAmountString, decimalsNumber),
      decimals: decimalsNumber,
      status: rawAmountBigInt === 0n ? "zero" : "ok"
    };
  } catch (error) {
    return unavailableBaseBalance(representation, normalizedOwner, {
      code: "zodiac-read-unavailable",
      message: error instanceof Error ? error.message : "Base ERC-20 balance read failed."
    });
  }
}

export async function getBaseZodiacBalances(
  publicClient: ZodiacsBasePublicClient,
  ownerAddress: string,
  options: BaseZodiacsReadOptions = {}
): Promise<readonly BaseZodiacBalance[]> {
  if (typeof publicClient.readContracts !== "function") {
    return Promise.all(
      getAllBaseBridgedZodiacs().map((representation) =>
        getBaseZodiacBalance(publicClient, ownerAddress, representation.sign, options)
      )
    );
  }

  return readBaseZodiacBalancesBatched(publicClient, ownerAddress, options);
}

export async function getBaseZodiacsOwnership(
  publicClient: ZodiacsBasePublicClient,
  ownerAddress: string,
  options: BaseZodiacsReadOptions = {}
): Promise<BaseZodiacsOwnership> {
  const checkedAt = new Date().toISOString();
  const balances = await getBaseZodiacBalances(publicClient, ownerAddress, options);
  const minBalance = options.minBalance ?? 1n;
  const holdings = balances
    .map<BaseZodiacsHolding>((balance) => ({
      sign: balance.sign,
      representation: balance.representation,
      balance,
      held: balance.status === "ok" && BigInt(balance.rawAmount) >= minBalance
    }))
    .filter((holding) => (options.includeZeroBalances === false ? holding.held : true));
  const heldSigns = holdings.filter((holding) => holding.held).map((holding) => holding.sign);
  const zeroBalanceSigns = balances
    .filter((balance) => balance.status === "zero")
    .map((balance) => balance.sign);
  const unavailableSigns = balances
    .filter((balance) => balance.status === "unavailable")
    .map((balance) => balance.sign);
  const allHeldSigns = balances
    .filter((balance) => balance.status === "ok" && BigInt(balance.rawAmount) >= minBalance)
    .map((balance) => balance.sign);
  const errors = balances.flatMap((balance) => (balance.error ? [balance.error] : []));
  const warnings = collectBaseWarnings(balances);
  const partialFailureMode = options.onPartialFailure ?? "warn";

  if (errors.length > 0 && partialFailureMode === "throw") {
    throw new PartialOwnershipReadError(errors);
  }

  const owner = normalizeOwnerAddress(ownerAddress) ?? ownerAddress;
  const confirmedAbsentSigns = zeroBalanceSigns;

  return {
    owner,
    ownerAddress: owner,
    chain: "base",
    checkedAt,
    ...(await getReadBlockNumber(publicClient, options)),
    status: getBaseOwnershipStatus(balances),
    holdings,
    heldSigns,
    zeroBalanceSigns,
    unavailableSigns,
    confirmedAbsentSigns,
    missingSigns: confirmedAbsentSigns,
    balancesBySign: toBalancesBySign(balances),
    representations: getAllBaseBridgedZodiacs(),
    totalHeld: allHeldSigns.length,
    errors: partialFailureMode === "ignore" ? [] : errors,
    warnings: partialFailureMode === "ignore" ? [] : warnings
  };
}

export const getBaseZodiacsOwnershipBatched = getBaseZodiacsOwnership;

export async function getBaseHeldZodiacs(
  publicClient: ZodiacsBasePublicClient,
  ownerAddress: string,
  options: BaseZodiacsReadOptions = {}
): Promise<readonly BaseZodiacsHolding[]> {
  const ownership = await getBaseZodiacsOwnership(publicClient, ownerAddress, options);
  return ownership.holdings.filter((holding) => holding.held);
}

function unavailableBaseBalance(
  representation: ZodiacRepresentation,
  ownerAddress: string,
  error: ZodiacSerializableError
): BaseZodiacBalance {
  return {
    sign: representation.sign,
    ownerAddress,
    representation,
    chain: "base",
    kind: "bridged",
    tokenStandard: "ERC20",
    rawAmount: "0",
    uiAmountString: "0",
    decimals: representation.decimals ?? 0,
    status: "unavailable",
    error
  };
}

function getBaseOwnershipStatus(balances: readonly BaseZodiacBalance[]): ZodiacsOwnershipStatus {
  const unavailableCount = balances.filter((balance) => balance.status === "unavailable").length;

  if (unavailableCount === 0) {
    return "available";
  }

  return unavailableCount === balances.length ? "unavailable" : "partial";
}

function normalizeOwnerAddress(ownerAddress: string): `0x${string}` | null {
  return isAddress(ownerAddress) ? getAddress(ownerAddress) : null;
}

async function readBaseZodiacBalancesBatched(
  publicClient: ZodiacsBasePublicClient,
  ownerAddress: string,
  options: BaseZodiacsReadOptions
): Promise<readonly BaseZodiacBalance[]> {
  throwIfAborted(options.signal);
  const representations = getAllBaseBridgedZodiacs();
  const normalizedOwner = normalizeOwnerAddress(ownerAddress);

  if (!normalizedOwner) {
    return representations.map((representation) =>
      unavailableBaseBalance(representation, ownerAddress, {
        code: "invalid-zodiac-address",
        message: `Invalid Base owner address: ${ownerAddress}`
      })
    );
  }

  const { decimalsByAddress, warningsByAddress } = await getBaseDecimals(
    publicClient,
    representations,
    options
  );
  throwIfAborted(options.signal);
  const balanceResults = await publicClient.readContracts?.({
    contracts: representations.map((representation) => ({
      address: representation.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [normalizedOwner]
    })),
    allowFailure: true,
    ...getBlockReadOptions(options)
  });
  throwIfAborted(options.signal);

  return representations.map((representation, index) => {
    const result = balanceResults?.[index];
    const addressKey = representation.address.toLowerCase();
    const decimals = decimalsByAddress.get(addressKey) ?? representation.decimals ?? 0;
    const warning = warningsByAddress.get(addressKey);

    if (!result || result.status === "failure") {
      return unavailableBaseBalance(representation, normalizedOwner, {
        code: "zodiac-read-unavailable",
        message: formatUnknownError(
          result?.error,
          `${representation.sign} Base ERC-20 balance read failed.`
        )
      });
    }

    const rawAmount = BigInt(result.result as bigint | number | string);
    const rawAmountString = rawAmount.toString();

    return {
      sign: representation.sign,
      ownerAddress: normalizedOwner,
      representation,
      chain: "base",
      kind: "bridged",
      tokenStandard: "ERC20",
      rawAmount: rawAmountString,
      uiAmountString: formatTokenAmount(rawAmountString, decimals),
      decimals,
      status: rawAmount === 0n ? "zero" : "ok",
      ...(warning ? { warning } : {})
    };
  });
}

async function getBaseDecimals(
  publicClient: ZodiacsBasePublicClient,
  representations: readonly ZodiacRepresentation[],
  options: BaseZodiacsReadOptions
): Promise<{
  readonly decimalsByAddress: Map<string, number>;
  readonly warningsByAddress: Map<string, ZodiacSerializableError>;
}> {
  const cache = getDecimalsCache(publicClient);
  const uncached = representations.filter(
    (representation) => !cache.has(getDecimalsCacheKey(publicClient, representation))
  );
  const warningsByAddress = new Map<string, ZodiacSerializableError>();

  if (uncached.length === 0) {
    return {
      decimalsByAddress: mapDecimals(publicClient, representations),
      warningsByAddress
    };
  }

  const results = await publicClient.readContracts?.({
    contracts: uncached.map((representation) => ({
      address: representation.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals"
    })),
    allowFailure: true,
    ...getBlockReadOptions(options)
  });

  uncached.forEach((representation, index) => {
    const result = results?.[index];
    const key = getDecimalsCacheKey(publicClient, representation);

    if (result?.status === "success") {
      cache.set(key, Number(result.result));
      return;
    }

    if (typeof representation.decimals === "number") {
      cache.set(key, representation.decimals);
      warningsByAddress.set(representation.address.toLowerCase(), {
        code: "zodiac-read-unavailable",
        message: `${representation.sign} Base ERC-20 decimals read failed; used registry decimals.`
      });
    }
  });

  return {
    decimalsByAddress: mapDecimals(publicClient, representations),
    warningsByAddress
  };
}

function getDecimalsCache(publicClient: ZodiacsBasePublicClient): Map<string, number> {
  let cache = decimalsCache.get(publicClient);

  if (!cache) {
    cache = new Map();
    decimalsCache.set(publicClient, cache);
  }

  return cache;
}

function getDecimalsCacheKey(
  publicClient: ZodiacsBasePublicClient,
  representation: ZodiacRepresentation
): string {
  return `${publicClient.chain?.id ?? "unknown"}:${representation.address.toLowerCase()}`;
}

function mapDecimals(
  publicClient: ZodiacsBasePublicClient,
  representations: readonly ZodiacRepresentation[]
): Map<string, number> {
  const cache = getDecimalsCache(publicClient);

  return new Map(
    representations.map((representation) => [
      representation.address.toLowerCase(),
      cache.get(getDecimalsCacheKey(publicClient, representation)) ?? representation.decimals ?? 0
    ])
  );
}

function toBalancesBySign(
  balances: readonly BaseZodiacBalance[]
): Readonly<Record<ZodiacSign, BaseZodiacBalance>> {
  return Object.fromEntries(balances.map((balance) => [balance.sign, balance])) as Readonly<
    Record<ZodiacSign, BaseZodiacBalance>
  >;
}

function collectBaseWarnings(
  balances: readonly BaseZodiacBalance[]
): readonly ZodiacSerializableError[] {
  return balances.flatMap((balance) => {
    const warnings: ZodiacSerializableError[] = [];

    if (balance.warning) {
      warnings.push(balance.warning);
    }

    if (balance.status === "unavailable" && balance.error) {
      warnings.push({
        code: "zodiac-read-unavailable",
        message: `${balance.sign}: ${balance.error?.message ?? "Base read unavailable."}`
      });
    }

    return warnings;
  });
}

async function getReadBlockNumber(
  publicClient: ZodiacsBasePublicClient,
  options: BaseZodiacsReadOptions
): Promise<{ readonly blockNumber?: bigint }> {
  if (options.blockNumber !== undefined) {
    return { blockNumber: options.blockNumber };
  }

  if (typeof publicClient.getBlockNumber !== "function") {
    return {};
  }

  try {
    return { blockNumber: await publicClient.getBlockNumber() };
  } catch {
    return {};
  }
}

function getBlockReadOptions(options: BaseZodiacsReadOptions): {
  readonly blockNumber?: bigint;
  readonly blockTag?: BaseZodiacsBlockTag;
} {
  return {
    ...(options.blockNumber !== undefined ? { blockNumber: options.blockNumber } : {}),
    ...(options.blockTag !== undefined ? { blockTag: options.blockTag } : {})
  };
}

function formatUnknownError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new Error("Base Zodiacs ownership read aborted.");
  }
}
