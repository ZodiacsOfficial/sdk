"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { TabBar } from "../../components/TabBar";

export default function TabsLayout({ children }: { children: ReactNode }) {
  const { isMiniAppReady, setMiniAppReady } = useMiniKit();

  useEffect(() => {
    if (!isMiniAppReady) {
      void setMiniAppReady();
    }
  }, [isMiniAppReady, setMiniAppReady]);

  return (
    <>
      <main className="tab-content">{children}</main>
      <TabBar />
    </>
  );
}
