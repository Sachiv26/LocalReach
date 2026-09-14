import { defineConfig } from "vitest/config";
import path from "node:path";
import "dotenv/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://postgres:admin@localhost:5432/localreach_test?schema=public",
      DIRECT_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://postgres:admin@localhost:5432/localreach_test?schema=public",
      AUTH_SECRET: "test-secret",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_FROM: "LocalReach <no-reply@test.local>",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
