import { getAddress, isAddress } from "viem";
import type { ZodiacChain } from "./types.js";
import { InvalidZodiacAddressError } from "./errors.js";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_VALUES = new Map([...BASE58_ALPHABET].map((character, index) => [character, index]));
const SOLANA_PUBLIC_KEY_BYTES = 32;

export function isEvmAddress(address: string): boolean {
  return isAddress(address);
}

export function normalizeEvmAddress(address: string): string {
  const trimmed = address.trim();

  if (!isAddress(trimmed)) {
    throw new InvalidZodiacAddressError(address);
  }

  return getAddress(trimmed);
}

export function isSolanaAddressLike(address: string): boolean {
  return normalizeSolanaAddressOrNull(address) !== null;
}

export function normalizeSolanaAddress(address: string): string {
  const normalized = normalizeSolanaAddressOrNull(address);

  if (!normalized) {
    throw new InvalidZodiacAddressError(address);
  }

  return normalized;
}

export function normalizeZodiacAddress(address: string, chain?: ZodiacChain): string {
  const trimmed = address.trim();

  if (chain === "base") {
    return normalizeEvmAddress(trimmed);
  }

  if (chain === "solana") {
    return normalizeSolanaAddress(trimmed);
  }

  if (isEvmAddress(trimmed)) {
    return normalizeEvmAddress(trimmed);
  }

  return normalizeSolanaAddress(trimmed);
}

function normalizeSolanaAddressOrNull(address: string): string | null {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return decodeBase58(trimmed).length === SOLANA_PUBLIC_KEY_BYTES ? trimmed : null;
  } catch {
    return null;
  }
}

function decodeBase58(value: string): Uint8Array {
  const bytes: number[] = [0];

  for (const character of value) {
    const alphabetIndex = BASE58_VALUES.get(character);

    if (alphabetIndex === undefined) {
      throw new Error("Invalid base58 character.");
    }

    let carry = alphabetIndex;

    for (let index = 0; index < bytes.length; index += 1) {
      const nextValue = bytes[index]! * BASE58_ALPHABET.length + carry;
      bytes[index] = nextValue & 0xff;
      carry = nextValue >> 8;
    }

    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (const character of value) {
    if (character !== "1") {
      break;
    }

    bytes.push(0);
  }

  return Uint8Array.from(bytes.reverse());
}
