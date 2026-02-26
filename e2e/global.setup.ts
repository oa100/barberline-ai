import { clerkSetup } from "@clerk/testing/playwright";
import { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // clerkSetup() needs CLERK_PUBLISHABLE_KEY; Next.js uses NEXT_PUBLIC_ prefix
  if (
    !process.env.CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    process.env.CLERK_PUBLISHABLE_KEY =
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
  await clerkSetup();
}

export default globalSetup;
