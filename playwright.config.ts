import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.local for Clerk credentials and other env vars
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  globalSetup: "./e2e/global.setup.ts",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120000,
      },
});
