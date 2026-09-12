import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@zodiacs/engine/internal/math": fileURLToPath(
        new URL("./packages/engine/src/internal-math.ts", import.meta.url)
      ),
      "@zodiacs/engine/internal": fileURLToPath(
        new URL("./packages/engine/src/internal.ts", import.meta.url)
      ),
      "@zodiacs/engine/geo": fileURLToPath(
        new URL("./packages/engine/src/geo.ts", import.meta.url)
      ),
      "@zodiacs/engine": fileURLToPath(new URL("./packages/engine/src/index.ts", import.meta.url)),
      "@zodiacs/widgets": fileURLToPath(
        new URL("./packages/widgets/src/index.ts", import.meta.url)
      ),
      "@zodiacs/sdk": fileURLToPath(new URL("./packages/sdk/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "apps/**"]
  }
});
