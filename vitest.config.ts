import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: {
    alias: {
      "@zodiacs/sdk": new URL("./packages/sdk/src/index.ts", import.meta.url).pathname
    }
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "apps/**"]
  }
});
