import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";

loadEnv();

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": new URL("./src/", import.meta.url).pathname },
  },
});
