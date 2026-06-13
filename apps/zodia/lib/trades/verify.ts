import { erc20Abi, parseEventLogs } from "viem";
import type { Log } from "viem";
import { isOfficialZodiacAddress } from "@zodiacs/sdk/core";
import type { ZodiacSign } from "@zodiacs/sdk/core";
import { baseDecimalsForSign, signForBaseAddress } from "../zodiac";
import { usdMicrosForAmount } from "./pnl";

export interface TransferLogLike {
  readonly address: string;
  readonly args: {
    readonly from: string;
    readonly to: string;
    readonly value: bigint;
  };
}

export interface TradeLeg {
  readonly sign: ZodiacSign;
  readonly direction: "buy" | "sell";
  readonly amountRaw: string;
  readonly decimals: number;
  readonly priceUsd: number;
  readonly usdMicros: string;
}

export interface VerifiedTrade {
  readonly txHash: string;
  readonly wallet: string;
  readonly blockNumber: string;
  readonly blockTimestamp: number;
  readonly legs: readonly TradeLeg[];
  readonly volumeUsdMicros: string;
}

export type VerifyFailureReason =
  | "not-found"
  | "tx-failed"
  | "unconfirmed"
  | "too-old"
  | "unrelated-tx"
  | "no-price";

export type VerifyResult =
  | { readonly ok: true; readonly trade: VerifiedTrade }
  | { readonly ok: false; readonly reason: VerifyFailureReason };

/**
 * Net zodiac-token movement for the wallet, computed from ERC-20 Transfer logs. Binding on log
 * participants (not tx.from) keeps smart-wallet trades attributable: in Base App the sender is
 * frequently a 4337 bundler.
 */
export function netZodiacDeltas(
  logs: readonly TransferLogLike[],
  wallet: string
): Map<ZodiacSign, bigint> {
  const target = wallet.toLowerCase();
  const deltas = new Map<ZodiacSign, bigint>();
  for (const log of logs) {
    if (!isOfficialZodiacAddress(log.address, { chain: "base" })) {
      continue;
    }
    const sign = signForBaseAddress(log.address);
    if (!sign) {
      continue;
    }
    let delta = 0n;
    if (log.args.to.toLowerCase() === target) {
      delta += log.args.value;
    }
    if (log.args.from.toLowerCase() === target) {
      delta -= log.args.value;
    }
    if (delta !== 0n) {
      deltas.set(sign, (deltas.get(sign) ?? 0n) + delta);
    }
  }
  for (const [sign, delta] of deltas) {
    if (delta === 0n) {
      deltas.delete(sign);
    }
  }
  return deltas;
}

export function buildLegs(
  deltas: ReadonlyMap<ZodiacSign, bigint>,
  prices: Partial<Record<ZodiacSign, number | null>>
): { legs: TradeLeg[]; volumeUsdMicros: bigint } | null {
  const legs: TradeLeg[] = [];
  let volumeUsdMicros = 0n;
  for (const [sign, delta] of deltas) {
    const priceUsd = prices[sign];
    if (priceUsd === null || priceUsd === undefined) {
      return null;
    }
    const decimals = baseDecimalsForSign(sign);
    const amountRaw = delta < 0n ? -delta : delta;
    const usdMicros = usdMicrosForAmount(amountRaw, decimals, priceUsd);
    legs.push({
      sign,
      direction: delta > 0n ? "buy" : "sell",
      amountRaw: amountRaw.toString(),
      decimals,
      priceUsd,
      usdMicros: usdMicros.toString()
    });
    if (usdMicros > volumeUsdMicros) {
      volumeUsdMicros = usdMicros;
    }
  }
  return { legs, volumeUsdMicros };
}

interface VerifyClient {
  getTransactionReceipt(args: { hash: `0x${string}` }): Promise<{
    status: "success" | "reverted";
    blockNumber: bigint;
    logs: Log[];
  }>;
  getBlock(args: { blockNumber: bigint }): Promise<{ timestamp: bigint }>;
  getBlockNumber(): Promise<bigint>;
}

export interface VerifyOptions {
  readonly now?: Date;
  readonly maxAgeSeconds?: number;
  readonly minConfirmations?: number;
  readonly prices: Partial<Record<ZodiacSign, number | null>>;
}

export async function verifyTradeTx(
  client: VerifyClient,
  wallet: string,
  txHash: string,
  options: VerifyOptions
): Promise<VerifyResult> {
  const now = options.now ?? new Date();
  const maxAgeSeconds = options.maxAgeSeconds ?? 2700;
  const minConfirmations = options.minConfirmations ?? 2;

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
  } catch {
    return { ok: false, reason: "not-found" };
  }
  if (receipt.status !== "success") {
    return { ok: false, reason: "tx-failed" };
  }

  const latestBlock = await client.getBlockNumber();
  if (latestBlock - receipt.blockNumber < BigInt(minConfirmations - 1)) {
    return { ok: false, reason: "unconfirmed" };
  }

  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  const blockTimestamp = Number(block.timestamp);
  if (now.getTime() / 1000 - blockTimestamp > maxAgeSeconds) {
    return { ok: false, reason: "too-old" };
  }

  const transfers = parseEventLogs({
    abi: erc20Abi,
    eventName: "Transfer",
    logs: receipt.logs
  }) as unknown as TransferLogLike[];

  const deltas = netZodiacDeltas(transfers, wallet);
  if (deltas.size === 0) {
    return { ok: false, reason: "unrelated-tx" };
  }

  const built = buildLegs(deltas, options.prices);
  if (!built || built.legs.length === 0) {
    return { ok: false, reason: "no-price" };
  }

  return {
    ok: true,
    trade: {
      txHash: txHash.toLowerCase(),
      wallet: wallet.toLowerCase(),
      blockNumber: receipt.blockNumber.toString(),
      blockTimestamp,
      legs: built.legs,
      volumeUsdMicros: built.volumeUsdMicros.toString()
    }
  };
}
