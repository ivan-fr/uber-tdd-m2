import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.it-spec.ts"],
    hookTimeout: 180000,
    testTimeout: 10000,
  },
});
