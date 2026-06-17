import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getZodiacToken } from "@zodiacs/sdk/core";
import { GET } from "../app/api/social/feed/route";
import { GET as GET_ASTROTALK } from "../app/api/social/astrotalk/route";
import {
  astroTalkTerms,
  buildAstroTalkQuery,
  buildSocialFeedQuery,
  fetchAstroTalkFeed,
  fetchSocialFeed,
  socialTermsForSign,
  type AstroTalkFeedPayload,
  type SocialFeedPayload
} from "./social";
import { ZODIAC_SIGNS } from "./zodiac";

const originalNeynarKey = process.env.NEYNAR_API_KEY;
const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
  restoreEnv("NEYNAR_API_KEY", originalNeynarKey);
  restoreEnv("UPSTASH_REDIS_REST_URL", originalRedisUrl);
  restoreEnv("UPSTASH_REDIS_REST_TOKEN", originalRedisToken);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("social feed query builder", () => {
  it("builds official ticker, name, and glyph terms for all twelve signs", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);

    for (const sign of ZODIAC_SIGNS) {
      const token = getZodiacToken(sign);
      const terms = socialTermsForSign(sign);
      const query = buildSocialFeedQuery(sign);

      expect(terms).toContain(`$${token.ticker}`);
      expect(terms).toContain(token.name);
      expect(terms).toContain(token.symbol);
      expect(query).toContain(`"$${token.ticker}"`);
      expect(query).toContain(`"${token.name}"`);
      expect(query).toContain(`"${token.symbol}"`);
    }
  });

  it("keeps Sagittarius as the only configured extra alias", () => {
    for (const sign of ZODIAC_SIGNS) {
      const terms = socialTermsForSign(sign);
      if (sign === "sagittarius") {
        expect(terms).toContain("$SAGIT");
      } else {
        expect(terms).toHaveLength(3);
      }
    }
  });

  it("includes official Sagittarius terms and the approved SAGIT alias", () => {
    expect(socialTermsForSign("sagittarius")).toEqual([
      "$SAGITTARIUS",
      "$SAGIT",
      "Sagittarius",
      "♐"
    ]);
    expect(buildSocialFeedQuery("sagittarius")).toBe(
      '"$SAGITTARIUS" | "$SAGIT" | "Sagittarius" | "♐"'
    );
  });

  it("builds the narrow global AstroTalk query without aggregating all sign feeds", () => {
    expect(astroTalkTerms()).toEqual([
      "Zodia",
      "Zodiacs",
      "$ZODIACS",
      "sdk-zodia.vercel.app",
      "zodiacs.org"
    ]);
    expect(buildAstroTalkQuery()).toBe(
      '"Zodia" | "Zodiacs" | "$ZODIACS" | "sdk-zodia.vercel.app" | "zodiacs.org"'
    );

    for (const sign of ZODIAC_SIGNS) {
      const token = getZodiacToken(sign);
      expect(buildAstroTalkQuery()).not.toContain(`"$${token.ticker}"`);
      expect(buildAstroTalkQuery()).not.toContain(`"${token.symbol}"`);
    }
  });
});

describe("fetchSocialFeed", () => {
  it("returns a disabled payload without calling Neynar when the API key is missing", async () => {
    const fetcher = vi.fn();

    const payload = await fetchSocialFeed({
      sign: "sagittarius",
      apiKey: "",
      fetcher,
      cache: null,
      now: new Date("2026-06-14T00:00:00.000Z")
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      sign: "sagittarius",
      casts: [],
      nextCursor: null,
      disabled: true,
      error: "NEYNAR_API_KEY is not configured",
      updatedAt: "2026-06-14T00:00:00.000Z"
    });
  });

  it("calls Neynar literal search and normalizes casts with pagination", async () => {
    const calls: { url: URL; init: RequestInit | undefined }[] = [];
    const fetcher = vi.fn(async (input: string | URL, init?: RequestInit) => {
      calls.push({ url: new URL(String(input)), init });
      return new Response(
        JSON.stringify({
          result: {
            casts: [
              {
                hash: "0xabc",
                author: {
                  fid: 123,
                  username: "astro",
                  display_name: "Astro",
                  pfp_url: "https://example.com/avatar.png"
                },
                text: "$SAGIT is moving",
                timestamp: "2026-06-14T01:02:03.000Z",
                embeds: [{ url: "https://sdk-zodia.vercel.app/exchange/sagittarius" }],
                reactions: { likes_count: 7, recasts_count: 2 },
                replies: { count: 4 }
              },
              { text: "missing hash" }
            ],
            next: { cursor: "next-page" }
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    const payload = await fetchSocialFeed({
      sign: "sagittarius",
      cursor: "cursor-page",
      limit: 13,
      apiKey: "test-key",
      fetcher,
      cache: null,
      now: new Date("2026-06-14T00:00:00.000Z")
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const call = calls[0];
    if (!call) {
      throw new Error("expected Neynar fetch call");
    }
    expect(call.url.origin + call.url.pathname).toBe(
      "https://api.neynar.com/v2/farcaster/cast/search/"
    );
    expect(call.url.searchParams.get("q")).toBe(buildSocialFeedQuery("sagittarius"));
    expect(call.url.searchParams.get("mode")).toBe("literal");
    expect(call.url.searchParams.get("sort_type")).toBe("desc_chron");
    expect(call.url.searchParams.get("limit")).toBe("13");
    expect(call.url.searchParams.get("cursor")).toBe("cursor-page");
    expect(new Headers(call.init?.headers).get("x-api-key")).toBe("test-key");
    expect(payload.nextCursor).toBe("next-page");
    expect(payload.casts).toEqual([
      {
        id: "0xabc",
        hash: "0xabc",
        author: {
          fid: 123,
          username: "astro",
          displayName: "Astro",
          pfpUrl: "https://example.com/avatar.png"
        },
        text: "$SAGIT is moving",
        timestamp: "2026-06-14T01:02:03.000Z",
        embeds: ["https://sdk-zodia.vercel.app/exchange/sagittarius"],
        replies: 4,
        likes: 7,
        recasts: 2,
        url: "https://warpcast.com/astro/0xabc"
      }
    ]);
  });

  it("returns a cached page without calling Neynar", async () => {
    const cached: SocialFeedPayload = {
      sign: "sagittarius",
      query: buildSocialFeedQuery("sagittarius"),
      casts: [],
      nextCursor: null,
      updatedAt: "2026-06-14T00:00:00.000Z"
    };
    const cache = {
      get: vi.fn(async () => cached),
      set: vi.fn()
    };
    const fetcher = vi.fn();

    const payload = await fetchSocialFeed({
      sign: "sagittarius",
      apiKey: "test-key",
      fetcher,
      cache
    });

    expect(payload).toBe(cached);
    expect(fetcher).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });
});

describe("fetchAstroTalkFeed", () => {
  it("returns a disabled payload without calling Neynar when the API key is missing", async () => {
    const fetcher = vi.fn();

    const payload = await fetchAstroTalkFeed({
      apiKey: "",
      fetcher,
      cache: null,
      now: new Date("2026-06-14T00:00:00.000Z")
    });

    expect(fetcher).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      scope: "astrotalk",
      casts: [],
      nextCursor: null,
      disabled: true,
      error: "NEYNAR_API_KEY is not configured",
      updatedAt: "2026-06-14T00:00:00.000Z"
    });
  });

  it("calls Neynar literal search and normalizes casts with pagination", async () => {
    const calls: { url: URL; init: RequestInit | undefined }[] = [];
    const fetcher = vi.fn(async (input: string | URL, init?: RequestInit) => {
      calls.push({ url: new URL(String(input)), init });
      return new Response(
        JSON.stringify({
          result: {
            casts: [
              {
                hash: "0xzodia",
                author: {
                  fid: 456,
                  username: "zodia",
                  display_name: "Zodia",
                  pfp_url: "https://example.com/zodia.png"
                },
                text: "Zodia is live",
                timestamp: "2026-06-14T01:02:03.000Z",
                embeds: [{ url: "https://sdk-zodia.vercel.app/chat" }],
                reactions: { likes_count: 9, recasts_count: 3 },
                replies: { count: 5 }
              }
            ],
            next: { cursor: "next-astro" }
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    const payload = await fetchAstroTalkFeed({
      cursor: "cursor-astro",
      limit: 11,
      apiKey: "test-key",
      fetcher,
      cache: null,
      now: new Date("2026-06-14T00:00:00.000Z")
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const call = calls[0];
    if (!call) {
      throw new Error("expected Neynar fetch call");
    }
    expect(call.url.searchParams.get("q")).toBe(buildAstroTalkQuery());
    expect(call.url.searchParams.get("mode")).toBe("literal");
    expect(call.url.searchParams.get("sort_type")).toBe("desc_chron");
    expect(call.url.searchParams.get("limit")).toBe("11");
    expect(call.url.searchParams.get("cursor")).toBe("cursor-astro");
    expect(new Headers(call.init?.headers).get("x-api-key")).toBe("test-key");
    expect(payload).toMatchObject({
      scope: "astrotalk",
      nextCursor: "next-astro",
      casts: [
        {
          id: "0xzodia",
          hash: "0xzodia",
          text: "Zodia is live",
          replies: 5,
          likes: 9,
          recasts: 3,
          url: "https://warpcast.com/zodia/0xzodia"
        }
      ]
    });
  });

  it("returns a cached AstroTalk page without calling Neynar", async () => {
    const cached: AstroTalkFeedPayload = {
      scope: "astrotalk",
      query: buildAstroTalkQuery(),
      casts: [],
      nextCursor: null,
      updatedAt: "2026-06-14T00:00:00.000Z"
    };
    const cache = {
      get: vi.fn(async () => cached),
      set: vi.fn()
    };
    const fetcher = vi.fn();

    const payload = await fetchAstroTalkFeed({
      apiKey: "test-key",
      fetcher,
      cache
    });

    expect(payload).toBe(cached);
    expect(fetcher).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });
});

describe("GET /api/social/feed", () => {
  it("rejects invalid signs", async () => {
    const response = await GET(
      new Request("https://sdk-zodia.vercel.app/api/social/feed?sign=notasign")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid sign" });
  });

  it("returns a quiet disabled payload when Neynar is not configured", async () => {
    process.env.NEYNAR_API_KEY = "";

    const response = await GET(
      new Request("https://sdk-zodia.vercel.app/api/social/feed?sign=sagittarius")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      sign: "sagittarius",
      casts: [],
      nextCursor: null,
      disabled: true
    });
  });

  it("passes pagination through to Neynar", async () => {
    process.env.NEYNAR_API_KEY = "route-key";
    const fetcher = vi.fn(async (_input: string | URL, _init?: RequestInit) => {
      return new Response(JSON.stringify({ result: { casts: [], next: { cursor: "next" } } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    vi.stubGlobal("fetch", fetcher);

    const response = await GET(
      new Request(
        "https://sdk-zodia.vercel.app/api/social/feed?sign=sagittarius&cursor=start&limit=10"
      )
    );
    const payload = await response.json();
    const firstCall = fetcher.mock.calls[0];
    if (!firstCall) {
      throw new Error("expected route fetch call");
    }
    const calledUrl = new URL(String(firstCall[0]));

    expect(response.status).toBe(200);
    expect(payload.nextCursor).toBe("next");
    expect(calledUrl.searchParams.get("cursor")).toBe("start");
    expect(calledUrl.searchParams.get("limit")).toBe("10");
  });
});

describe("GET /api/social/astrotalk", () => {
  it("returns a quiet disabled payload when Neynar is not configured", async () => {
    process.env.NEYNAR_API_KEY = "";

    const response = await GET_ASTROTALK(
      new Request("https://sdk-zodia.vercel.app/api/social/astrotalk")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      scope: "astrotalk",
      casts: [],
      nextCursor: null,
      disabled: true
    });
  });

  it("passes AstroTalk pagination through to Neynar", async () => {
    process.env.NEYNAR_API_KEY = "route-key";
    const fetcher = vi.fn(async (_input: string | URL, _init?: RequestInit) => {
      return new Response(JSON.stringify({ result: { casts: [], next: { cursor: "next" } } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    vi.stubGlobal("fetch", fetcher);

    const response = await GET_ASTROTALK(
      new Request("https://sdk-zodia.vercel.app/api/social/astrotalk?cursor=start&limit=10")
    );
    const payload = await response.json();
    const firstCall = fetcher.mock.calls[0];
    if (!firstCall) {
      throw new Error("expected AstroTalk route fetch call");
    }
    const calledUrl = new URL(String(firstCall[0]));

    expect(response.status).toBe(200);
    expect(payload.nextCursor).toBe("next");
    expect(calledUrl.searchParams.get("q")).toBe(buildAstroTalkQuery());
    expect(calledUrl.searchParams.get("cursor")).toBe("start");
    expect(calledUrl.searchParams.get("limit")).toBe("10");
  });
});
