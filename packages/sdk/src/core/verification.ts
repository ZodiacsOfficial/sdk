import { UnknownZodiacAddressError, UnsupportedChainError } from "./errors.js";
import {
  getAllOfficialRepresentations,
  getBaseZodiacRepresentation,
  getNativeZodiacRepresentation,
  getZodiacAsset,
  getZodiacRepresentation
} from "./official-registry.js";
import {
  isEvmAddress,
  normalizeEvmAddress,
  normalizeSolanaAddress,
  normalizeZodiacAddress
} from "./address.js";
import type { ZodiacChain, ZodiacRepresentation, ZodiacSign } from "./types.js";

export interface ZodiacAddressLookupOptions {
  readonly chain?: ZodiacChain;
}

export function getRepresentationByAddress(
  address: string,
  options: ZodiacAddressLookupOptions = {}
): ZodiacRepresentation | null {
  const normalized = normalizeLookupAddress(address, options.chain);

  if (!normalized) {
    return null;
  }

  return (
    getAllOfficialRepresentations().find((representation) => {
      if (options.chain && representation.chain !== options.chain) {
        return false;
      }

      return normalizeLookupAddress(representation.address, representation.chain) === normalized;
    }) ?? null
  );
}

export function isOfficialZodiacRepresentation(
  value: ZodiacRepresentation | string | null | undefined,
  options: ZodiacAddressLookupOptions = {}
): boolean {
  if (typeof value === "string") {
    return isOfficialZodiacAddress(value, options);
  }

  if (!value?.isOfficialRepresentation) {
    return false;
  }

  const official = getZodiacRepresentation(value.sign, value.chain);

  if (!official) {
    return false;
  }

  return (
    official.kind === value.kind &&
    official.tokenStandard === value.tokenStandard &&
    normalizeLookupAddress(official.address, official.chain) ===
      normalizeLookupAddress(value.address, value.chain)
  );
}

export function isOfficialZodiacAddress(
  address: string,
  options: ZodiacAddressLookupOptions = {}
): boolean {
  return getRepresentationByAddress(address, options) !== null;
}

export function isNativeZodiacAddress(
  address: string,
  options: ZodiacAddressLookupOptions = {}
): boolean {
  const representation = getRepresentationByAddress(address, options);
  return representation?.kind === "native";
}

export function isBridgedZodiacAddress(
  address: string,
  options: ZodiacAddressLookupOptions = {}
): boolean {
  const representation = getRepresentationByAddress(address, options);
  return representation?.kind === "bridged";
}

export function isOfficialBaseZodiacAddress(address: string): boolean {
  return isOfficialZodiacAddress(address, { chain: "base" });
}

export function isOfficialSolanaZodiacMint(address: string): boolean {
  return isOfficialZodiacAddress(address, { chain: "solana" });
}

export function getZodiacAssetByAddress(address: string, options: ZodiacAddressLookupOptions = {}) {
  const representation = getRepresentationByAddress(address, options);
  return representation ? getZodiacAsset(representation.sign) : null;
}

export function getZodiacSignByAddress(
  address: string,
  options: ZodiacAddressLookupOptions = {}
): ZodiacSign | null {
  return getRepresentationByAddress(address, options)?.sign ?? null;
}

export function assertOfficialZodiacAddress(
  address: string,
  options: ZodiacAddressLookupOptions = {}
): ZodiacRepresentation {
  const representation = getRepresentationByAddress(address, options);

  if (!representation) {
    throw new UnknownZodiacAddressError(address);
  }

  return representation;
}

export function getBridgeProvenance(
  sign: ZodiacSign,
  targetChain: ZodiacChain
): ZodiacRepresentation["bridge"] | null {
  const representation = getZodiacRepresentation(sign, targetChain);
  return representation?.bridge ?? null;
}

export function getOriginForRepresentation(
  address: string,
  options: ZodiacAddressLookupOptions = {}
): ZodiacRepresentation | null {
  const representation = getRepresentationByAddress(address, options);

  if (!representation) {
    return null;
  }

  return representation.isCanonicalOrigin
    ? representation
    : getNativeZodiacRepresentation(representation.sign);
}

export const getNativeCounterpart = getOriginForRepresentation;

export function getBridgedCounterpart(
  sign: ZodiacSign,
  targetChain: ZodiacChain
): ZodiacRepresentation | null {
  if (targetChain === "solana") {
    return getNativeZodiacRepresentation(sign);
  }

  if (targetChain === "base") {
    return getBaseZodiacRepresentation(sign);
  }

  throw new UnsupportedChainError(targetChain);
}

export function getCounterparts(sign: ZodiacSign): readonly ZodiacRepresentation[] {
  return [getNativeZodiacRepresentation(sign), getBaseZodiacRepresentation(sign)];
}

export function getZodiacProvenance(sign: ZodiacSign): {
  readonly sign: ZodiacSign;
  readonly native: ZodiacRepresentation;
  readonly bridged: readonly ZodiacRepresentation[];
} {
  const native = getNativeZodiacRepresentation(sign);

  return {
    sign,
    native,
    bridged: getCounterparts(sign).filter((representation) => representation.kind === "bridged")
  };
}

function normalizeLookupAddress(address: string, chain?: ZodiacChain): string | null {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  if (chain === "base") {
    return isEvmAddress(trimmed) ? normalizeEvmAddress(trimmed).toLowerCase() : null;
  }

  if (chain === "solana") {
    try {
      return normalizeSolanaAddress(trimmed);
    } catch {
      return null;
    }
  }

  if (isEvmAddress(trimmed)) {
    return normalizeZodiacAddress(trimmed, "base").toLowerCase();
  }

  try {
    return normalizeZodiacAddress(trimmed, "solana");
  } catch {
    return null;
  }
}
