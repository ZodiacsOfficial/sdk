import type { CSSProperties } from "react";
import { ZODIAC_SIGNS, type ZodiacSign } from "../core/index.js";
import { ZodiacAssetCard } from "./ZodiacAssetCard.js";

export interface ZodiacsPanelProps {
  readonly ownerAddress?: string | null;
  readonly signs?: readonly ZodiacSign[];
  readonly showMarket?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function ZodiacsPanel({
  ownerAddress,
  signs = ZODIAC_SIGNS,
  showMarket = false,
  className,
  style
}: ZodiacsPanelProps) {
  return (
    <section
      className={className}
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        ...style
      }}
    >
      {signs.map((sign) => {
        const ownerProps = ownerAddress === undefined ? {} : { ownerAddress };

        return <ZodiacAssetCard key={sign} {...ownerProps} showMarket={showMarket} sign={sign} />;
      })}
    </section>
  );
}
