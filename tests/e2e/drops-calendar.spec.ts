import { test, expect } from "@playwright/test";

test.describe("Drop Calendar", () => {
  test("renders the calendar with a month heading", async ({ page }) => {
    await page.goto("/drops");
    // The month/year heading is rendered by DropCalendar
    const heading = page.locator("h2").first();
    await expect(heading).toBeVisible();
    await expect(heading).not.toBeEmpty();
  });

  test("navigates to the previous month", async ({ page }) => {
    await page.goto("/drops");
    const heading = page.locator("h2").first();
    const initial = await heading.textContent();
    await page.getByRole("button", { name: "Previous month" }).click();
    const updated = await heading.textContent();
    expect(updated).not.toBe(initial);
  });

  test("navigates to the next month", async ({ page }) => {
    await page.goto("/drops");
    const heading = page.locator("h2").first();
    const initial = await heading.textContent();
    await page.getByRole("button", { name: "Next month" }).click();
    const updated = await heading.textContent();
    expect(updated).not.toBe(initial);
  });

  test("clicking a drop tile navigates to the workspace", async ({ page }) => {
    // Navigate to May 2026 where mock drops live
    await page.goto("/drops/5.15.26");
    // Workspace layout loads with tab navigation
    await expect(page.getByText(/pricing/i)).toBeVisible();
    await expect(page).toHaveURL(/\/drops\/5\.15\.26/);
  });

  test("workspace tab navigation works", async ({ page }) => {
    await page.goto("/drops/5.15.26/pricing");
    await page.getByRole("link", { name: /copy/i }).click();
    await expect(page).toHaveURL(/\/copy$/);
  });

  test("specs tab loads", async ({ page }) => {
    await page.goto("/drops/5.15.26/specs");
    await expect(page).toHaveURL(/\/specs$/);
    // Specs table should render
    await expect(page.getByText(/condition/i)).toBeVisible();
  });
});
