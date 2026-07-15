import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
  test: {
    include: [
      "**/*.unit.test.ts",
      "**/*.unit.test.tsx",
      "**/*.integration.test.ts",
      "**/*.integration.test.tsx",
      "**/*.service.test.ts",
      "**/*.service.test.tsx",
    ],
  },
});
