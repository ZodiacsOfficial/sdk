"use client";

import {
  IdentityReceiptCard,
  ProfileSummaryCard,
  ShareCardPreview,
  ZodiacShelf,
  ZodiacWheel
} from "@zodiacs/sdk/ui";
import {
  useBaseZodiacsOwnership,
  useIdentityReceiptData,
  useZodiacIdentityContext,
  useZodiacWheelData
} from "@zodiacs/sdk/react";
import { base } from "wagmi/chains";
import { useAccount, useConnect, useDisconnect, usePublicClient } from "wagmi";

export function ReadOnlyBaseProfile() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient({ chainId: base.id });
  const ownership = useBaseZodiacsOwnership(publicClient, address, {
    blockTag: "safe",
    includeZeroBalances: true,
    onPartialFailure: "warn"
  });
  const ownershipData = ownership.data ?? { holdings: [] };
  const identity = useZodiacIdentityContext(ownershipData);
  const wheel = useZodiacWheelData(ownershipData);
  const receipt = useIdentityReceiptData(ownershipData, {
    label: "Base read-only profile"
  });

  return (
    <main className="app-shell">
      <section className="profile-hero" aria-label="Base Read-Only Profile">
        <div className="hero-copy">
          <h1>Base Read-Only Profile</h1>
          <p>
            A read-only Base App surface for official Zodiacs holdings, provenance labels, wheel
            coverage, and share-ready identity facts.
          </p>
        </div>
        <div className="connect-panel" aria-live="polite">
          {isConnected && address ? (
            <>
              <span className="label">Connected Base address</span>
              <strong>{shortAddress(address)}</strong>
              <button type="button" onClick={() => disconnect()}>
                Disconnect
              </button>
            </>
          ) : (
            <>
              <span className="label">
                {isReconnecting ? "Restoring session" : "Connect wallet"}
              </span>
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  type="button"
                  disabled={isConnecting || isPending}
                  onClick={() => connect({ connector })}
                >
                  {isConnecting || isPending ? "Connecting" : `Connect ${connector.name}`}
                </button>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="status-strip" aria-label="Read status">
        <StatusMetric label="Read target" value="Base mainnet official bridged ERC-20s" />
        <StatusMetric
          label="Read mode"
          value={ownership.loading ? "Loading" : ownership.error ? "Partial" : "Read-only"}
        />
        <StatusMetric label="Wheel coverage" value={`${identity.wheelCoverage}%`} />
      </section>

      <section className="profile-grid">
        <div className="stack">
          <ProfileSummaryCard context={identity} />
          <ZodiacShelf wheel={wheel} />
          <IdentityReceiptCard receipt={receipt} />
        </div>
        <div className="stack">
          <div className="panel">
            <p className="label">Wheel coverage</p>
            <ZodiacWheel wheel={wheel} />
          </div>
          <ShareCardPreview context={identity} />
        </div>
      </section>

      <section className="provenance-note">
        <h2>Provenance</h2>
        <p>
          The SDK verifies official Base-bridged Zodiacs representations against their Solana-native
          origin mints. This example keeps wallet use read-only and limits itself to public
          ownership lookup.
        </p>
      </section>
    </main>
  );
}

function StatusMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
