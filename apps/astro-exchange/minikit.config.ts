const rawUrl = process.env.NEXT_PUBLIC_URL?.trim() || "http://localhost:3000";

export const appUrl = rawUrl.replace(/\/+$/, "");

export const appConfig = {
  name: "Zodiacs Astro Exchange",
  subtitle: "Trade with the stars",
  description:
    "Daily horoscopes, real planetary events, and the twelve official Zodiacs on Base. " +
    "Astrology content is entertainment only and never investment advice.",
  primaryCategory: "finance",
  tags: ["astrology", "zodiac", "horoscope", "base", "social"],
  iconUrl: `${appUrl}/icon.png`,
  splashImageUrl: `${appUrl}/splash.png`,
  splashBackgroundColor: "#0b0d1a",
  heroImageUrl: `${appUrl}/hero.png`,
  homeUrl: appUrl,
  webhookUrl: `${appUrl}/api/webhook`,
  requiredChains: ["eip155:8453"],
  noindex: process.env.NEXT_PUBLIC_APP_ENV !== "production"
} as const;

export function accountAssociation() {
  const header = process.env.FARCASTER_ASSOCIATION_HEADER?.trim();
  const payload = process.env.FARCASTER_ASSOCIATION_PAYLOAD?.trim();
  const signature = process.env.FARCASTER_ASSOCIATION_SIGNATURE?.trim();
  if (!header || !payload || !signature) {
    return null;
  }
  return { header, payload, signature };
}
