"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { getZodiacToken } from "@zodiacs/sdk/core";
import { authedJson } from "../../lib/clientApi";
import {
  SIGN_GLYPHS,
  USDC_CAIP19,
  USDC_DECIMALS,
  baseDecimalsForSign,
  caip19ForSign
} from "../../lib/zodiac";
import type { ZodiacSign } from "../../lib/zodiac";
import { ShareButton } from "../ShareButton";
import { SignIcon } from "../SignIcon";

const USDC_PRESETS = [5, 20, 50] as const;

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "done"; credited: boolean }
  | { kind: "failed"; message: string };

export function SwapSheet({
  sign,
  priceUsd,
  onClose
}: {
  sign: ZodiacSign;
  priceUsd: number | null;
  onClose: () => void;
}) {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { context } = useMiniKit();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [usdcAmount, setUsdcAmount] = useState<number>(20);
  const [sellAmount, setSellAmount] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const dexScreenerUrl = getZodiacToken(sign).marketLinks?.dexScreener;

  async function recordTrade(transactions: readonly string[]) {
    if (!address) {
      return false;
    }
    try {
      const user = context?.user;
      await authedJson("/api/trades", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: address,
          txHashes: transactions,
          ...(user?.username ? { username: user.username } : {}),
          ...(user?.pfpUrl ? { pfpUrl: user.pfpUrl } : {})
        })
      });
      return true;
    } catch {
      return false;
    }
  }

  async function swap() {
    setStatus({ kind: "pending" });
    const zodiacToken = caip19ForSign(sign);
    const options =
      mode === "buy"
        ? {
            sellToken: USDC_CAIP19,
            buyToken: zodiacToken,
            sellAmount: BigInt(Math.round(usdcAmount * 10 ** USDC_DECIMALS)).toString()
          }
        : {
            sellToken: zodiacToken,
            buyToken: USDC_CAIP19,
            ...(sellAmount.trim()
              ? {
                  sellAmount: BigInt(
                    Math.round(Number(sellAmount) * 10 ** baseDecimalsForSign(sign))
                  ).toString()
                }
              : {})
          };

    try {
      const result = await sdk.actions.swapToken(options);
      if (result.success) {
        try {
          await sdk.haptics.notificationOccurred("success");
        } catch {
          // haptics unsupported outside mini app hosts
        }
        const credited = await recordTrade(result.swap.transactions);
        setStatus({ kind: "done", credited });
      } else if (result.reason === "rejected_by_user") {
        setStatus({ kind: "idle" });
      } else {
        setStatus({
          kind: "failed",
          message: "This sign may not be routable right now. Liquidity for the twelve varies."
        });
      }
    } catch {
      setStatus({
        kind: "failed",
        message: "Swapping is only available inside a mini app host like Base App."
      });
    }
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="row spread">
          <div className="row">
            <SignIcon sign={sign} size={40} />
            <h2 style={{ margin: 0, textTransform: "capitalize" }}>{sign}</h2>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="chips">
          <button className="chip" data-active={mode === "buy"} onClick={() => setMode("buy")}>
            Buy with USDC
          </button>
          <button className="chip" data-active={mode === "sell"} onClick={() => setMode("sell")}>
            Sell for USDC
          </button>
        </div>

        {mode === "buy" ? (
          <div className="chips">
            {USDC_PRESETS.map((preset) => (
              <button
                key={preset}
                className="chip"
                data-active={usdcAmount === preset}
                onClick={() => setUsdcAmount(preset)}
              >
                {preset} USDC
              </button>
            ))}
          </div>
        ) : (
          <input
            className="field"
            inputMode="decimal"
            placeholder={`Amount of ${sign.toUpperCase()} (blank = choose in wallet)`}
            value={sellAmount}
            onChange={(event) => setSellAmount(event.target.value)}
          />
        )}

        {priceUsd !== null ? (
          <p className="muted">
            Last price ${priceUsd >= 1 ? priceUsd.toFixed(2) : priceUsd.toPrecision(3)}
          </p>
        ) : null}

        {!address ? (
          <button
            className="primary"
            onClick={() => {
              const connector = connectors[0];
              if (connector) {
                connect({ connector });
              }
            }}
          >
            Connect wallet
          </button>
        ) : (
          <button
            className="primary"
            disabled={status.kind === "pending"}
            onClick={() => void swap()}
          >
            {status.kind === "pending" ? "Opening wallet…" : "Review in wallet"}
          </button>
        )}

        {status.kind === "done" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <p className="muted">
              Swap submitted.{" "}
              {status.credited
                ? "It will count on the leaderboard once confirmed."
                : "Leaderboard credit unavailable right now."}
            </p>
            <ShareButton
              label="Brag in the feed"
              text={`Just made a move on ${SIGN_GLYPHS[sign]} ${sign} on Zodia. The stars were merely consulted, not blamed.`}
              embedPath="/exchange"
            />
          </div>
        ) : null}

        {status.kind === "failed" ? (
          <p className="muted">
            {status.message}{" "}
            {dexScreenerUrl ? (
              <a href={dexScreenerUrl} target="_blank" rel="noreferrer">
                View market context
              </a>
            ) : null}
          </p>
        ) : null}

        <p className="disclaimer" style={{ textAlign: "center" }}>
          Swaps execute in your wallet · only in-app swaps count on the board · not investment
          advice
        </p>
      </div>
    </>
  );
}
