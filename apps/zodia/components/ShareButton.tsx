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
      const embedUrl = embedPath ? `${appUrl}${embedPath}` : null;
      if (await sdk.isInMiniApp()) {
        await sdk.actions.composeCast({
          text,
          ...(embedUrl ? { embeds: [embedUrl] as [string] } : {})
        });
      } else {
        const url = new URL("https://warpcast.com/~/compose");
        url.searchParams.set("text", text);
        if (embedUrl) {
          url.searchParams.append("embeds[]", embedUrl);
        }
        window.open(url.toString(), "_blank", "noopener,noreferrer");
      }
    } catch {
      // Sharing is optional social distribution.
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
