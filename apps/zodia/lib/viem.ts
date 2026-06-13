import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

let client: ReturnType<typeof buildClient> | null = null;

function buildClient() {
  return createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || "https://mainnet.base.org")
  });
}

export function serverPublicClient() {
  if (!client) {
    client = buildClient();
  }
  return client;
}
