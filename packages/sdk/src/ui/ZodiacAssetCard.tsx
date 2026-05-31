import type { CSSProperties } from "react";
import {
  formatZodiacBalance,
  type ZodiacBalanceResult,
  type ZodiacSign
} from "../core/index.js";
import type { ZodiacMarketData } from "../market/index.js";
import { useZodiacBalance, useZodiacMarket, useZodiacToken } from "../react/index.js";
import { ZodiacMarketStrip } from "./ZodiacMarketStrip.js";
import { ZodiacOwnershipBadge } from "./ZodiacOwnershipBadge.js";
import { labelStyle, mutedTextStyle, rowStyle, surfaceStyle } from "./styles.js";

export interface ZodiacAssetCardProps {
  readonly sign: ZodiacSign;
  readonly ownerAddress?: string | null;
  readonly balance?: ZodiacBalanceResult | null;
  readonly market?: ZodiacMarketData | null;
  readonly showMarket?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function ZodiacAssetCard({
  sign,
  ownerAddress,
  balance: balanceProp,
  market: marketProp,
  showMarket = true,
  className,
  style
}: ZodiacAssetCardProps) {
  const { token } = useZodiacToken(sign);
  const shouldReadBalance = balanceProp === undefined;
  const shouldReadMarket = showMarket && marketProp === undefined;
  const balanceState = useZodiacBalance(sign, ownerAddress, { enabled: shouldReadBalance });
  const marketState = useZodiacMarket(sign, { enabled: shouldReadMarket });
  const balance = balanceProp === undefined ? balanceState.data : balanceProp;
  const market = marketProp === undefined ? marketState.data : marketProp;

  return (
    <article
      className={className}
      style={{
        ...surfaceStyle,
        display: "grid",
        gap: 18,
        padding: 18,
        ...style
      }}
    >
      <header style={rowStyle}>
        <div style={{ alignItems: "center", display: "flex", gap: 12, minWidth: 0 }}>
          <span aria-hidden="true" style={{ color: "#f1d38a", fontSize: 32, lineHeight: 1 }}>
            {token.symbol}
          </span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 20, fontWeight: 650, lineHeight: 1.15, margin: 0 }}>{token.name}</h3>
            <p style={{ ...mutedTextStyle, fontSize: 13, margin: "4px 0 0" }}>{token.ticker}</p>
          </div>
        </div>
        <ZodiacOwnershipBadge balance={balance} />
      </header>

      <p style={{ ...mutedTextStyle, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{token.shortBio}</p>

      <dl style={{ display: "grid", gap: 10, margin: 0 }}>
        <InfoRow label="Element" value={token.element} />
        <InfoRow label="Modality" value={token.modality} />
        <InfoRow label="Balance" value={formatZodiacBalance(balance?.balance ?? null, token)} />
      </dl>

      {showMarket ? <ZodiacMarketStrip market={market} /> : null}
    </article>
  );
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div style={rowStyle}>
      <dt style={labelStyle}>{label}</dt>
      <dd style={{ color: "#f3eadb", fontSize: 14, fontWeight: 600, margin: 0, textTransform: "capitalize" }}>
        {value}
      </dd>
    </div>
  );
}
