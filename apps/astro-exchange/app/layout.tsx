import type { Metadata } from "next";
import type { ReactNode } from "react";
import { appConfig, appUrl } from "../minikit.config";
import { Providers } from "./providers";
import "./globals.css";

const miniAppEmbed = {
  version: "1",
  imageUrl: appConfig.heroImageUrl,
  button: {
    title: "Open Astro Exchange",
    action: {
      type: "launch_miniapp",
      name: appConfig.name,
      url: appUrl,
      splashImageUrl: appConfig.splashImageUrl,
      splashBackgroundColor: appConfig.splashBackgroundColor
    }
  }
};

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed)
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="cosmos" aria-hidden />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
