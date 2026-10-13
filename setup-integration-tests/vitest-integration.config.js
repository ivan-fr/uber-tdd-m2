import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    root: path.resolve(__dirname, ".."),

    include: ["**/*.it-spec.ts"],
    environment: "node",

    coverage: {
      include: ["**/*.ts"],
      exclude: ["**/*.it-spec.ts"],
    },

    alias: {
      "@": path.resolve(__dirname, ".."),
    },
  },
});
