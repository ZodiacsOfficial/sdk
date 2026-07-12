import { getNativeZodiacRepresentation } from "./official-registry.js";
import { ZODIAC_SIGNS, type ZodiacSign } from "./types.js";

export const DEFAULT_DISCLOSURE_RPC_URL = "https://api.mainnet-beta.solana.com";
export const DEFAULT_DISCLOSURE_PACE_MS = 300;

const DEFAULT_RETRY_DELAYS_MS = [1_000, 2_000] as const;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRY_AFTER_MS = 30_000;

export interface GetDisclosureOptions {
  readonly rpcUrl?: string;
}

export interface GetDisclosureAllOptions extends GetDisclosureOptions {
  readonly paceMs?: number;
}

export interface DisclosureReadSuccess<T> {
  readonly ok: true;
  readonly value: T;
  readonly slot: number;
}

export interface DisclosureReadFailure {
  readonly ok: false;
  readonly reason: string;
}

export type DisclosureRead<T> = DisclosureReadSuccess<T> | DisclosureReadFailure;

export interface DisclosureSupplyValue {
  readonly rawAmount: string;
  readonly decimals: number;
  readonly uiAmountString: string;
  readonly summary: string;
}

export interface DisclosureAuthorityValue {
  readonly raw: string | null;
  readonly renounced: boolean;
  readonly summary: string;
}

export interface DisclosureTopTenAccountsValue {
  readonly rawAmount: string;
  readonly accountCount: 10;
  readonly percentageTenths: number;
  readonly percentage: string;
  readonly summary: string;
}

export type DisclosureTopTenAccountsRead =
  | (DisclosureReadSuccess<DisclosureTopTenAccountsValue> & {
      readonly supplySlot: number;
    })
  | DisclosureReadFailure;

export interface ZodiacDisclosure {
  readonly sign: ZodiacSign;
  readonly mintAddress: string;
  readonly decimals: number;
  readonly readAt: string;
  readonly supply: DisclosureRead<DisclosureSupplyValue>;
  readonly mintAuthority: DisclosureRead<DisclosureAuthorityValue>;
  readonly freezeAuthority: DisclosureRead<DisclosureAuthorityValue>;
  readonly topTenAccounts: DisclosureTopTenAccountsRead;
}

export interface DisclosureAuthorityAggregateValue {
  readonly renouncedCount: number;
  readonly total: 12;
  readonly summary: string;
}

export interface DisclosureTopTenRangeValue {
  readonly lowestPercentageTenths: number;
  readonly highestPercentageTenths: number;
  readonly lowestPercentage: string;
  readonly highestPercentage: string;
  readonly summary: string;
}

export type DisclosureAggregateRead<T> =
  | {
      readonly ok: true;
      readonly value: T;
      readonly sourceSlots: readonly number[];
    }
  | DisclosureReadFailure;

export interface DisclosureAggregate {
  readonly supply: DisclosureAggregateRead<DisclosureSupplyValue>;
  readonly mintAuthority: DisclosureAggregateRead<DisclosureAuthorityAggregateValue>;
  readonly freezeAuthority: DisclosureAggregateRead<DisclosureAuthorityAggregateValue>;
  readonly topTenAccounts: DisclosureAggregateRead<DisclosureTopTenRangeValue>;
}

export interface DisclosureAllResult {
  readonly readAt: string;
  readonly disclosures: Readonly<Record<ZodiacSign, ZodiacDisclosure>>;
  readonly aggregate: DisclosureAggregate;
}

export interface ParsedDisclosureAuthorities {
  readonly mintAuthority: DisclosureRead<DisclosureAuthorityValue>;
  readonly freezeAuthority: DisclosureRead<DisclosureAuthorityValue>;
}

interface RpcReadSuccess {
  readonly ok: true;
  readonly result: unknown;
}

type RpcRead = RpcReadSuccess | DisclosureReadFailure;

interface DisclosureRpcClient {
  readonly request: (method: string, params: readonly unknown[]) => Promise<RpcRead>;
}

interface RpcErrorBody {
  readonly code?: unknown;
  readonly message?: unknown;
}

class DisclosureRpcError extends Error {
  readonly retryable: boolean;
  readonly retryAfterMs: number;

  constructor(message: string, retryable = false, retryAfterMs = 0) {
    super(message);
    this.name = "DisclosureRpcError";
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

export async function getDisclosure(
  sign: ZodiacSign,
  options: GetDisclosureOptions = {}
): Promise<ZodiacDisclosure> {
  const client = createDisclosureRpcClient(options.rpcUrl, 0);
  return readDisclosure(sign, client);
}

export async function getDisclosureAll(
  options: GetDisclosureAllOptions = {}
): Promise<DisclosureAllResult> {
  const paceMs = options.paceMs ?? DEFAULT_DISCLOSURE_PACE_MS;
  assertNonnegativeFinite(paceMs, "paceMs");
  const client = createDisclosureRpcClient(options.rpcUrl, paceMs);
  const entries: [ZodiacSign, ZodiacDisclosure][] = [];

  for (const sign of ZODIAC_SIGNS) {
    entries.push([sign, await readDisclosure(sign, client)]);
  }

  const disclosures = Object.fromEntries(entries) as Record<ZodiacSign, ZodiacDisclosure>;

  return {
    readAt: new Date().toISOString(),
    disclosures,
    aggregate: aggregateDisclosures(disclosures)
  };
}

export function parseDisclosureSupply(
  result: unknown,
  expectedDecimals: number
): DisclosureRead<DisclosureSupplyValue> {
  try {
    assertDecimals(expectedDecimals, expectedDecimals, "Registry");
    const root = requireRecord(result, "getTokenSupply result");
    const slot = parseSlot(root.context, "getTokenSupply");
    const value = requireRecord(root.value, "getTokenSupply value");
    const decimals = requireDecimals(value.decimals, expectedDecimals, "Token supply");
    const rawAmount = requireUnsignedInteger(value.amount, "Token supply amount");
    const uiAmountString = requireDecimalString(
      value.uiAmountString,
      "Token supply uiAmountString"
    );
    const derivedUiAmountString = formatDisclosureRawAmount(rawAmount, decimals);

    if (normalizeDecimalString(uiAmountString) !== derivedUiAmountString) {
      throw new TypeError("Token supply uiAmountString does not match its raw amount.");
    }

    return {
      ok: true,
      slot,
      value: {
        rawAmount,
        decimals,
        uiAmountString,
        summary: `${groupDecimalString(uiAmountString)} total`
      }
    };
  } catch (error) {
    return failure(`Invalid getTokenSupply response: ${errorMessage(error)}`);
  }
}

export function parseDisclosureAuthorities(
  result: unknown,
  expectedDecimals: number
): ParsedDisclosureAuthorities {
  let slot: number;
  let info: Record<string, unknown>;

  try {
    const root = requireRecord(result, "getAccountInfo result");
    slot = parseSlot(root.context, "getAccountInfo");
    const value = requireRecord(root.value, "getAccountInfo value");
    const data = requireRecord(value.data, "getAccountInfo data");
    const parsed = requireRecord(data.parsed, "getAccountInfo parsed data");

    if (parsed.type !== "mint") {
      throw new TypeError("Account data is not a parsed mint.");
    }

    info = requireRecord(parsed.info, "getAccountInfo mint info");
    requireDecimals(info.decimals, expectedDecimals, "Mint account");
  } catch (error) {
    const unavailable = failure(`Invalid getAccountInfo response: ${errorMessage(error)}`);
    return { mintAuthority: unavailable, freezeAuthority: unavailable };
  }

  return {
    mintAuthority: parseAuthority(info, "mintAuthority", slot),
    freezeAuthority: parseAuthority(info, "freezeAuthority", slot)
  };
}

export function parseDisclosureTopTenAccounts(
  result: unknown,
  supply: DisclosureRead<DisclosureSupplyValue>
): DisclosureTopTenAccountsRead {
  if (!supply.ok) {
    return failure(`Current token supply is unavailable: ${supply.reason}`);
  }

  try {
    const root = requireRecord(result, "getTokenLargestAccounts result");
    const slot = parseSlot(root.context, "getTokenLargestAccounts");

    if (!Array.isArray(root.value) || root.value.length < 10) {
      throw new TypeError(
        `Largest-accounts result has ${Array.isArray(root.value) ? root.value.length : 0} accounts; expected at least 10.`
      );
    }

    let topTenRawAmount = 0n;

    for (const [index, accountValue] of root.value.slice(0, 10).entries()) {
      const account = requireRecord(accountValue, `Largest account ${index + 1}`);
      requireDecimals(account.decimals, supply.value.decimals, `Largest account ${index + 1}`);
      topTenRawAmount += BigInt(
        requireUnsignedInteger(account.amount, `Largest account ${index + 1} amount`)
      );
    }

    const totalSupply = BigInt(supply.value.rawAmount);

    if (totalSupply <= 0n) {
      throw new TypeError("Token supply must be positive for a concentration percentage.");
    }

    if (topTenRawAmount > totalSupply) {
      throw new TypeError("Top-ten token-account amount exceeds token supply.");
    }

    const percentageTenths = Number((topTenRawAmount * 1_000n + totalSupply / 2n) / totalSupply);
    const percentage = formatDisclosurePercentage(percentageTenths);

    return {
      ok: true,
      slot,
      supplySlot: supply.slot,
      value: {
        rawAmount: topTenRawAmount.toString(),
        accountCount: 10,
        percentageTenths,
        percentage,
        summary: `${percentage} · top-10 token accounts`
      }
    };
  } catch (error) {
    return failure(`Invalid getTokenLargestAccounts response: ${errorMessage(error)}`);
  }
}

export function aggregateDisclosures(
  disclosures: Readonly<Partial<Record<ZodiacSign, ZodiacDisclosure>>>
): DisclosureAggregate {
  const rows = ZODIAC_SIGNS.map((sign) => disclosures[sign]).filter(
    (row): row is ZodiacDisclosure => row !== undefined
  );
  const supplyReads = rows.map((row) => row.supply).filter(isSuccessfulRead);
  const mintAuthorityReads = rows.map((row) => row.mintAuthority).filter(isSuccessfulRead);
  const freezeAuthorityReads = rows.map((row) => row.freezeAuthority).filter(isSuccessfulRead);
  const topTenReads = rows.map((row) => row.topTenAccounts).filter(isSuccessfulTopTenRead);

  return {
    supply:
      supplyReads.length === ZODIAC_SIGNS.length
        ? aggregateSupply(supplyReads)
        : unavailableAggregate(supplyReads.length),
    mintAuthority:
      mintAuthorityReads.length === ZODIAC_SIGNS.length
        ? aggregateAuthorities(mintAuthorityReads)
        : unavailableAggregate(mintAuthorityReads.length),
    freezeAuthority:
      freezeAuthorityReads.length === ZODIAC_SIGNS.length
        ? aggregateAuthorities(freezeAuthorityReads)
        : unavailableAggregate(freezeAuthorityReads.length),
    topTenAccounts:
      topTenReads.length === ZODIAC_SIGNS.length
        ? aggregateTopTenRange(topTenReads)
        : unavailableAggregate(topTenReads.length)
  };
}

export function formatDisclosureRawAmount(rawAmount: string, decimals: number): string {
  requireUnsignedInteger(rawAmount, "Raw token amount");
  assertDecimals(decimals, decimals, "Token");

  if (decimals === 0) {
    return rawAmount.replace(/^0+(?=\d)/u, "");
  }

  const padded = rawAmount.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals).replace(/^0+(?=\d)/u, "");
  const fraction = padded.slice(-decimals).replace(/0+$/u, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function formatDisclosurePercentage(percentageTenths: number): string {
  if (!Number.isSafeInteger(percentageTenths) || percentageTenths < 0) {
    throw new TypeError("Percentage tenths must be a non-negative safe integer.");
  }

  return `${Math.floor(percentageTenths / 10)}.${percentageTenths % 10}%`;
}

async function readDisclosure(
  sign: ZodiacSign,
  client: DisclosureRpcClient
): Promise<ZodiacDisclosure> {
  const native = getNativeZodiacRepresentation(sign);

  if (native.chain !== "solana" || native.kind !== "native" || native.tokenStandard !== "SPL") {
    throw new Error(`Registry native representation is not a Solana SPL mint for ${sign}.`);
  }

  if (native.decimals === undefined) {
    throw new Error(`Registry native representation is missing decimals for ${sign}.`);
  }

  const supplyRpc = await client.request("getTokenSupply", [
    native.address,
    { commitment: "finalized" }
  ]);
  const accountInfoRpc = await client.request("getAccountInfo", [
    native.address,
    { encoding: "jsonParsed", commitment: "finalized" }
  ]);
  const largestAccountsRpc = await client.request("getTokenLargestAccounts", [
    native.address,
    { commitment: "finalized" }
  ]);
  const supply = supplyRpc.ok
    ? parseDisclosureSupply(supplyRpc.result, native.decimals)
    : supplyRpc;
  const authorities = accountInfoRpc.ok
    ? parseDisclosureAuthorities(accountInfoRpc.result, native.decimals)
    : {
        mintAuthority: failure(accountInfoRpc.reason),
        freezeAuthority: failure(accountInfoRpc.reason)
      };
  const topTenAccounts = largestAccountsRpc.ok
    ? parseDisclosureTopTenAccounts(largestAccountsRpc.result, supply)
    : failure(largestAccountsRpc.reason);

  return {
    sign,
    mintAddress: native.address,
    decimals: native.decimals,
    readAt: new Date().toISOString(),
    supply,
    mintAuthority: authorities.mintAuthority,
    freezeAuthority: authorities.freezeAuthority,
    topTenAccounts
  };
}

function aggregateSupply(
  reads: readonly DisclosureReadSuccess<DisclosureSupplyValue>[]
): DisclosureAggregateRead<DisclosureSupplyValue> {
  const decimals = Math.max(...reads.map((read) => read.value.decimals));
  const rawAmount = reads.reduce(
    (total, read) =>
      total + BigInt(read.value.rawAmount) * 10n ** BigInt(decimals - read.value.decimals),
    0n
  );
  const uiAmountString = formatDisclosureRawAmount(rawAmount.toString(), decimals);

  return {
    ok: true,
    sourceSlots: reads.map((read) => read.slot),
    value: {
      rawAmount: rawAmount.toString(),
      decimals,
      uiAmountString,
      summary: `${groupDecimalString(uiAmountString)} total`
    }
  };
}

function aggregateAuthorities(
  reads: readonly DisclosureReadSuccess<DisclosureAuthorityValue>[]
): DisclosureAggregateRead<DisclosureAuthorityAggregateValue> {
  const renouncedCount = reads.filter((read) => read.value.renounced).length;

  return {
    ok: true,
    sourceSlots: reads.map((read) => read.slot),
    value: {
      renouncedCount,
      total: 12,
      summary: `${renouncedCount} of 12 renounced`
    }
  };
}

function aggregateTopTenRange(
  reads: readonly (DisclosureReadSuccess<DisclosureTopTenAccountsValue> & {
    readonly supplySlot: number;
  })[]
): DisclosureAggregateRead<DisclosureTopTenRangeValue> {
  const percentages = reads.map((read) => read.value.percentageTenths);
  const lowestPercentageTenths = Math.min(...percentages);
  const highestPercentageTenths = Math.max(...percentages);
  const lowestPercentage = formatDisclosurePercentage(lowestPercentageTenths);
  const highestPercentage = formatDisclosurePercentage(highestPercentageTenths);

  return {
    ok: true,
    sourceSlots: reads.map((read) => read.slot),
    value: {
      lowestPercentageTenths,
      highestPercentageTenths,
      lowestPercentage,
      highestPercentage,
      summary: `lowest ${lowestPercentage} – highest ${highestPercentage}`
    }
  };
}

function unavailableAggregate(currentCount: number): DisclosureReadFailure {
  return failure(`${currentCount} of 12 current sign values available`);
}

function parseAuthority(
  info: Record<string, unknown>,
  key: "mintAuthority" | "freezeAuthority",
  slot: number
): DisclosureRead<DisclosureAuthorityValue> {
  if (!Object.prototype.hasOwnProperty.call(info, key)) {
    return failure(`Invalid getAccountInfo response: Mint account is missing ${key}.`);
  }

  const raw = info[key];

  if (raw !== null && (typeof raw !== "string" || raw.length === 0)) {
    return failure(`Invalid getAccountInfo response: Mint account has invalid ${key}.`);
  }

  return {
    ok: true,
    slot,
    value: {
      raw,
      renounced: raw === null,
      summary: raw === null ? "renounced" : raw
    }
  };
}

function createDisclosureRpcClient(
  rpcUrlOption: string | undefined,
  paceMs: number
): DisclosureRpcClient {
  const rpcUrl = validateRpcUrl(rpcUrlOption ?? DEFAULT_DISCLOSURE_RPC_URL);
  let hasStartedRequest = false;
  let requestId = 0;

  const waitForPace = async (): Promise<void> => {
    if (hasStartedRequest && paceMs > 0) {
      await sleep(paceMs);
    }

    hasStartedRequest = true;
  };

  return {
    request: async (method, params): Promise<RpcRead> => {
      for (let attempt = 0; attempt <= DEFAULT_RETRY_DELAYS_MS.length; attempt += 1) {
        await waitForPace();

        try {
          requestId += 1;
          return {
            ok: true,
            result: await sendRpcRequest(rpcUrl, method, params, requestId)
          };
        } catch (error) {
          const rpcError = normalizeRpcError(error, method);
          const retryDelay = DEFAULT_RETRY_DELAYS_MS[attempt];

          if (!rpcError.retryable || retryDelay === undefined) {
            return failure(rpcError.message);
          }

          await sleep(Math.max(retryDelay, rpcError.retryAfterMs));
        }
      }

      return failure(`${method}: retry attempts exhausted.`);
    }
  };
}

async function sendRpcRequest(
  rpcUrl: string,
  method: string,
  params: readonly unknown[],
  id: number
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;

    try {
      response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
        signal: controller.signal
      });
    } catch (error) {
      throw new DisclosureRpcError(
        `${method}: ${error instanceof Error ? error.message : "network request failed"}`,
        true
      );
    }

    const retryableHttp = response.status === 429 || response.status >= 500;
    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      if (controller.signal.aborted) {
        throw new DisclosureRpcError(
          `${method}: request timed out after ${REQUEST_TIMEOUT_MS}ms.`,
          true
        );
      }

      throw new DisclosureRpcError(
        `${method}: HTTP ${response.status} returned invalid JSON.`,
        retryableHttp,
        parseRetryAfter(response.headers.get("retry-after"))
      );
    }

    if (!response.ok) {
      const errorBody = getRpcErrorBody(payload);
      const suffix =
        typeof errorBody?.message === "string" && errorBody.message
          ? ` — ${errorBody.message}`
          : "";
      throw new DisclosureRpcError(
        `${method}: HTTP ${response.status}${suffix}`,
        retryableHttp,
        parseRetryAfter(response.headers.get("retry-after"))
      );
    }

    const envelope = requireRecord(payload, `${method} response`);
    const errorBody = getRpcErrorBody(envelope);

    if (errorBody) {
      const code = typeof errorBody.code === "number" ? errorBody.code : null;
      const retryable = code === 429 || (code !== null && code <= -32_000 && code >= -32_099);
      const message =
        typeof errorBody.message === "string" && errorBody.message
          ? errorBody.message
          : "unknown RPC error";
      throw new DisclosureRpcError(`${method}: RPC ${code ?? "error"} — ${message}`, retryable);
    }

    if (!Object.prototype.hasOwnProperty.call(envelope, "result")) {
      throw new DisclosureRpcError(`${method}: response is missing result.`);
    }

    return envelope.result;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeRpcError(error: unknown, method: string): DisclosureRpcError {
  if (error instanceof DisclosureRpcError) {
    return error;
  }

  return new DisclosureRpcError(
    `${method}: ${error instanceof Error ? error.message : "request failed"}`
  );
}

function getRpcErrorBody(value: unknown): RpcErrorBody | null {
  if (!isRecord(value) || !isRecord(value.error)) {
    return null;
  }

  return value.error;
}

function parseRetryAfter(value: string | null): number {
  if (!value) {
    return 0;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(MAX_RETRY_AFTER_MS, Math.ceil(seconds * 1_000));
  }

  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.min(MAX_RETRY_AFTER_MS, Math.max(0, date - Date.now())) : 0;
}

function validateRpcUrl(value: string): string {
  const rpcUrl = value.trim();

  if (!rpcUrl) {
    throw new TypeError("Invalid RPC endpoint: URL is required.");
  }

  let parsed: URL;

  try {
    parsed = new URL(rpcUrl);
  } catch {
    throw new TypeError("Invalid RPC endpoint: expected an absolute URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new TypeError("Invalid RPC endpoint: expected http or https.");
  }

  return rpcUrl;
}

function parseSlot(value: unknown, method: string): number {
  const context = requireRecord(value, `${method} context`);
  const slot = context.slot;

  if (!Number.isSafeInteger(slot) || (slot as number) < 0) {
    throw new TypeError(`${method} context slot must be a non-negative safe integer.`);
  }

  return slot as number;
}

function requireDecimals(value: unknown, expected: number, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 18) {
    throw new TypeError(`${label} decimals are outside the supported range.`);
  }

  if (value !== expected) {
    throw new TypeError(
      `${label} decimals ${String(value)} do not match registry decimals ${expected}.`
    );
  }

  return value as number;
}

function assertDecimals(value: number, expected: number, label: string): void {
  requireDecimals(value, expected, label);
}

function requireUnsignedInteger(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d+$/u.test(value)) {
    throw new TypeError(`${label} must be an unsigned integer string.`);
  }

  return value;
}

function requireDecimalString(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/u.test(value)) {
    throw new TypeError(`${label} must be a non-negative decimal string.`);
  }

  return value;
}

function normalizeDecimalString(value: string): string {
  const [wholeValue = "0", fractionValue] = value.split(".");
  const whole = wholeValue.replace(/^0+(?=\d)/u, "");
  const fraction = fractionValue?.replace(/0+$/u, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function groupDecimalString(value: string): string {
  const [whole = "0", fraction] = value.split(".");
  const grouped = whole.replace(/^0+(?=\d)/u, "").replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new TypeError(`${label} must be an object.`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSuccessfulRead<T>(read: DisclosureRead<T>): read is DisclosureReadSuccess<T> {
  return read.ok;
}

function isSuccessfulTopTenRead(
  read: DisclosureTopTenAccountsRead
): read is DisclosureReadSuccess<DisclosureTopTenAccountsValue> & {
  readonly supplySlot: number;
} {
  return read.ok;
}

function failure(reason: string): DisclosureReadFailure {
  return { ok: false, reason };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assertNonnegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative finite number.`);
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
