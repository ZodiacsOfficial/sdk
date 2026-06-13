import { defineConfig } from "vitest/config";

const sdkSrc = (entry: string) =>
  new URL(`../../packages/sdk/src/${entry}`, import.meta.url).pathname;

export default defineConfig({
  resolve: {
    alias: [
      { find: "@zodiacs/sdk/core", replacement: sdkSrc("core.ts") },
      { find: "@zodiacs/sdk/market", replacement: sdkSrc("market.ts") },
      { find: "@zodiacs/sdk", replacement: sdkSrc("index.ts") }
    ]
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"]
  }
});
