import type { ZodiacSign } from "../lib/zodiac";

/** Accent pulled from each sign's official circle icon, used to tint glass surfaces. */
export const SIGN_COLORS: Record<ZodiacSign, string> = {
  aries: "#f0907c",
  taurus: "#a8bf8f",
  gemini: "#b8a6e8",
  cancer: "#9fc4d8",
  leo: "#e8a2b4",
  virgo: "#8fbf9f",
  libra: "#c4a6d8",
  scorpio: "#7cc4c9",
  sagittarius: "#e8b06c",
  capricorn: "#b3bf8a",
  aquarius: "#9aaee8",
  pisces: "#93d4bd"
};
