"use client";

import { useState } from "react";
import {
  ZodiacsValidationError,
  getZodiacsOwnership,
  getHeldZodiacs,
  getZodiacBalance,
  ZODIAC_SIGNS,
  type ZodiacsHolding,
  type ZodiacsOwnership,
  type ZodiacBalance,
  type ZodiacSign
} from "@zodiacs/sdk";
import {
  ZodiacsProvider,
  useZodiacMarket
} from "@zodiacs/sdk/react";
import {
  ZodiacAssetCard,
  ZodiacsPanel
} from "@zodiacs/sdk/ui";

interface ZodiacsDemoProps {
  readonly initialRpcUrl: string;
}

type LookupState =
  | { readonly status: "idle" }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly balance: ZodiacBalance;
      readonly ownership: ZodiacsOwnership;
      readonly held: readonly ZodiacsHolding[];
    }
  | { readonly status: "rpc-unavailable"; readonly message: string };

export function ZodiacsDemo({ initialRpcUrl }: ZodiacsDemoProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>("aries");
  const [state, setState] = useState<LookupState>({ status: "idle" });
  const rpcConfigured = initialRpcUrl.trim().length > 0;
  const selectedOwnerAddress = walletAddress.trim() || null;
  const providerProps = rpcConfigured ? { rpcUrl: initialRpcUrl } : {};

  async function runLookup() {
    const trimmedWallet = walletAddress.trim();

    if (!trimmedWallet) {
      setState({ status: "idle" });
      return;
    }

    if (!rpcConfigured) {
      setState({
        status: "rpc-unavailable",
        message: "Set NEXT_PUBLIC_SOLANA_RPC_URL to enable read-only Solana balance lookup."
      });
      return;
    }

    setState({ status: "loading" });

    try {
      const [balance, ownership, held] = await Promise.all([
        getZodiacBalance(initialRpcUrl, trimmedWallet, selectedSign),
        getZodiacsOwnership(initialRpcUrl, trimmedWallet),
        getHeldZodiacs(initialRpcUrl, trimmedWallet)
      ]);

      if (balance.status === "unavailable" || ownership.status === "unavailable") {
        setState({
          status: "rpc-unavailable",
          message: balance.error?.message ?? ownership.errors[0]?.message ?? "Solana RPC is unavailable."
        });
        return;
      }

      setState({ status: "ready", balance, ownership, held });
    } catch (error) {
      if (error instanceof ZodiacsValidationError) {
        setState({ status: "invalid", message: error.message });
        return;
      }

      setState({
        status: "rpc-unavailable",
        message: error instanceof Error ? error.message : "Solana RPC is unavailable."
      });
    }
  }

  return (
    <ZodiacsProvider {...providerProps}>
      <main style={styles.page}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>Zodiacs SDK Example</p>
          <h1 style={styles.title}>Twelve signs. Cultural assets for symbolic identity.</h1>
          <p style={styles.deck}>
            A minimal integration surface for metadata, wallet balance reads, ownership state, and optional market
            context.
          </p>
        </header>

        <section style={styles.lookupBand} aria-label="Read-only balance lookup">
          <label style={styles.field}>
            <span style={styles.label}>Wallet address</span>
            <input
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="Enter a Solana wallet public key"
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Zodiac asset</span>
            <select
              value={selectedSign}
              onChange={(event) => setSelectedSign(event.target.value as ZodiacSign)}
              style={styles.select}
            >
              {ZODIAC_SIGNS.map((sign) => (
                <option key={sign} value={sign}>
                  {sign}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={runLookup} style={styles.button}>
            Read balance
          </button>
        </section>

        <StatusPanel state={state} rpcConfigured={rpcConfigured} selectedSign={selectedSign} />

        <section style={styles.contentGrid}>
          <div style={styles.assetColumn}>
            <div style={styles.sectionHeader}>
              <p style={styles.eyebrow}>Selected asset</p>
              <h2 style={styles.sectionTitle}>Metadata and market context</h2>
            </div>
            <ZodiacAssetCard ownerAddress={selectedOwnerAddress} sign={selectedSign} showMarket />
            <MarketPlaceholder sign={selectedSign} />
          </div>

          <div style={styles.panelColumn}>
            <div style={styles.sectionHeader}>
              <p style={styles.eyebrow}>Zodiacs panel</p>
              <h2 style={styles.sectionTitle}>Twelve cultural assets</h2>
            </div>
            <ZodiacsPanel showMarket={false} />
          </div>
        </section>
      </main>
    </ZodiacsProvider>
  );
}

function StatusPanel({
  state,
  rpcConfigured,
  selectedSign
}: {
  readonly state: LookupState;
  readonly rpcConfigured: boolean;
  readonly selectedSign: ZodiacSign;
}) {
  if (!rpcConfigured) {
    return (
      <section style={styles.notice}>
        <p style={styles.label}>Configuration</p>
        <p style={styles.noticeText}>Set NEXT_PUBLIC_SOLANA_RPC_URL before running balance lookup.</p>
      </section>
    );
  }

  if (state.status === "idle") {
    return (
      <section style={styles.notice}>
        <p style={styles.label}>Awaiting wallet</p>
        <p style={styles.noticeText}>Enter a public wallet address to read zodiac token balances.</p>
      </section>
    );
  }

  if (state.status === "loading") {
    return (
      <section style={styles.notice}>
        <p style={styles.label}>Loading</p>
        <p style={styles.noticeText}>Reading Solana token accounts by owner and mint.</p>
      </section>
    );
  }

  if (state.status === "invalid") {
    return (
      <section style={styles.alert}>
        <p style={styles.label}>Invalid wallet</p>
        <p style={styles.noticeText}>{state.message}</p>
      </section>
    );
  }

  if (state.status === "rpc-unavailable") {
    return (
      <section style={styles.alert}>
        <p style={styles.label}>RPC unavailable</p>
        <p style={styles.noticeText}>{state.message}</p>
      </section>
    );
  }

  const selectedBalanceText =
    state.balance.status === "ok"
      ? `${state.balance.uiAmountString} ${state.balance.token.ticker}`
      : `0 ${state.balance.token.ticker}`;

  return (
    <section style={styles.resultGrid}>
      <Metric label={`${selectedSign} balance`} value={selectedBalanceText} />
      <Metric label="Held zodiac assets" value={String(state.ownership.totalHeld)} />
      <Metric label="Ownership state" value={state.held.length > 0 ? "Holdings found" : "No holdings"} />
      {state.held.length === 0 ? (
        <p style={styles.fullWidthText}>This wallet has no Zodiacs holdings in the current registry.</p>
      ) : (
        <p style={styles.fullWidthText}>
          Held signs: {state.held.map((holding) => holding.token.name).join(", ")}
        </p>
      )}
    </section>
  );
}

function MarketPlaceholder({ sign }: { readonly sign: ZodiacSign }) {
  const market = useZodiacMarket(sign);

  return (
    <section style={styles.notice}>
      <p style={styles.label}>Market context</p>
      <p style={styles.noticeText}>
        {market.data?.status === "unavailable"
          ? market.data.error?.message ?? "Market context is unavailable."
          : "Market context adapter is ready for configuration."}
      </p>
    </section>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div style={styles.metric}>
      <p style={styles.label}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(180deg, #07080c 0%, #0d1119 48%, #0b0a08 100%)",
    color: "#f3eadb",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    margin: 0,
    minHeight: "100vh",
    padding: "36px clamp(18px, 4vw, 48px)"
  },
  header: {
    margin: "0 auto 28px",
    maxWidth: 1080
  },
  eyebrow: {
    color: "#b8a16f",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0,
    margin: 0,
    textTransform: "uppercase"
  },
  title: {
    color: "#f6ecd7",
    fontFamily: "Georgia, 'Times New Roman', Times, serif",
    fontSize: 48,
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: 1.05,
    margin: "10px 0",
    maxWidth: 820
  },
  deck: {
    color: "#c8bda8",
    fontSize: 16,
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 720
  },
  lookupBand: {
    alignItems: "end",
    borderBottom: "1px solid #2d3442",
    borderTop: "1px solid #2d3442",
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    margin: "0 auto 18px",
    maxWidth: 1080,
    padding: "18px 0"
  },
  field: {
    display: "grid",
    gap: 8,
    minWidth: 0
  },
  label: {
    color: "#b8a16f",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0,
    margin: 0,
    textTransform: "uppercase"
  },
  input: {
    background: "#111824",
    border: "1px solid #354052",
    borderRadius: 6,
    color: "#f3eadb",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    minHeight: 42,
    minWidth: 0,
    padding: "0 12px"
  },
  select: {
    background: "#111824",
    border: "1px solid #354052",
    borderRadius: 6,
    color: "#f3eadb",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    minHeight: 44,
    padding: "0 12px",
    textTransform: "capitalize"
  },
  button: {
    background: "#c6a257",
    border: "1px solid #d4b36a",
    borderRadius: 6,
    color: "#101014",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 750,
    minHeight: 44,
    padding: "0 16px",
    textTransform: "uppercase"
  },
  notice: {
    background: "#10151f",
    border: "1px solid #303849",
    borderRadius: 8,
    margin: "0 auto 22px",
    maxWidth: 1080,
    padding: 16
  },
  alert: {
    background: "#1a1313",
    border: "1px solid #60423a",
    borderRadius: 8,
    margin: "0 auto 22px",
    maxWidth: 1080,
    padding: 16
  },
  noticeText: {
    color: "#d6c9b3",
    fontSize: 14,
    lineHeight: 1.5,
    margin: "6px 0 0"
  },
  resultGrid: {
    background: "#10151f",
    border: "1px solid #303849",
    borderRadius: 8,
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    margin: "0 auto 22px",
    maxWidth: 1080,
    padding: 16
  },
  metric: {
    minWidth: 0
  },
  metricValue: {
    color: "#f3eadb",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 22,
    fontWeight: 720,
    margin: "6px 0 0",
    overflowWrap: "anywhere"
  },
  fullWidthText: {
    color: "#d6c9b3",
    fontSize: 14,
    gridColumn: "1 / -1",
    lineHeight: 1.5,
    margin: 0
  },
  contentGrid: {
    display: "grid",
    gap: 18,
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    margin: "0 auto",
    maxWidth: 1080
  },
  assetColumn: {
    display: "grid",
    gap: 14
  },
  panelColumn: {
    display: "grid",
    gap: 14,
    minWidth: 0
  },
  sectionHeader: {
    display: "grid",
    gap: 4
  },
  sectionTitle: {
    color: "#f6ecd7",
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 1.25,
    margin: 0
  }
} as const;
