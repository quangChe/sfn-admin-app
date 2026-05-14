import { test, expect } from "@playwright/test";

test.describe("Pricing tab", () => {
  test("renders products from mock data", async ({ page }) => {
    await page.goto("/drops/5.15.26/pricing");
    // Mock products include Louis Vuitton, Chanel, Gucci, Prada
    await expect(page.getByText(/Louis Vuitton/i)).toBeVisible();
    await expect(page.getByText(/Chanel/i)).toBeVisible();
  });

  test("shows the save bar in a disabled state initially", async ({ page }) => {
    await page.goto("/drops/5.15.26/pricing");
    const saveBtn = page.getByRole("button", { name: /save all changes/i });
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeDisabled();
  });

  test("save bar activates when a sell price is changed", async ({ page }) => {
    await page.goto("/drops/5.15.26/pricing");

    // Fill the first sell-price input (the one after cost which is read-only)
    const sellPriceInputs = page.locator('input[type="number"]');
    await sellPriceInputs.first().fill("999");

    // Save bar should now show a dirty count and be enabled
    await expect(page.getByText(/unsaved changes/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /save all changes/i })
    ).toBeEnabled();
  });

  test("discard button clears dirty state", async ({ page }) => {
    await page.goto("/drops/5.15.26/pricing");

    const sellPriceInputs = page.locator('input[type="number"]');
    await sellPriceInputs.first().fill("999");
    await expect(page.getByText(/unsaved changes/i)).toBeVisible();

    await page.getByRole("button", { name: /discard/i }).click();

    // After discard the save bar returns to its empty/disabled state
    await expect(page.getByText(/unsaved changes/i)).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /save all changes/i })
    ).toBeDisabled();
  });

  test("margin column is visible for priced products", async ({ page }) => {
    await page.goto("/drops/5.15.26/pricing");
    // Gucci product has price 650 and cost 380 — margin should show
    await expect(page.getByText(/margin/i)).toBeVisible();
  });
});
