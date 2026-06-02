import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ZodiacToken } from "../core/index.js";
import { ZodiacAssetCard } from "./ZodiacAssetCard.js";

const hookMocks = vi.hoisted(() => ({
  useZodiacBalance: vi.fn(),
  useZodiacMarket: vi.fn(),
  useZodiacToken: vi.fn()
}));

vi.mock("../react/index.js", () => hookMocks);

const token = {
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
  shortBio: "A cultural asset for symbolic identity.",
  decimals: 6,
  mintAddress: "GhFiFrExPY3proVF96oth1gESWA5QPQzdtb8cy8b1YZv",
  marketLinks: {
    dexScreener: "https://dexscreener.com/solana/GhFiFrExPY3proVF96oth1gESWA5QPQzdtb8cy8b1YZv",
    jupiter: "https://jup.ag/tokens/GhFiFrExPY3proVF96oth1gESWA5QPQzdtb8cy8b1YZv"
  }
} satisfies ZodiacToken;

beforeEach(() => {
  hookMocks.useZodiacToken.mockReturnValue({ metadata: {}, token });
  hookMocks.useZodiacBalance.mockReturnValue({ data: null, error: null, loading: false });
  hookMocks.useZodiacMarket.mockReturnValue({ data: null, error: null, loading: false });
});

describe("ZodiacAssetCard", () => {
  it("does not perform internal reads when controlled balance and market props are supplied", () => {
    const markup = renderToStaticMarkup(
      <ZodiacAssetCard balance={null} market={null} ownerAddress="owner" sign="aries" />
    );

    expect(markup).toContain("Aries");
    expect(hookMocks.useZodiacBalance).toHaveBeenCalledWith("aries", "owner", { enabled: false });
    expect(hookMocks.useZodiacMarket).toHaveBeenCalledWith("aries", { enabled: false });
  });

  it("keeps internal reads enabled for uncontrolled data", () => {
    renderToStaticMarkup(<ZodiacAssetCard ownerAddress="owner" sign="aries" />);

    expect(hookMocks.useZodiacBalance).toHaveBeenCalledWith("aries", "owner", { enabled: true });
    expect(hookMocks.useZodiacMarket).toHaveBeenCalledWith("aries", { enabled: true });
  });
});
