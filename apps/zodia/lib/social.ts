import { getZodiacToken } from "@zodiacs/sdk/core";
import { hasRedis, keys, redis } from "./redis";
import type { ZodiacSign } from "./zodiac";

const NEYNAR_SEARCH_URL = "https://api.neynar.com/v2/farcaster/cast/search/";
const CACHE_TTL_SECONDS = 20;
const DEFAULT_LIMIT = 25;
const ASTROTALK_SEARCH_TERMS = [
  "Zodia",
  "Zodiacs",
  "$ZODIACS",
  "sdk-zodia.vercel.app",
  "zodiacs.org"
] as const;

const EXTRA_SOCIAL_ALIASES: Partial<Record<ZodiacSign, readonly string[]>> = {
  sagittarius: ["$SAGIT"]
};

export interface SocialFeedAuthor {
  readonly fid: number | null;
  readonly username: string | null;
  readonly displayName: string | null;
  readonly pfpUrl: string | null;
}

export interface SocialFeedCast {
  readonly id: string;
  readonly hash: string;
  readonly author: SocialFeedAuthor;
  readonly text: string;
  readonly timestamp: string;
  readonly embeds: readonly string[];
  readonly replies: number;
  readonly likes: number;
  readonly recasts: number;
  readonly url: string | null;
}

export interface SocialFeedPayload {
  readonly sign: ZodiacSign;
  readonly query: string;
  readonly casts: readonly SocialFeedCast[];
  readonly nextCursor: string | null;
  readonly updatedAt: string;
  readonly disabled?: boolean;
  readonly error?: string;
}

export interface AstroTalkFeedPayload {
  readonly scope: "astrotalk";
  readonly query: string;
  readonly casts: readonly SocialFeedCast[];
  readonly nextCursor: string | null;
  readonly updatedAt: string;
  readonly disabled?: boolean;
  readonly error?: string;
}

export interface SocialFeedCache<TPayload = SocialFeedPayload> {
  get(key: string): Promise<TPayload | null>;
  set(key: string, payload: TPayload, ttlSeconds: number): Promise<void>;
}

export type SocialFeedFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface FetchSocialFeedOptions {
  readonly sign: ZodiacSign;
  readonly cursor?: string | null;
  readonly limit?: number;
  readonly fetcher?: SocialFeedFetch;
  readonly cache?: SocialFeedCache<SocialFeedPayload> | null;
  readonly apiKey?: string | null;
  readonly now?: Date;
}

export interface FetchAstroTalkFeedOptions {
  readonly cursor?: string | null;
  readonly limit?: number;
  readonly fetcher?: SocialFeedFetch;
  readonly cache?: SocialFeedCache<AstroTalkFeedPayload> | null;
  readonly apiKey?: string | null;
  readonly now?: Date;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function timestampOrEpoch(value: unknown): string {
  const timestamp = asString(value);
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) {
    return new Date(0).toISOString();
  }
  return timestamp;
}

function quoteSearchTerm(term: string): string {
  return `"${term.replaceAll('"', '\\"')}"`;
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(100, Math.max(1, Math.floor(limit ?? DEFAULT_LIMIT)));
}

function cacheCursor(cursor: string | null | undefined): string {
  return encodeURIComponent(cursor?.trim() || "first");
}

function defaultCache<TPayload>(): SocialFeedCache<TPayload> | null {
  if (!hasRedis()) {
    return null;
  }
  return {
    get: (key) => redis().get<TPayload>(key),
    set: async (key, payload, ttlSeconds) => {
      await redis().set(key, payload, { ex: ttlSeconds });
    }
  };
}

function castUrl(username: string | null, hash: string, explicitUrl: string | null): string | null {
  if (explicitUrl) {
    return explicitUrl;
  }
  if (!username) {
    return null;
  }
  return `https://warpcast.com/${encodeURIComponent(username)}/${hash}`;
}

function normalizeEmbeds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((embed) => {
      const record = asRecord(embed);
      return record ? asString(record["url"]) : null;
    })
    .filter((url): url is string => Boolean(url));
}

export function socialTermsForSign(sign: ZodiacSign): readonly string[] {
  const token = getZodiacToken(sign);
  return Array.from(
    new Set([`$${token.ticker}`, ...(EXTRA_SOCIAL_ALIASES[sign] ?? []), token.name, token.symbol])
  );
}

export function astroTalkTerms(): readonly string[] {
  return ASTROTALK_SEARCH_TERMS;
}

export function buildSocialFeedQuery(sign: ZodiacSign): string {
  return socialTermsForSign(sign).map(quoteSearchTerm).join(" | ");
}

export function buildAstroTalkQuery(): string {
  return astroTalkTerms().map(quoteSearchTerm).join(" | ");
}

export function normalizeSocialCast(value: unknown): SocialFeedCast | null {
  const cast = asRecord(value);
  const hash = asString(cast?.["hash"]);
  if (!cast || !hash) {
    return null;
  }

  const author = asRecord(cast["author"]);
  const reactions = asRecord(cast["reactions"]);
  const replies = asRecord(cast["replies"]);
  const username = asString(author?.["username"]);
  const explicitUrl = asString(cast["url"]);

  return {
    id: hash,
    hash,
    author: {
      fid: asNumber(author?.["fid"]),
      username,
      displayName: asString(author?.["display_name"]),
      pfpUrl: asString(author?.["pfp_url"])
    },
    text: asString(cast["text"]) ?? "",
    timestamp: timestampOrEpoch(cast["timestamp"]),
    embeds: normalizeEmbeds(cast["embeds"]),
    replies: asNumber(replies?.["count"]) ?? 0,
    likes: asNumber(reactions?.["likes_count"]) ?? 0,
    recasts: asNumber(reactions?.["recasts_count"]) ?? 0,
    url: castUrl(username, hash, explicitUrl)
  };
}

function extractCasts(json: unknown): SocialFeedCast[] {
  const result = asRecord(asRecord(json)?.["result"]);
  const casts = result ? result["casts"] : null;
  if (!Array.isArray(casts)) {
    return [];
  }
  return casts
    .map((cast) => normalizeSocialCast(cast))
    .filter((cast): cast is SocialFeedCast => Boolean(cast));
}

function extractNextCursor(json: unknown): string | null {
  const result = asRecord(asRecord(json)?.["result"]);
  const next = asRecord(result?.["next"]);
  return asString(next?.["cursor"]);
}

export async function fetchSocialFeed({
  sign,
  cursor = null,
  limit,
  fetcher = fetch,
  cache = defaultCache<SocialFeedPayload>(),
  apiKey = process.env.NEYNAR_API_KEY,
  now = new Date()
}: FetchSocialFeedOptions): Promise<SocialFeedPayload> {
  const query = buildSocialFeedQuery(sign);
  const updatedAt = now.toISOString();
  if (!apiKey) {
    return {
      sign,
      query,
      casts: [],
      nextCursor: null,
      updatedAt,
      disabled: true,
      error: "NEYNAR_API_KEY is not configured"
    };
  }

  const normalizedLimit = normalizeLimit(limit);
  const cacheKey = keys.socialFeed(sign, cacheCursor(cursor), normalizedLimit);
  const cached = cache ? await cache.get(cacheKey) : null;
  if (cached) {
    return cached;
  }

  const url = new URL(NEYNAR_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("mode", "literal");
  url.searchParams.set("sort_type", "desc_chron");
  url.searchParams.set("limit", String(normalizedLimit));
  if (cursor?.trim()) {
    url.searchParams.set("cursor", cursor.trim());
  }

  const response = await fetcher(url, {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Neynar search failed with ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  const payload: SocialFeedPayload = {
    sign,
    query,
    casts: extractCasts(json),
    nextCursor: extractNextCursor(json),
    updatedAt
  };

  if (cache) {
    await cache.set(cacheKey, payload, CACHE_TTL_SECONDS);
  }
  return payload;
}

export async function fetchAstroTalkFeed({
  cursor = null,
  limit,
  fetcher = fetch,
  cache = defaultCache<AstroTalkFeedPayload>(),
  apiKey = process.env.NEYNAR_API_KEY,
  now = new Date()
}: FetchAstroTalkFeedOptions = {}): Promise<AstroTalkFeedPayload> {
  const query = buildAstroTalkQuery();
  const updatedAt = now.toISOString();
  if (!apiKey) {
    return {
      scope: "astrotalk",
      query,
      casts: [],
      nextCursor: null,
      updatedAt,
      disabled: true,
      error: "NEYNAR_API_KEY is not configured"
    };
  }

  const normalizedLimit = normalizeLimit(limit);
  const cacheKey = keys.astroTalkFeed(cacheCursor(cursor), normalizedLimit);
  const cached = cache ? await cache.get(cacheKey) : null;
  if (cached) {
    return cached;
  }

  const url = new URL(NEYNAR_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("mode", "literal");
  url.searchParams.set("sort_type", "desc_chron");
  url.searchParams.set("limit", String(normalizedLimit));
  if (cursor?.trim()) {
    url.searchParams.set("cursor", cursor.trim());
  }

  const response = await fetcher(url, {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey
    },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Neynar search failed with ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  const payload: AstroTalkFeedPayload = {
    scope: "astrotalk",
    query,
    casts: extractCasts(json),
    nextCursor: extractNextCursor(json),
    updatedAt
  };

  if (cache) {
    await cache.set(cacheKey, payload, CACHE_TTL_SECONDS);
  }
  return payload;
}
