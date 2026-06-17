import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import type { ReactNode } from "react";
import { appConfig, appUrl } from "../minikit.config";
import { Providers } from "./providers";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display"
});

const miniAppEmbed = {
  version: "1",
  imageUrl: appConfig.heroImageUrl,
  button: {
    title: "Open Zodia",
    action: {
      type: "launch_miniapp",
      name: appConfig.name,
      url: appUrl,
      splashImageUrl: appConfig.splashImageUrl,
      splashBackgroundColor: appConfig.splashBackgroundColor
    }
  }
};

const baseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: appConfig.name,
  description: appConfig.description,
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed),
    ...(baseAppId ? { "base:app_id": baseAppId } : {})
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body>
        <div className="cosmos" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
