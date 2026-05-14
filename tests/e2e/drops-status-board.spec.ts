import { test, expect } from "@playwright/test";

test.describe("Drop Status Board", () => {
  test("renders all mock drops as table rows", async ({ page }) => {
    await page.goto("/drops/board");
    // Five mock drops: 5.1.26, 5.8.26, 5.15.26, 5.22.26, 5.29.26
    const rows = page.locator("[data-tag]");
    await expect(rows).toHaveCount(5);
  });

  test("each row has the correct data-tag attribute", async ({ page }) => {
    await page.goto("/drops/board");
    for (const tag of ["5.1.26", "5.8.26", "5.15.26", "5.22.26", "5.29.26"]) {
      await expect(page.locator(`[data-tag="${tag}"]`)).toBeVisible();
    }
  });

  test("alert strip is visible", async ({ page }) => {
    await page.goto("/drops/board");
    await expect(page.getByTestId("alert-strip")).toBeVisible();
  });

  test("urgent alerts appear before warn alerts in the strip", async ({
    page,
  }) => {
    await page.goto("/drops/board");
    const alerts = page.getByTestId("alert-strip").locator("[data-level]");
    const count = await alerts.count();
    if (count < 2) return; // not enough alerts to verify ordering

    const levels: string[] = [];
    for (let i = 0; i < count; i++) {
      levels.push((await alerts.nth(i).getAttribute("data-level")) ?? "");
    }

    // All urgents must appear before any warns/infos
    let seenNonUrgent = false;
    for (const level of levels) {
      if (level !== "urgent") seenNonUrgent = true;
      if (seenNonUrgent && level === "urgent") {
        throw new Error(`Urgent alert found after a ${level} alert`);
      }
    }
  });

  test("pricing cells link to the pricing tab", async ({ page }) => {
    await page.goto("/drops/board");
    // Click the first Pricing link in the table
    await page.getByRole("link", { name: "Pricing" }).first().click();
    await expect(page).toHaveURL(/\/pricing$/);
  });

  test("copy cells link to the copy tab", async ({ page }) => {
    await page.goto("/drops/board");
    await page.getByRole("link", { name: "Copy" }).first().click();
    await expect(page).toHaveURL(/\/copy$/);
  });
});
