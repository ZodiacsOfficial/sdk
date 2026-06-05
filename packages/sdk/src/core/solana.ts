import {
  ZODIAC_SIGNS,
  type ZodiacsOwnership,
  type ZodiacsHolding,
  type ConnectionOrRpcUrl,
  type ParsedTokenAccountAmount,
  type ParsedTokenAccountResponse,
  type ReadonlyZodiacBalanceReader,
  type SolanaBalanceConnection,
  type TokenBalance,
  type ZodiacBalance,
  type ZodiacBalanceError,
  type ZodiacSign
} from "./types.js";
import { isSolanaAddressLike, normalizeSolanaAddress } from "./address.js";
import { getAllZodiacTokens, getZodiacToken } from "./registry.js";
import { getAllSolanaNativeZodiacs, getSolanaZodiacRepresentation } from "./official-registry.js";
import { rawAmountToNumber } from "./format.js";
import { PartialOwnershipReadError, ZodiacsValidationError } from "./errors.js";

const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

interface SolanaPublicKeyLike {
  readonly toBase58: () => string;
  readonly toString: () => string;
}

interface SolanaJsonRpcResponse {
  readonly result?: ParsedTokenAccountResponse;
  readonly error?: {
    readonly message?: string;
  };
}

export interface SolanaZodiacsReadOptions {
  readonly signal?: AbortSignal;
  readonly onPartialFailure?: "throw" | "warn" | "ignore";
}

export function createSolanaConnection(
  connectionOrRpcUrl: ConnectionOrRpcUrl
): SolanaBalanceConnection {
  if (typeof connectionOrRpcUrl !== "string") {
    if (typeof connectionOrRpcUrl.getParsedTokenAccountsByOwner !== "function") {
      throw new ZodiacsValidationError(
        "invalid-solana-connection",
        "Invalid Solana connection: getParsedTokenAccountsByOwner is required."
      );
    }

    return connectionOrRpcUrl;
  }

  const rpcUrl = connectionOrRpcUrl.trim();

  if (!rpcUrl) {
    throw new ZodiacsValidationError(
      "invalid-rpc-endpoint",
      "Invalid RPC endpoint: URL is required."
    );
  }

  try {
    new URL(rpcUrl);
  } catch {
    throw new ZodiacsValidationError(
      "invalid-rpc-endpoint",
      `Invalid RPC endpoint: ${connectionOrRpcUrl}`
    );
  }

  return createJsonRpcSolanaConnection(rpcUrl);
}

export function createReadonlySolanaBalanceReader(
  connectionOrRpcUrl: ConnectionOrRpcUrl
): ReadonlyZodiacBalanceReader {
  const connection = createSolanaConnection(connectionOrRpcUrl);

  return {
    getTokenBalance: async (ownerAddress, mintAddress, token): Promise<TokenBalance | null> => {
      const walletPublicKey = createPublicKey(ownerAddress, "wallet address");
      const mintPublicKey = createPublicKey(mintAddress, `${token.sign} mint address`);
      const response = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        mint: mintPublicKey
      });
      const amount = normalizeParsedTokenAccounts(response, token.decimals);

      if (amount.rawAmount === "0") {
        return null;
      }

      return {
        ownerAddress,
        mintAddress,
        amountRaw: amount.rawAmount,
        decimals: amount.decimals,
        uiAmount: amount.uiAmount
      };
    }
  };
}

export async function getZodiacBalance(
  connectionOrRpcUrl: ConnectionOrRpcUrl,
  walletAddress: string,
  sign: ZodiacSign
): Promise<ZodiacBalance> {
  assertZodiacSignInput(sign);
  const walletPublicKey = createPublicKey(walletAddress, "wallet address");
  const token = getZodiacToken(sign);
  const mintPublicKey = createPublicKey(token.mintAddress, `${sign} mint address`);
  const connection = createSolanaConnection(connectionOrRpcUrl);

  try {
    const response = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
      mint: mintPublicKey
    });

    const amount = normalizeParsedTokenAccounts(response, token.decimals);

    return {
      sign,
      token,
      representation: getSolanaZodiacRepresentation(sign),
      chain: "solana",
      kind: "native",
      tokenStandard: "SPL",
      walletAddress,
      mintAddress: token.mintAddress,
      rawAmount: amount.rawAmount,
      decimals: amount.decimals,
      uiAmount: amount.uiAmount,
      uiAmountString: amount.uiAmountString,
      status: amount.rawAmount === "0" ? "zero" : "ok"
    };
  } catch (error) {
    return unavailableBalance(
      sign,
      walletAddress,
      error instanceof Error ? error.message : "Solana RPC balance request failed."
    );
  }
}

export async function getZodiacsOwnership(
  connectionOrRpcUrl: ConnectionOrRpcUrl,
  walletAddress: string,
  options: SolanaZodiacsReadOptions = {}
): Promise<ZodiacsOwnership> {
  throwIfAborted(options.signal);
  const checkedAt = new Date().toISOString();
  const walletPublicKey = createPublicKey(walletAddress, "wallet address");
  const connection = createSolanaConnection(connectionOrRpcUrl);

  let balances: readonly ZodiacBalance[];

  try {
    const response = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
      programId: SPL_TOKEN_PROGRAM_ID
    });
    throwIfAborted(options.signal);
    balances = normalizeWalletTokenAccounts(response, walletAddress);
  } catch (error) {
    balances = await Promise.all(
      ZODIAC_SIGNS.map((sign) => getZodiacBalance(connection, walletAddress, sign))
    );
  }

  const holdings = balances.map<ZodiacsHolding>((balance) => ({
    sign: balance.sign,
    token: balance.token,
    balance,
    held: balance.status === "ok" && balance.rawAmount !== "0"
  }));
  const heldSigns = holdings.filter((holding) => holding.held).map((holding) => holding.sign);
  const zeroBalanceSigns = balances
    .filter((balance) => balance.status === "zero")
    .map((balance) => balance.sign);
  const unavailableSigns = balances
    .filter((balance) => balance.status === "unavailable")
    .map((balance) => balance.sign);
  const errors = balances.flatMap((balance) => (balance.error ? [balance.error] : []));
  const partialFailureMode = options.onPartialFailure ?? "warn";

  if (errors.length > 0 && partialFailureMode === "throw") {
    throw new PartialOwnershipReadError(errors);
  }

  return {
    owner: walletAddress,
    walletAddress,
    chain: "solana",
    checkedAt,
    status: getZodiacsOwnershipStatus(balances),
    holdings,
    heldSigns,
    zeroBalanceSigns,
    unavailableSigns,
    confirmedAbsentSigns: zeroBalanceSigns,
    balancesBySign: toBalancesBySign(balances),
    representations: getAllSolanaNativeZodiacs(),
    totalHeld: heldSigns.length,
    errors: partialFailureMode === "ignore" ? [] : errors,
    warnings: partialFailureMode === "ignore" ? [] : collectSolanaWarnings(balances)
  };
}

export const getSolanaZodiacBalance = getZodiacBalance;

export async function getSolanaZodiacBalances(
  connectionOrRpcUrl: ConnectionOrRpcUrl,
  walletAddress: string
): Promise<readonly ZodiacBalance[]> {
  const connection = createSolanaConnection(connectionOrRpcUrl);
  return Promise.all(ZODIAC_SIGNS.map((sign) => getZodiacBalance(connection, walletAddress, sign)));
}

export const getSolanaZodiacsOwnership = getZodiacsOwnership;

export const getSolanaZodiacsOwnershipBatched = getZodiacsOwnership;

export const getSolanaHeldZodiacs = getHeldZodiacs;

export async function getHeldZodiacs(
  connectionOrRpcUrl: ConnectionOrRpcUrl,
  walletAddress: string
): Promise<readonly ZodiacsHolding[]> {
  const ownership = await getZodiacsOwnership(connectionOrRpcUrl, walletAddress);
  return ownership.holdings.filter((holding) => holding.held);
}

function normalizeParsedTokenAccounts(
  response: ParsedTokenAccountResponse,
  fallbackDecimals: number
): {
  readonly rawAmount: string;
  readonly decimals: number;
  readonly uiAmount: number;
  readonly uiAmountString: string;
} {
  if (!Array.isArray(response.value)) {
    throw new Error("Invalid RPC response: expected token account array.");
  }

  let totalRaw = 0n;
  let decimals = fallbackDecimals;
  let hasTokenAccount = false;

  for (const account of response.value) {
    const amount = account.account.data.parsed?.info?.tokenAmount;

    if (!amount) {
      throw new Error("Invalid RPC response: token amount is missing.");
    }

    assertParsedAmount(amount);

    if (hasTokenAccount && amount.decimals !== decimals) {
      throw new Error("Invalid RPC response: token account decimals are inconsistent.");
    }

    totalRaw += BigInt(amount.amount);
    decimals = amount.decimals;
    hasTokenAccount = true;
  }

  const rawAmount = totalRaw.toString();

  return {
    rawAmount,
    decimals,
    uiAmount: rawAmountToNumber(rawAmount, decimals),
    uiAmountString: formatRawAmountString(rawAmount, decimals)
  };
}

function normalizeWalletTokenAccounts(
  response: ParsedTokenAccountResponse,
  walletAddress: string
): readonly ZodiacBalance[] {
  if (!Array.isArray(response.value)) {
    throw new Error("Invalid RPC response: expected token account array.");
  }

  const officialTokens = getAllZodiacTokens();
  const tokensByMint = new Map(officialTokens.map((token) => [token.mintAddress, token]));
  const amountsByMint = new Map<
    string,
    {
      rawAmount: bigint;
      decimals: number;
    }
  >();
  const errorsByMint = new Map<string, string>();

  for (const account of response.value) {
    const info = account.account.data.parsed?.info;
    const mintAddress = info?.mint;

    if (!mintAddress || !tokensByMint.has(mintAddress)) {
      continue;
    }

    const token = tokensByMint.get(mintAddress);
    const amount = info?.tokenAmount;

    if (!token || !amount) {
      errorsByMint.set(mintAddress, "Invalid RPC response: token amount is missing.");
      continue;
    }

    try {
      assertParsedAmount(amount);
    } catch (error) {
      errorsByMint.set(
        mintAddress,
        error instanceof Error ? error.message : "Invalid RPC response."
      );
      continue;
    }

    const current = amountsByMint.get(mintAddress);

    if (current && current.decimals !== amount.decimals) {
      errorsByMint.set(
        mintAddress,
        "Invalid RPC response: token account decimals are inconsistent."
      );
      continue;
    }

    amountsByMint.set(mintAddress, {
      rawAmount: (current?.rawAmount ?? 0n) + BigInt(amount.amount),
      decimals: amount.decimals
    });
  }

  return officialTokens.map((token) => {
    const error = errorsByMint.get(token.mintAddress);

    if (error) {
      return unavailableBalance(token.sign, walletAddress, error);
    }

    const amount = amountsByMint.get(token.mintAddress);
    const rawAmount = amount?.rawAmount.toString() ?? "0";
    const decimals = amount?.decimals ?? token.decimals;

    return {
      sign: token.sign,
      token,
      representation: getSolanaZodiacRepresentation(token.sign),
      chain: "solana",
      kind: "native",
      tokenStandard: "SPL",
      walletAddress,
      mintAddress: token.mintAddress,
      rawAmount,
      decimals,
      uiAmount: rawAmountToNumber(rawAmount, decimals),
      uiAmountString: formatRawAmountString(rawAmount, decimals),
      status: rawAmount === "0" ? "zero" : "ok"
    };
  });
}

function assertParsedAmount(amount: ParsedTokenAccountAmount): void {
  if (!/^\d+$/u.test(amount.amount)) {
    throw new Error("Invalid RPC response: token amount must be an unsigned integer string.");
  }

  if (!Number.isInteger(amount.decimals) || amount.decimals < 0 || amount.decimals > 18) {
    throw new Error("Invalid RPC response: token decimals are outside the supported range.");
  }
}

function unavailableBalance(
  sign: ZodiacSign,
  walletAddress: string,
  message: string
): ZodiacBalance {
  const token = getZodiacToken(sign);
  const error: ZodiacBalanceError = {
    code: message.startsWith("Invalid RPC response") ? "invalid-rpc-response" : "rpc-error",
    message
  };

  return {
    sign,
    token,
    representation: getSolanaZodiacRepresentation(sign),
    chain: "solana",
    kind: "native",
    tokenStandard: "SPL",
    walletAddress,
    mintAddress: token.mintAddress,
    rawAmount: "0",
    decimals: token.decimals,
    uiAmount: 0,
    uiAmountString: "0",
    status: "unavailable",
    error
  };
}

function getZodiacsOwnershipStatus(balances: readonly ZodiacBalance[]): ZodiacsOwnership["status"] {
  const unavailableCount = balances.filter((balance) => balance.status === "unavailable").length;

  if (unavailableCount === 0) {
    return "available";
  }

  return unavailableCount === balances.length ? "unavailable" : "partial";
}

function toBalancesBySign(
  balances: readonly ZodiacBalance[]
): Readonly<Record<ZodiacSign, ZodiacBalance>> {
  return Object.fromEntries(balances.map((balance) => [balance.sign, balance])) as Readonly<
    Record<ZodiacSign, ZodiacBalance>
  >;
}

function collectSolanaWarnings(balances: readonly ZodiacBalance[]) {
  return balances.flatMap((balance) =>
    balance.status === "unavailable" && balance.error
      ? [
          {
            code: balance.error.code,
            message: `${balance.sign}: ${balance.error.message}`
          }
        ]
      : []
  );
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new Error("Solana Zodiacs ownership read aborted.");
  }
}

function createPublicKey(value: string, label: string): SolanaPublicKeyLike {
  if (!isSolanaAddressLike(value)) {
    throw new ZodiacsValidationError(
      label === "wallet address" ? "invalid-wallet-address" : "invalid-mint-address",
      `Invalid ${label}: ${value}`
    );
  }

  const normalized = normalizeSolanaAddress(value);

  return {
    toBase58: () => normalized,
    toString: () => normalized
  };
}

function createJsonRpcSolanaConnection(rpcUrl: string): SolanaBalanceConnection {
  return {
    getParsedTokenAccountsByOwner: async (
      ownerAddress,
      filter
    ): Promise<ParsedTokenAccountResponse> => {
      const owner = stringifyPublicKey(ownerAddress);
      const tokenFilter =
        "mint" in filter
          ? { mint: stringifyPublicKey(filter.mint) }
          : { programId: stringifyPublicKey(filter.programId) };
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "zodiacs-sdk-token-accounts",
          method: "getTokenAccountsByOwner",
          params: [owner, tokenFilter, { encoding: "jsonParsed", commitment: "confirmed" }]
        })
      });

      if (!response.ok) {
        throw new Error(`Solana RPC request failed with HTTP ${response.status}.`);
      }

      const payload = (await response.json()) as SolanaJsonRpcResponse;

      if (payload.error) {
        throw new Error(payload.error.message ?? "Solana RPC request failed.");
      }

      if (!payload.result || !Array.isArray(payload.result.value)) {
        throw new Error("Invalid RPC response: expected token account array.");
      }

      return payload.result;
    }
  };
}

function stringifyPublicKey(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const maybePublicKey = value as {
      readonly toBase58?: () => string;
      readonly toString?: () => string;
    };

    if (typeof maybePublicKey.toBase58 === "function") {
      return maybePublicKey.toBase58();
    }

    if (typeof maybePublicKey.toString === "function") {
      return maybePublicKey.toString();
    }
  }

  return String(value);
}

function assertZodiacSignInput(value: string): asserts value is ZodiacSign {
  if (!ZODIAC_SIGNS.includes(value as ZodiacSign)) {
    throw new ZodiacsValidationError("invalid-zodiac-sign", `Invalid zodiac sign: ${value}`);
  }
}

function formatRawAmountString(rawAmount: string, decimals: number): string {
  if (rawAmount === "0") {
    return "0";
  }

  if (decimals === 0) {
    return rawAmount;
  }

  const padded = rawAmount.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fractional = padded.slice(-decimals).replace(/0+$/u, "");

  return fractional ? `${whole}.${fractional}` : whole;
}
