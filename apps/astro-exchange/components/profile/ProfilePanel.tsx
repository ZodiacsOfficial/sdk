"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import { useState } from "react";
import { useAccount, useConnect, usePublicClient } from "wagmi";
import { base } from "wagmi/chains";
import { getCurrentZodiacSeason } from "@zodiacs/sdk/core";
import { useBaseZodiacsOwnership } from "@zodiacs/sdk/react";
import { IdentityReceiptCard, ZodiacShelf } from "@zodiacs/sdk/ui";
import { SIGN_GLYPHS } from "../../lib/zodiac";
import { ShareButton } from "../ShareButton";

export function ProfilePanel() {
  const { context } = useMiniKit();
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const publicClient = usePublicClient({ chainId: base.id });
  const ownership = useBaseZodiacsOwnership(publicClient, address ?? null, {
    onPartialFailure: "warn"
  });
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const user = context?.user;
  const season = getCurrentZodiacSeason();
  const ownershipData = ownership.data ?? { holdings: [] };

  async function saveApp() {
    try {
      await sdk.actions.addMiniApp();
      setSaveNotice("Saved. Daily sky notifications can now reach you.");
    } catch {
      setSaveNotice("Saving works inside a mini app host like Base App.");
    }
  }

  return (
    <>
      <section className="card row spread">
        <div className="row">
          {user?.pfpUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar" src={user.pfpUrl} alt="" style={{ width: 38, height: 38 }} />
          ) : (
            <span className="glyph">👤</span>
          )}
          <div>
            <div style={{ fontWeight: 600 }}>{user?.username ?? "Stargazer"}</div>
            <div className="muted">
              {SIGN_GLYPHS[season.sign]} {season.sign} season
            </div>
          </div>
        </div>
        <button className="ghost" onClick={() => void saveApp()}>
          Save app
        </button>
      </section>
      {saveNotice ? <p className="muted">{saveNotice}</p> : null}

      {!address ? (
        <section className="card">
          <p className="muted">Connect to see your verified zodiac holdings.</p>
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
        </section>
      ) : (
        <>
          {ownership.loading ? <p className="muted">Reading your shelf…</p> : null}
          <ZodiacShelf ownership={ownershipData} />
          <IdentityReceiptCard ownership={ownershipData} />
          <div className="row">
            <ShareButton
              label="Share my shelf"
              text="My verified zodiac shelf on Zodiacs Astro Exchange ✦"
              embedPath="/profile"
            />
          </div>
        </>
      )}

      <p className="disclaimer">
        Holdings are public on-chain reads of the official Zodiacs.org registry representations.
        Symbolic context only.
      </p>
    </>
  );
}
