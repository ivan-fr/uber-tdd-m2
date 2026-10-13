import { test, expect } from "@playwright/test";

test.describe("Basket functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display initial basket with products", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Total" })).toBeVisible();

    await expect(page.getByText("Sous-total")).toBeVisible();

    await expect(page.getByText("Microphone")).toBeVisible();
    await expect(page.getByText("Cadre")).toBeVisible();
    await expect(page.getByText("Voiture")).toBeVisible();
  });

  test("should calculate subtotal correctly", async ({ page }) => {
    const subtotalText = await page
      .locator("div")
      .filter({ hasText: /^Sous-total/ })
      .locator("span.font-bold")
      .textContent();

    expect(subtotalText).toContain("80.00 €");
  });

  test("should display final amount without coupon", async ({ page }) => {
    const finalAmountText = await page
      .locator("div")
      .filter({ hasText: /^Montant final/ })
      .locator("span.font-bold")
      .textContent();

    expect(finalAmountText).toContain("80.00 €");
  });

  test("should remove product from basket", async ({ page }) => {
    const removeButtons = page.getByRole("button", { name: /remove/i });
    const firstRemoveButton = removeButtons.first();

    await firstRemoveButton.click();

    const products = page.locator('[data-testid="basket-item"]');
    await expect(products).toHaveCount(2);
  });
});
