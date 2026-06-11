import {
  BASE_CHAIN_ID,
  ZODIAC_SIGNS,
  getBaseZodiacRepresentation,
  getRepresentationByAddress
} from "@zodiacs/sdk/core";
import type { ZodiacSign } from "@zodiacs/sdk/core";

export { ZODIAC_SIGNS };
export type { ZodiacSign };

export const SIGN_GLYPHS: Record<ZodiacSign, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓"
};

export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_DECIMALS = 6;
export const USDC_CAIP19 = `eip155:${BASE_CHAIN_ID}/erc20:${USDC_ADDRESS}`;

export function isZodiacSign(value: string): value is ZodiacSign {
  return (ZODIAC_SIGNS as readonly string[]).includes(value);
}

export function baseAddressForSign(sign: ZodiacSign): string {
  return getBaseZodiacRepresentation(sign).address;
}

export function baseDecimalsForSign(sign: ZodiacSign): number {
  return getBaseZodiacRepresentation(sign).decimals ?? 6;
}

export function caip19ForSign(sign: ZodiacSign): string {
  return `eip155:${BASE_CHAIN_ID}/erc20:${baseAddressForSign(sign)}`;
}

export function signForBaseAddress(address: string): ZodiacSign | null {
  const representation = getRepresentationByAddress(address, { chain: "base" });
  return representation ? representation.sign : null;
}
