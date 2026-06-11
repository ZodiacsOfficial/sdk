import Image from "next/image";
import type { StaticImageData } from "next/image";
import aquarius from "@zodiacs/sdk/assets/zodiac-icons/circle/aquarius.png";
import aries from "@zodiacs/sdk/assets/zodiac-icons/circle/aries.png";
import cancer from "@zodiacs/sdk/assets/zodiac-icons/circle/cancer.png";
import capricorn from "@zodiacs/sdk/assets/zodiac-icons/circle/capricorn.png";
import gemini from "@zodiacs/sdk/assets/zodiac-icons/circle/gemini.png";
import leo from "@zodiacs/sdk/assets/zodiac-icons/circle/leo.png";
import libra from "@zodiacs/sdk/assets/zodiac-icons/circle/libra.png";
import pisces from "@zodiacs/sdk/assets/zodiac-icons/circle/pisces.png";
import sagittarius from "@zodiacs/sdk/assets/zodiac-icons/circle/sagittarius.png";
import scorpio from "@zodiacs/sdk/assets/zodiac-icons/circle/scorpio.png";
import taurus from "@zodiacs/sdk/assets/zodiac-icons/circle/taurus.png";
import virgo from "@zodiacs/sdk/assets/zodiac-icons/circle/virgo.png";
import type { ZodiacSign } from "../lib/zodiac";

/** Official Zodiacs.org circle icons, imported straight from the SDK package. */
export const SIGN_ICONS: Record<ZodiacSign, StaticImageData> = {
  aries,
  taurus,
  gemini,
  cancer,
  leo,
  virgo,
  libra,
  scorpio,
  sagittarius,
  capricorn,
  aquarius,
  pisces
};

export function SignIcon({ sign, size = 38 }: { sign: ZodiacSign; size?: number }) {
  return (
    <Image
      className="sign-icon"
      src={SIGN_ICONS[sign]}
      alt={`Official ${sign} icon`}
      width={size}
      height={size}
    />
  );
}
