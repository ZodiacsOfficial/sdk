import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { Attribution } from "ox/erc8021";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import type { Config } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

const appName = "Zodia";
const builderCode = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE?.trim();
const dataSuffix = builderCode ? Attribution.toDataSuffix({ codes: [builderCode] }) : undefined;

export const config: Config = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp(), baseAccount({ appName })],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org")
  },
  ...(dataSuffix ? { dataSuffix } : {})
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
