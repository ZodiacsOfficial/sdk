"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useState } from "react";
import { appUrl } from "../minikit.config";

export function ShareButton({
  text,
  embedPath,
  label = "Share"
}: {
  text: string;
  embedPath?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function share() {
    setBusy(true);
    try {
      await sdk.actions.composeCast({
        text,
        ...(embedPath ? { embeds: [`${appUrl}${embedPath}`] as [string] } : {})
      });
    } catch {
      // Outside a mini app host there is nothing to share into.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="ghost" onClick={() => void share()} disabled={busy}>
      {label}
    </button>
  );
}
