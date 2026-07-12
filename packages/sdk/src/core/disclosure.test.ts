import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  aggregateDisclosures,
  formatDisclosurePercentage,
  formatDisclosureRawAmount,
  getDisclosure,
  getDisclosureAll,
  parseDisclosureAuthorities,
  parseDisclosureSupply,
  parseDisclosureTopTenAccounts,
  type DisclosureAuthorityValue,
  type DisclosureReadSuccess,
  type DisclosureSupplyValue,
  type DisclosureTopTenAccountsValue,
  type ZodiacDisclosure
} from "./disclosure.js";
import { ZODIAC_SIGNS, type ZodiacSign } from "./types.js";

interface MainnetFixture {
  readonly capturedAt: string;
  readonly mintAddress: string;
  readonly decimals: number;
  readonly getTokenSupply: { readonly result: unknown };
  readonly getAccountInfo: { readonly result: unknown };
  readonly getTokenLargestAccounts: { readonly result: unknown };
}

const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/disclosure/aries-mainnet-2026-07-12.json", import.meta.url),
    "utf8"
  )
) as MainnetFixture;

const publishedSupplyRaw = [
  "999678206507775",
  "999971191376845",
  "999873368815688",
  "999939090363424",
  "999799059031383",
  "999981708827609",
  "999795290115149",
  "999991345402552",
  "999521026139883",
  "999981653290163",
  "999986479833301",
  "999916173438719"
] as const;

const publishedTopTenTenths = [284, 257, 225, 259, 265, 276, 270, 260, 288, 306, 248, 290] as const;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("disclosure response parsing", () => {
  it("reproduces the published 2026-07-12 Aries values byte-for-byte", () => {
    const supply = parseDisclosureSupply(fixture.getTokenSupply.result, fixture.decimals);
    const authorities = parseDisclosureAuthorities(fixture.getAccountInfo.result, fixture.decimals);
    const topTenAccounts = parseDisclosureTopTenAccounts(
      fixture.getTokenLargestAccounts.result,
      supply
    );

    expect(fixture.capturedAt).toBe("2026-07-12T06:10:03Z");
    expect(fixture.mintAddress).toBe("GhFiFrExPY3proVF96oth1gESWA5QPQzdtb8cy8b1YZv");
    expect(supply).toEqual({
      ok: true,
      slot: 432377466,
      value: {
        rawAmount: "999678206507775",
        decimals: 6,
        uiAmountString: "999678206.507775",
        summary: "999,678,206.507775 total"
      }
    });
    expect(authorities).toEqual({
      mintAuthority: {
        ok: true,
        slot: 432377437,
        value: { raw: null, renounced: true, summary: "renounced" }
      },
      freezeAuthority: {
        ok: true,
        slot: 432377437,
        value: { raw: null, renounced: true, summary: "renounced" }
      }
    });
    expect(topTenAccounts).toEqual({
      ok: true,
      slot: 432377468,
      supplySlot: 432377466,
      value: {
        rawAmount: "283940495061292",
        accountCount: 10,
        percentageTenths: 284,
        percentage: "28.4%",
        summary: "28.4% · top-10 token accounts"
      }
    });
    expect(
      JSON.stringify([
        supply.ok ? supply.value.summary : supply.reason,
        authorities.mintAuthority.ok
          ? authorities.mintAuthority.value.summary
          : authorities.mintAuthority.reason,
        authorities.freezeAuthority.ok
          ? authorities.freezeAuthority.value.summary
          : authorities.freezeAuthority.reason,
        topTenAccounts.ok ? topTenAccounts.value.summary : topTenAccounts.reason
      ])
    ).toBe('["999,678,206.507775 total","renounced","renounced","28.4% · top-10 token accounts"]');
  });

  it("keeps malformed or missing reads explicit instead of inventing values", () => {
    const missingSupply = parseDisclosureSupply(
      { context: { slot: 1 }, value: { amount: "100", decimals: 6 } },
      6
    );
    const authorities = parseDisclosureAuthorities(
      {
        context: { slot: 2 },
        value: {
          data: {
            parsed: {
              type: "mint",
              info: { decimals: 6, mintAuthority: null }
            }
          }
        }
      },
      6
    );
    const nullAccount = parseDisclosureAuthorities({ context: { slot: 3 }, value: null }, 6);
    const topTen = parseDisclosureTopTenAccounts(
      { context: { slot: 4 }, value: [] },
      missingSupply
    );

    expect(missingSupply).toEqual({
      ok: false,
      reason:
        "Invalid getTokenSupply response: Token supply uiAmountString must be a non-negative decimal string."
    });
    if (missingSupply.ok) {
      throw new Error("Expected the malformed supply fixture to fail.");
    }
    expect(authorities.mintAuthority).toEqual({
      ok: true,
      slot: 2,
      value: { raw: null, renounced: true, summary: "renounced" }
    });
    expect(authorities.freezeAuthority).toEqual({
      ok: false,
      reason: "Invalid getAccountInfo response: Mint account is missing freezeAuthority."
    });
    expect(nullAccount.mintAuthority).toEqual({
      ok: false,
      reason: "Invalid getAccountInfo response: getAccountInfo value must be an object."
    });
    expect(topTen).toEqual({
      ok: false,
      reason: `Current token supply is unavailable: ${missingSupply.reason}`
    });
  });

  it("uses exact decimal formatting and BigInt half-up percentage rounding", () => {
    const supply: DisclosureReadSuccess<DisclosureSupplyValue> = {
      ok: true,
      slot: 10,
      value: { rawAmount: "6", decimals: 0, uiAmountString: "6", summary: "6 total" }
    };
    const accounts = Array.from({ length: 10 }, (_, index) => ({
      amount: index === 0 ? "1" : "0",
      decimals: 0
    }));
    const topTen = parseDisclosureTopTenAccounts(
      { context: { slot: 11 }, value: accounts },
      supply
    );

    expect(formatDisclosureRawAmount("001234567890000", 6)).toBe("1234567.89");
    expect(formatDisclosureRawAmount("123456789000000", 6)).toBe("123456789");
    expect(formatDisclosurePercentage(167)).toBe("16.7%");
    expect(topTen.ok && topTen.value.percentage).toBe("16.7%");
  });
});

describe("aggregateDisclosures", () => {
  it("reproduces the published aggregate from twelve complete sign rows", () => {
    const disclosures = publishedDisclosures();
    const aggregate = aggregateDisclosures(disclosures);

    expect(aggregate).toEqual({
      supply: {
        ok: true,
        sourceSlots: ZODIAC_SIGNS.map((_, index) => 1_000 + index),
        value: {
          rawAmount: "11998434593142491",
          decimals: 6,
          uiAmountString: "11998434593.142491",
          summary: "11,998,434,593.142491 total"
        }
      },
      mintAuthority: {
        ok: true,
        sourceSlots: ZODIAC_SIGNS.map((_, index) => 2_000 + index),
        value: { renouncedCount: 12, total: 12, summary: "12 of 12 renounced" }
      },
      freezeAuthority: {
        ok: true,
        sourceSlots: ZODIAC_SIGNS.map((_, index) => 3_000 + index),
        value: { renouncedCount: 12, total: 12, summary: "12 of 12 renounced" }
      },
      topTenAccounts: {
        ok: true,
        sourceSlots: ZODIAC_SIGNS.map((_, index) => 4_000 + index),
        value: {
          lowestPercentageTenths: 225,
          highestPercentageTenths: 306,
          lowestPercentage: "22.5%",
          highestPercentage: "30.6%",
          summary: "lowest 22.5% – highest 30.6%"
        }
      }
    });

    disclosures.pisces = {
      ...disclosures.pisces,
      topTenAccounts: { ok: false, reason: "getTokenLargestAccounts: HTTP 429" }
    };

    expect(aggregateDisclosures(disclosures).topTenAccounts).toEqual({
      ok: false,
      reason: "11 of 12 current sign values available"
    });
    expect(aggregateDisclosures(disclosures).supply.ok).toBe(true);
  });
});

describe("getDisclosure", () => {
  it("retries a 429 without parallel requests and returns the parsed fields", async () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-07-12T00:00:00.000Z");
    const startedAt = Date.now();
    const responses = [
      jsonResponse({ error: { message: "rate limited" } }, 429, "86400"),
      jsonResponse(fixture.getTokenSupply),
      jsonResponse(fixture.getAccountInfo),
      jsonResponse(fixture.getTokenLargestAccounts)
    ];
    const methods: string[] = [];
    let activeRequests = 0;
    let maximumActiveRequests = 0;
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        activeRequests += 1;
        maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
        methods.push(JSON.parse(String(init?.body)).method as string);
        await Promise.resolve();
        activeRequests -= 1;
        const response = responses.shift();

        if (!response) {
          throw new Error("Unexpected mocked RPC request.");
        }

        return response;
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const pending = getDisclosure("aries", { rpcUrl: "https://rpc.example" });
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(methods).toEqual([
      "getTokenSupply",
      "getTokenSupply",
      "getAccountInfo",
      "getTokenLargestAccounts"
    ]);
    expect(maximumActiveRequests).toBe(1);
    expect(Date.now() - startedAt).toBe(30_000);
    expect(result.mintAddress).toBe(fixture.mintAddress);
    expect(result.readAt).toMatch(/^\d{4}-\d{2}-\d{2}T/u);
    expect(result.supply.ok && result.supply.value.summary).toBe("999,678,206.507775 total");
    expect(result.topTenAccounts.ok && result.topTenAccounts.value.summary).toBe(
      "28.4% · top-10 token accounts"
    );
  });

  it("returns explicit field failures after bounded server retries", async () => {
    vi.useFakeTimers();
    let supplyAttempts = 0;
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const method = JSON.parse(String(init?.body)).method as string;

        if (method === "getTokenSupply") {
          supplyAttempts += 1;
          return jsonResponse({ error: { message: "temporarily unavailable" } }, 503);
        }

        return method === "getAccountInfo"
          ? jsonResponse(fixture.getAccountInfo)
          : jsonResponse(fixture.getTokenLargestAccounts);
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const pending = getDisclosure("aries", { rpcUrl: "https://rpc.example" });
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(supplyAttempts).toBe(3);
    expect(result.supply).toEqual({
      ok: false,
      reason: "getTokenSupply: HTTP 503 — temporarily unavailable"
    });
    expect(result.mintAuthority.ok).toBe(true);
    expect(result.freezeAuthority.ok).toBe(true);
    expect(result.topTenAccounts).toEqual({
      ok: false,
      reason:
        "Current token supply is unavailable: getTokenSupply: HTTP 503 — temporarily unavailable"
    });
  });
});

describe("getDisclosureAll", () => {
  it("performs all 36 RPC reads strictly sequentially with default pacing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime("2026-07-12T00:00:00.000Z");
    const startedAt = Date.now();
    let activeRequests = 0;
    let maximumActiveRequests = 0;
    const methods: string[] = [];
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
        activeRequests += 1;
        maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
        const method = JSON.parse(String(init?.body)).method as string;
        methods.push(method);
        await Promise.resolve();
        activeRequests -= 1;

        if (method === "getTokenSupply") {
          return jsonResponse(fixture.getTokenSupply);
        }

        return method === "getAccountInfo"
          ? jsonResponse(fixture.getAccountInfo)
          : jsonResponse(fixture.getTokenLargestAccounts);
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const pending = getDisclosureAll({ rpcUrl: "https://rpc.example" });
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(maximumActiveRequests).toBe(1);
    expect(Date.now() - startedAt).toBe(35 * 300);
    expect(methods).toHaveLength(36);
    expect(methods).toEqual(
      ZODIAC_SIGNS.flatMap(() => ["getTokenSupply", "getAccountInfo", "getTokenLargestAccounts"])
    );
    expect(Object.keys(result.disclosures)).toEqual(ZODIAC_SIGNS);
    expect(result.aggregate.supply.ok).toBe(true);
    expect(result.aggregate.mintAuthority.ok).toBe(true);
    expect(result.aggregate.freezeAuthority.ok).toBe(true);
    expect(result.aggregate.topTenAccounts.ok).toBe(true);
  });
});

function publishedDisclosures(): Record<ZodiacSign, ZodiacDisclosure> {
  return Object.fromEntries(
    ZODIAC_SIGNS.map((sign, index) => {
      const rawAmount = publishedSupplyRaw[index];
      const percentageTenths = publishedTopTenTenths[index];

      if (rawAmount === undefined || percentageTenths === undefined) {
        throw new Error(`Missing published fixture row for ${sign}.`);
      }

      const authority = (slot: number): DisclosureReadSuccess<DisclosureAuthorityValue> => ({
        ok: true,
        slot,
        value: { raw: null, renounced: true, summary: "renounced" }
      });
      const topTen: DisclosureReadSuccess<DisclosureTopTenAccountsValue> & {
        readonly supplySlot: number;
      } = {
        ok: true,
        slot: 4_000 + index,
        supplySlot: 1_000 + index,
        value: {
          rawAmount: "0",
          accountCount: 10,
          percentageTenths,
          percentage: formatDisclosurePercentage(percentageTenths),
          summary: `${formatDisclosurePercentage(percentageTenths)} · top-10 token accounts`
        }
      };
      const row: ZodiacDisclosure = {
        sign,
        mintAddress: `Mint${index + 1}`,
        decimals: 6,
        readAt: "2026-07-12T00:00:00.000Z",
        supply: {
          ok: true,
          slot: 1_000 + index,
          value: {
            rawAmount,
            decimals: 6,
            uiAmountString: formatDisclosureRawAmount(rawAmount, 6),
            summary: "unused in aggregate fixture"
          }
        },
        mintAuthority: authority(2_000 + index),
        freezeAuthority: authority(3_000 + index),
        topTenAccounts: topTen
      };

      return [sign, row];
    })
  ) as Record<ZodiacSign, ZodiacDisclosure>;
}

function jsonResponse(value: unknown, status = 200, retryAfter = "0"): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json", "retry-after": retryAfter }
  });
}
