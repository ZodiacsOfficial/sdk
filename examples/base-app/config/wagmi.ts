import { Attribution } from "ox/erc8021";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import type { Config } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";

const appName = process.env.NEXT_PUBLIC_BASE_APP_NAME?.trim() || "Zodiacs Base Read-Only Example";
const builderCode = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE?.trim();
const dataSuffix = builderCode ? Attribution.toDataSuffix({ codes: [builderCode] }) : undefined;

export const config: Config = createConfig({
  chains: [base, baseSepolia],
  connectors: [baseAccount({ appName })],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
    )
  },
  ...(dataSuffix ? { dataSuffix } : {})
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
