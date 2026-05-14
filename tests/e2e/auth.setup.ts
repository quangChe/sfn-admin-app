import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars before running E2E tests"
    );
  }

  // Navigate to the login page — NextAuth redirects here when unauthenticated
  await page.goto("/login");

  // Click the Google sign-in button (NextAuth Google OAuth)
  await page.getByRole("button", { name: /sign in with google/i }).click();

  // Fill in Google OAuth credentials
  await page.getByLabel("Email or phone").fill(email);
  await page.getByRole("button", { name: /next/i }).click();

  await page.getByLabel("Enter your password").fill(password);
  await page.getByRole("button", { name: /next/i }).click();

  // Wait until we're redirected back to the app (past the login page)
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });

  // Verify we're authenticated
  await expect(page).not.toHaveURL(/\/login/);

  // Save the storage state (cookies + localStorage) for subsequent tests
  await page.context().storageState({ path: authFile });
});
