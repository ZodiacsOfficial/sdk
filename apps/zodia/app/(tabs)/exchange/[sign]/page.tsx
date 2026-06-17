import { notFound } from "next/navigation";
import { TokenDetail } from "../../../../components/exchange/TokenDetail";
import { ZODIAC_SIGNS, isZodiacSign } from "../../../../lib/zodiac";

type Params = {
  sign: string;
};

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return ZODIAC_SIGNS.map((sign) => ({ sign }));
}

export default async function ExchangeSignPage({ params }: { params: Promise<Params> }) {
  const { sign } = await params;
  if (!isZodiacSign(sign)) {
    notFound();
  }

  return <TokenDetail sign={sign} />;
}
