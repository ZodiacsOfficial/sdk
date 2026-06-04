import {
  ZODIAC_SIGNS,
  type ZodiacRegistryValidationResult,
  type ZodiacSign,
  type ZodiacToken,
  type ZodiacTokenRegistry
} from "./types.js";
import { validateZodiacToken } from "./validation.js";

const marketLinks = (mintAddress: string) => ({
  dexScreener: `https://dexscreener.com/solana/${mintAddress}`,
  jupiter: `https://jup.ag/tokens/${mintAddress}`
});

export const DEFAULT_ZODIAC_TOKENS = [
  {
    sign: "aries",
    name: "Aries",
    slug: "aries",
    ticker: "ARIES",
    order: 1,
    element: "fire",
    modality: "cardinal",
    rulingPlanet: "Mars",
    symbol: "♈",
    archetype: "The Initiator",
    shortBio:
      "A cultural asset for symbolic identity expressed through origin, force, and first movement.",
    decimals: 6,
    mintAddress: "GhFiFrExPY3proVF96oth1gESWA5QPQzdtb8cy8b1YZv",
    marketLinks: marketLinks("GhFiFrExPY3proVF96oth1gESWA5QPQzdtb8cy8b1YZv")
  },
  {
    sign: "taurus",
    name: "Taurus",
    slug: "taurus",
    ticker: "TAURUS",
    order: 2,
    element: "earth",
    modality: "fixed",
    rulingPlanet: "Venus",
    symbol: "♉",
    archetype: "The Steward",
    shortBio: "A cultural asset for ownership, form, value, and symbolic endurance.",
    decimals: 6,
    mintAddress: "EjkkxYpfSwS6TAtKKuiJuNMMngYvumc1t1v9ZX1WJKMp",
    marketLinks: marketLinks("EjkkxYpfSwS6TAtKKuiJuNMMngYvumc1t1v9ZX1WJKMp")
  },
  {
    sign: "gemini",
    name: "Gemini",
    slug: "gemini",
    ticker: "GEMINI",
    order: 3,
    element: "air",
    modality: "mutable",
    rulingPlanet: "Mercury",
    symbol: "♊",
    archetype: "The Messenger",
    shortBio: "A cultural asset for symbolic identity shaped by language, duality, and exchange.",
    decimals: 6,
    mintAddress: "ARiZfq6dK19uNqxWyRudhbM2MswLyYhVUHdndGkffdGc",
    marketLinks: marketLinks("ARiZfq6dK19uNqxWyRudhbM2MswLyYhVUHdndGkffdGc")
  },
  {
    sign: "cancer",
    name: "Cancer",
    slug: "cancer",
    ticker: "CANCER",
    order: 4,
    element: "water",
    modality: "cardinal",
    rulingPlanet: "Moon",
    symbol: "♋",
    archetype: "The Keeper",
    shortBio: "A cultural asset for memory, protection, belonging, and ancestral continuity.",
    decimals: 6,
    mintAddress: "CmomKM8iPKRSMN7y1jqyW1QKj5bGoZmbvNZXWBJSUdnZ",
    marketLinks: marketLinks("CmomKM8iPKRSMN7y1jqyW1QKj5bGoZmbvNZXWBJSUdnZ")
  },
  {
    sign: "leo",
    name: "Leo",
    slug: "leo",
    ticker: "LEO",
    order: 5,
    element: "fire",
    modality: "fixed",
    rulingPlanet: "Sun",
    symbol: "♌",
    archetype: "The Sovereign",
    shortBio: "A cultural asset for presence, authorship, radiance, and recognition.",
    decimals: 6,
    mintAddress: "8Cd7wXoPb5Yt9cUGtmHNqAEmpMDrhfcVqnGbLC48b8Qm",
    marketLinks: marketLinks("8Cd7wXoPb5Yt9cUGtmHNqAEmpMDrhfcVqnGbLC48b8Qm")
  },
  {
    sign: "virgo",
    name: "Virgo",
    slug: "virgo",
    ticker: "VIRGO",
    order: 6,
    element: "earth",
    modality: "mutable",
    rulingPlanet: "Mercury",
    symbol: "♍",
    archetype: "The Archivist",
    shortBio: "A cultural asset for craft, discernment, service, and exacting order.",
    decimals: 6,
    mintAddress: "Ez4bst5qu5uqX3AntYWUdafw9XvtFeJ3gugytKKbSJso",
    marketLinks: marketLinks("Ez4bst5qu5uqX3AntYWUdafw9XvtFeJ3gugytKKbSJso")
  },
  {
    sign: "libra",
    name: "Libra",
    slug: "libra",
    ticker: "LIBRA",
    order: 7,
    element: "air",
    modality: "cardinal",
    rulingPlanet: "Venus",
    symbol: "♎",
    archetype: "The Arbiter",
    shortBio: "A cultural asset for relation, judgment, proportion, and civic balance.",
    decimals: 6,
    mintAddress: "7Zt2KUh5mkpEpPGcNcFy51aGkh9Ycb5ELcqRH1n2GmAe",
    marketLinks: marketLinks("7Zt2KUh5mkpEpPGcNcFy51aGkh9Ycb5ELcqRH1n2GmAe")
  },
  {
    sign: "scorpio",
    name: "Scorpio",
    slug: "scorpio",
    ticker: "SCORPIO",
    order: 8,
    element: "water",
    modality: "fixed",
    rulingPlanet: "Mars",
    symbol: "♏",
    archetype: "The Custodian",
    shortBio: "A cultural asset for depth, transformation, secrecy, and resolve.",
    decimals: 6,
    mintAddress: "J4fQTRN13MKpXhVE74t99msKJLbrjegjEgLBnzEv2YH1",
    marketLinks: marketLinks("J4fQTRN13MKpXhVE74t99msKJLbrjegjEgLBnzEv2YH1")
  },
  {
    sign: "sagittarius",
    name: "Sagittarius",
    slug: "sagittarius",
    ticker: "SAGITTARIUS",
    order: 9,
    element: "fire",
    modality: "mutable",
    rulingPlanet: "Jupiter",
    symbol: "♐",
    archetype: "The Wayfinder",
    shortBio: "A cultural asset for doctrine, journey, horizon, and the search for meaning.",
    decimals: 6,
    mintAddress: "8x17zMmVjJxqswjX4hNpxVPc7Tr5UabVJF3kv8TKq8Y3",
    marketLinks: marketLinks("8x17zMmVjJxqswjX4hNpxVPc7Tr5UabVJF3kv8TKq8Y3")
  },
  {
    sign: "capricorn",
    name: "Capricorn",
    slug: "capricorn",
    ticker: "CAPRICORN",
    order: 10,
    element: "earth",
    modality: "cardinal",
    rulingPlanet: "Saturn",
    symbol: "♑",
    archetype: "The Institution",
    shortBio: "A cultural asset for structure, time, ascent, and institutional memory.",
    decimals: 6,
    mintAddress: "3C2SN1FjzE9MiLFFVRp7Jhkp8Gjwpk29S2TCSJ2jkHn2",
    marketLinks: marketLinks("3C2SN1FjzE9MiLFFVRp7Jhkp8Gjwpk29S2TCSJ2jkHn2")
  },
  {
    sign: "aquarius",
    name: "Aquarius",
    slug: "aquarius",
    ticker: "AQUARIUS",
    order: 11,
    element: "air",
    modality: "fixed",
    rulingPlanet: "Saturn",
    symbol: "♒",
    archetype: "The Architect",
    shortBio: "A cultural asset for systems, invention, collective identity, and distance.",
    decimals: 6,
    mintAddress: "C49Ut3om3QFTDrMZ5Cr8VcTKPpHDcQ2Fv8mmuJHHigDt",
    marketLinks: marketLinks("C49Ut3om3QFTDrMZ5Cr8VcTKPpHDcQ2Fv8mmuJHHigDt")
  },
  {
    sign: "pisces",
    name: "Pisces",
    slug: "pisces",
    ticker: "PISCES",
    order: 12,
    element: "water",
    modality: "mutable",
    rulingPlanet: "Jupiter",
    symbol: "♓",
    archetype: "The Mystic",
    shortBio: "A cultural asset for image, faith, continuity, and symbolic dissolution.",
    decimals: 6,
    mintAddress: "3JsSsmGzjWDNe9XCw2L9vznC5JU9wSqQeB6ns5pAkPeE",
    marketLinks: marketLinks("3JsSsmGzjWDNe9XCw2L9vznC5JU9wSqQeB6ns5pAkPeE")
  }
] as const satisfies readonly ZodiacToken[];

export const DEFAULT_ZODIAC_TOKEN_REGISTRY: ZodiacTokenRegistry =
  createZodiacTokenRegistry(DEFAULT_ZODIAC_TOKENS);

export function createZodiacTokenRegistry(tokens: readonly ZodiacToken[]): ZodiacTokenRegistry {
  const registry = new Map<ZodiacSign, ZodiacToken>();

  for (const token of tokens) {
    const validationErrors = validateZodiacToken(token);

    if (validationErrors.length > 0) {
      throw new Error(`Invalid zodiac token: ${validationErrors.join(" ")}`);
    }

    if (registry.has(token.sign)) {
      throw new Error(`Duplicate token registry entry for ${token.sign}.`);
    }

    registry.set(token.sign, token);
  }

  return registry;
}

export function mergeZodiacTokenRegistry(
  overrides: readonly ZodiacToken[],
  baseRegistry: ZodiacTokenRegistry = DEFAULT_ZODIAC_TOKEN_REGISTRY
): ZodiacTokenRegistry {
  return createZodiacTokenRegistry(
    [...baseRegistry.values(), ...overrides].reduce<ZodiacToken[]>((tokens, token) => {
      const withoutCurrent = tokens.filter((existing) => existing.sign !== token.sign);
      return [...withoutCurrent, token];
    }, [])
  );
}

export function getZodiacToken(
  sign: ZodiacSign,
  registry: ZodiacTokenRegistry = DEFAULT_ZODIAC_TOKEN_REGISTRY
): ZodiacToken {
  const token = registry.get(sign);

  if (!token) {
    throw new Error(`No token registry entry for ${sign}.`);
  }

  return token;
}

export function getAllZodiacTokens(
  registry: ZodiacTokenRegistry = DEFAULT_ZODIAC_TOKEN_REGISTRY
): readonly ZodiacToken[] {
  return ZODIAC_SIGNS.map((sign) => getZodiacToken(sign, registry));
}

export function getMintAddress(
  sign: ZodiacSign,
  registry: ZodiacTokenRegistry = DEFAULT_ZODIAC_TOKEN_REGISTRY
): string {
  return getZodiacToken(sign, registry).mintAddress;
}

export const lookupZodiacMintAddress = getMintAddress;

export function validateZodiacRegistry(
  tokens: readonly ZodiacToken[] = DEFAULT_ZODIAC_TOKENS
): ZodiacRegistryValidationResult {
  const errors: string[] = [];
  const signs = new Set<ZodiacSign>();
  const mints = new Set<string>();
  const orders = new Set<number>();

  if (tokens.length !== ZODIAC_SIGNS.length) {
    errors.push(`Expected ${ZODIAC_SIGNS.length} zodiac tokens, received ${tokens.length}.`);
  }

  for (const token of tokens) {
    for (const error of validateZodiacToken(token)) {
      errors.push(`${token.sign}: ${error}`);
    }

    if (signs.has(token.sign)) {
      errors.push(`Duplicate sign: ${token.sign}.`);
    }

    if (mints.has(token.mintAddress)) {
      errors.push(`Duplicate mint address: ${token.mintAddress}.`);
    }

    if (orders.has(token.order)) {
      errors.push(`Duplicate order: ${token.order}.`);
    }

    signs.add(token.sign);
    mints.add(token.mintAddress);
    orders.add(token.order);
  }

  for (const sign of ZODIAC_SIGNS) {
    if (!signs.has(sign)) {
      errors.push(`Registry sign unavailable: ${sign}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
