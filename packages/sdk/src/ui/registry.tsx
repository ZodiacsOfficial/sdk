import type { CSSProperties } from "react";
import {
  getBaseZodiacRepresentation,
  getIdentityReceiptData,
  getElementComposition,
  getModalityComposition,
  getNativeCounterpart,
  getRepresentationByAddress,
  getZodiacAsset,
  getZodiacIdentityContext,
  getZodiacWheelData,
  getZodiacWheelState,
  isOfficialZodiacAddress,
  type IdentityReceiptData,
  type ZodiacCompatibilityContext,
  type ZodiacAddressLookupOptions,
  type ZodiacIdentityContext,
  type ZodiacIdentityOwnershipInput,
  type ZodiacRepresentation,
  type ZodiacSign,
  type ZodiacWheelData,
  type ZodiacWheelDataItem
} from "../core/index.js";
import { labelStyle, mutedTextStyle, surfaceStyle } from "./styles.js";

export interface ZodiacTokenCardProps {
  readonly item?: ZodiacWheelDataItem;
  readonly sign?: ZodiacSign;
  readonly representation?: ZodiacRepresentation;
  readonly held?: boolean;
  readonly style?: CSSProperties;
}

export interface ProfileSummaryCardProps {
  readonly context: ZodiacIdentityContext;
  readonly style?: CSSProperties;
}

export interface ShareCardPreviewProps {
  readonly context: ZodiacIdentityContext | IdentityReceiptData;
  readonly style?: CSSProperties;
}

export interface CompatibilityWheelProps {
  readonly compatibility: ZodiacCompatibilityContext;
  readonly style?: CSSProperties;
}

export function OfficialZodiacBadge({
  address,
  representation,
  options
}: {
  readonly address?: string;
  readonly representation?: ZodiacRepresentation | null;
  readonly options?: ZodiacAddressLookupOptions;
}) {
  const resolved =
    representation ?? (address ? getRepresentationByAddress(address, options) : null);

  if (!resolved) {
    return <span style={badgeStyle}>Not found in the official Zodiacs.org registry</span>;
  }

  return (
    <span style={badgeStyle}>
      {resolved.kind === "native"
        ? "Official native Zodiacs.org asset on Solana"
        : "Official bridged Zodiacs.org asset on Base"}
    </span>
  );
}

export function ZodiacRepresentationBadge({
  representation
}: {
  readonly representation: ZodiacRepresentation;
}) {
  return <span style={badgeStyle}>{representation.kind === "native" ? "Native" : "Bridged"}</span>;
}

export function ZodiacChainBadge({
  representation
}: {
  readonly representation: ZodiacRepresentation;
}) {
  return <span style={badgeStyle}>{representation.chain === "solana" ? "Solana" : "Base"}</span>;
}

export function ZodiacBridgeProvenance({
  representation
}: {
  readonly representation: ZodiacRepresentation;
}) {
  if (!representation.bridge) {
    return <p style={mutedTextStyle}>Native on Solana.</p>;
  }

  return (
    <p style={mutedTextStyle}>
      Bridged from {representation.bridge.sourceChain} to {representation.bridge.destinationChain}
      {representation.bridge.protocol ? ` through ${representation.bridge.protocol}` : ""}.
    </p>
  );
}

export function OfficialZodiacTokenCard({
  sign,
  chain = "solana",
  style
}: {
  readonly sign: ZodiacSign;
  readonly chain?: "solana" | "base";
  readonly style?: CSSProperties;
}) {
  const asset = getZodiacAsset(sign);
  const representation = chain === "base" ? getBaseZodiacRepresentation(sign) : asset.native;

  return (
    <article style={{ ...surfaceStyle, display: "grid", gap: 12, padding: 16, ...style }}>
      <header>
        <p style={labelStyle}>{asset.displayName}</p>
        <h3 style={{ margin: "4px 0 0" }}>{representation.symbol}</h3>
      </header>
      <OfficialZodiacBadge representation={representation} />
      <p style={mutedTextStyle}>{asset.metadata.shortBio}</p>
      <ZodiacBridgeProvenance representation={representation} />
    </article>
  );
}

export function ZodiacTokenCard({ item, sign, representation, held, style }: ZodiacTokenCardProps) {
  const resolvedSign = item?.sign ?? sign ?? representation?.sign;

  if (!resolvedSign) {
    return <UnverifiedZodiacWarning />;
  }

  const asset = getZodiacAsset(resolvedSign);
  const resolvedRepresentation = representation ?? asset.native;
  const resolvedHeld = held ?? item?.held ?? false;

  return (
    <article style={{ ...surfaceStyle, display: "grid", gap: 10, padding: 14, ...style }}>
      <header
        style={{ alignItems: "start", display: "flex", gap: 12, justifyContent: "space-between" }}
      >
        <div>
          <p style={labelStyle}>{asset.displayName}</p>
          <h3 style={{ fontSize: 18, lineHeight: 1.2, margin: "4px 0 0" }}>
            {resolvedRepresentation.symbol}
          </h3>
        </div>
        <span style={resolvedHeld ? badgeStyle : quietBadgeStyle}>
          {resolvedHeld ? "Held" : "Not held"}
        </span>
      </header>
      <p style={mutedTextStyle}>
        {asset.metadata.element} · {asset.metadata.modality}
      </p>
      <ZodiacBridgeProvenance representation={resolvedRepresentation} />
    </article>
  );
}

export function OfficialZodiacsGrid({ chain = "solana" }: { readonly chain?: "solana" | "base" }) {
  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
      }}
    >
      {(
        [
          "aries",
          "taurus",
          "gemini",
          "cancer",
          "leo",
          "virgo",
          "libra",
          "scorpio",
          "sagittarius",
          "capricorn",
          "aquarius",
          "pisces"
        ] as const
      ).map((sign) => (
        <OfficialZodiacTokenCard key={sign} chain={chain} sign={sign} />
      ))}
    </section>
  );
}

export function ZodiacAddressVerifier({
  address,
  options
}: {
  readonly address: string;
  readonly options?: ZodiacAddressLookupOptions;
}) {
  const representation = getRepresentationByAddress(address, options);
  const native = representation
    ? getNativeCounterpart(representation.address, { chain: representation.chain })
    : null;
  const bridged = representation ? getBaseZodiacRepresentation(representation.sign) : null;

  if (!representation) {
    return <UnverifiedZodiacWarning address={address} />;
  }

  return (
    <article style={{ ...surfaceStyle, display: "grid", gap: 10, padding: 16 }}>
      <OfficialZodiacBadge representation={representation} />
      <VerifierRow label="Sign" value={representation.sign} />
      <VerifierRow label="Chain" value={representation.chain} />
      <VerifierRow label="Representation" value={representation.kind} />
      <VerifierRow label="Token standard" value={representation.tokenStandard} />
      <VerifierRow label="Origin chain" value={representation.originChain ?? "solana"} />
      <VerifierRow label="Native counterpart" value={native?.address ?? "Unavailable"} />
      <VerifierRow label="Base counterpart" value={bridged?.address ?? "Unavailable"} />
      <ZodiacBridgeProvenance representation={representation} />
    </article>
  );
}

export function UnverifiedZodiacWarning({ address }: { readonly address?: string }) {
  return (
    <article style={{ ...surfaceStyle, padding: 16 }}>
      <p style={labelStyle}>Unverified</p>
      <p style={mutedTextStyle}>
        {address
          ? `${address} is not found in the official Zodiacs.org registry.`
          : "Not found in the official Zodiacs.org registry."}
      </p>
    </article>
  );
}

export function ZodiacShelf({
  ownership,
  wheel
}: {
  readonly ownership?: {
    readonly holdings: readonly { readonly sign: ZodiacSign; readonly held: boolean }[];
  };
  readonly wheel?: ZodiacWheelData;
}) {
  const resolvedWheel = wheel ?? (ownership ? getZodiacWheelData(ownership) : null);
  const held = resolvedWheel?.heldSigns ?? [];

  return (
    <section style={{ ...surfaceStyle, padding: 16 }}>
      <p style={labelStyle}>Public Zodiacs shelf</p>
      <p style={mutedTextStyle}>{held.join(", ") || "No held signs found."}</p>
    </section>
  );
}

export function ZodiacWheel({
  ownership,
  wheel
}: {
  readonly ownership?: {
    readonly holdings: readonly { readonly sign: ZodiacSign; readonly held: boolean }[];
  };
  readonly wheel?: ZodiacWheelData;
}) {
  const items = wheel?.items ?? (ownership ? getZodiacWheelState(ownership) : []);

  return (
    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
      {items.map((item) => (
        <span key={item.sign} style={item.held ? badgeStyle : quietBadgeStyle}>
          {item.sign}
        </span>
      ))}
    </div>
  );
}

export function ZodiacElementComposition({
  ownership
}: {
  readonly ownership: {
    readonly holdings: readonly { readonly sign: ZodiacSign; readonly held: boolean }[];
  };
}) {
  return <Composition title="Element mix" composition={getElementComposition(ownership)} />;
}

export function ZodiacModalityComposition({
  ownership
}: {
  readonly ownership: {
    readonly holdings: readonly { readonly sign: ZodiacSign; readonly held: boolean }[];
  };
}) {
  return <Composition title="Modality mix" composition={getModalityComposition(ownership)} />;
}

export function IdentityReceiptCard({
  ownership,
  receipt
}: {
  readonly ownership?: ZodiacIdentityOwnershipInput;
  readonly receipt?: IdentityReceiptData;
}) {
  const resolvedReceipt =
    receipt ??
    (ownership ? getIdentityReceiptData(ownership) : getIdentityReceiptData({ holdings: [] }));

  return (
    <article style={{ ...surfaceStyle, display: "grid", gap: 10, padding: 16 }}>
      <p style={labelStyle}>Identity receipt</p>
      <p style={mutedTextStyle}>{resolvedReceipt.label}</p>
      {resolvedReceipt.receiptFacts.map((fact) => (
        <VerifierRow key={fact.label} label={fact.label} value={fact.value} />
      ))}
    </article>
  );
}

export function ProfileSummaryCard({ context, style }: ProfileSummaryCardProps) {
  return (
    <article style={{ ...surfaceStyle, display: "grid", gap: 10, padding: 16, ...style }}>
      <p style={labelStyle}>Profile summary</p>
      <h3 style={{ fontSize: 20, lineHeight: 1.2, margin: 0 }}>{context.shareTitle}</h3>
      <p style={mutedTextStyle}>{context.shareDescription}</p>
      <VerifierRow label="Wheel coverage" value={`${context.wheelCoverage}%`} />
      <VerifierRow label="Solana native" value={String(context.nativeCount)} />
      <VerifierRow label="Base bridged" value={String(context.bridgedCount)} />
    </article>
  );
}

export function ShareCardPreview({ context, style }: ShareCardPreviewProps) {
  return (
    <article
      aria-label="Zodiacs share card preview"
      style={{
        ...surfaceStyle,
        background: "#10131a",
        display: "grid",
        gap: 14,
        maxWidth: 420,
        padding: 18,
        ...style
      }}
    >
      <p style={labelStyle}>Zodiacs official registry</p>
      <h3 style={{ color: "#f6ecd7", fontSize: 24, lineHeight: 1.15, margin: 0 }}>
        {context.shareTitle}
      </h3>
      <p style={mutedTextStyle}>{context.shareDescription}</p>
      <ZodiacWheel
        wheel={getZodiacWheelData({
          holdings: context.heldSigns.map((sign) => ({ sign, held: true }))
        })}
      />
    </article>
  );
}

export function CompatibilityWheel({ compatibility, style }: CompatibilityWheelProps) {
  return (
    <article style={{ ...surfaceStyle, display: "grid", gap: 12, padding: 16, ...style }}>
      <p style={labelStyle}>Compatibility wheel</p>
      <h3 style={{ fontSize: 20, lineHeight: 1.2, margin: 0 }}>{compatibility.shareTitle}</h3>
      <p style={mutedTextStyle}>{compatibility.shareDescription}</p>
      <VerifierRow label="Shared signs" value={compatibility.sharedSigns.join(", ") || "none"} />
      <VerifierRow label="Combined coverage" value={`${compatibility.combinedCoverage}%`} />
      <ZodiacWheel
        wheel={getZodiacWheelData({
          holdings: compatibility.combinedUniqueSigns.map((sign) => ({ sign, held: true }))
        })}
      />
    </article>
  );
}

function Composition({
  title,
  composition
}: {
  readonly title: string;
  readonly composition: Record<string, number>;
}) {
  return (
    <section style={{ ...surfaceStyle, padding: 16 }}>
      <p style={labelStyle}>{title}</p>
      {Object.entries(composition).map(([key, value]) => (
        <VerifierRow key={key} label={key} value={String(value)} />
      ))}
    </section>
  );
}

function VerifierRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
      <span style={labelStyle}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const badgeStyle: CSSProperties = {
  border: "1px solid #6f5a33",
  borderRadius: 999,
  color: "#f1d38a",
  display: "inline-flex",
  fontSize: 12,
  fontWeight: 650,
  padding: "5px 9px"
};

const quietBadgeStyle: CSSProperties = {
  ...badgeStyle,
  borderColor: "#3b3328",
  color: "#b9ab98"
};
