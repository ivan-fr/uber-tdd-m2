import { test, expect } from "@playwright/test";

test.describe("Coupon application - Single coupon only", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("should apply a single coupon code", async ({ page }) => {
		// Trouver le champ de saisie du code promo
		const couponInput = page.getByPlaceholder("Code promo");
		await expect(couponInput).toBeVisible();

		// Entrer un code promo valide
		await couponInput.fill("DISCOUNTPERCENT10");

		// Cliquer sur le bouton d'ajout
		const addButton = page.getByRole("button", {
			name: /ajouter un coupon/i,
		});
		await addButton.click();

		// Vérifier que le coupon appliqué est affiché
		await expect(page.getByText("Coupon appliqué")).toBeVisible();
		await expect(page.getByText("DISCOUNTPERCENT10")).toBeVisible();
	});

	test("should disable coupon input when a coupon is already applied", async ({
		page,
	}) => {
		const couponInput = page.getByPlaceholder("Code promo");

		// Appliquer un premier coupon
		await couponInput.fill("DISCOUNTPERCENT10");
		await page.getByRole("button", { name: /ajouter un coupon/i }).click();

		// Vérifier que le champ est désactivé
		await expect(couponInput).toBeDisabled();

		// Vérifier que le bouton d'ajout est désactivé
		const addButton = page.getByRole("button", {
			name: /ajouter un coupon/i,
		});
		await expect(addButton).toBeDisabled();
	});

	test("should not allow adding a second coupon", async ({ page }) => {
		const couponInput = page.getByPlaceholder("Code promo");

		// Appliquer un premier coupon
		await couponInput.fill("DISCOUNTPERCENT10");
		await page.getByRole("button", { name: /ajouter un coupon/i }).click();

		// Vérifier qu'un seul coupon est affiché
		const appliedCoupons = page.getByText(/DISCOUNT/);
		await expect(appliedCoupons).toHaveCount(1);
	});

	test("should remove applied coupon when clicking on it", async ({ page }) => {
		const couponInput = page.getByPlaceholder("Code promo");

		// Appliquer un coupon
		await couponInput.fill("DISCOUNTPERCENT10");
		await page.getByRole("button", { name: /ajouter un coupon/i }).click();

		// Vérifier que le coupon est appliqué
		await expect(page.getByText("Coupon appliqué")).toBeVisible();

		// Cliquer sur le badge du coupon pour le supprimer
		const couponBadge = page.getByText("DISCOUNTPERCENT10 ✕");
		await couponBadge.click();

		// Vérifier que le coupon a été supprimé
		await expect(page.getByText("Coupon appliqué")).not.toBeVisible();

		// Vérifier que le champ est réactivé
		await expect(couponInput).toBeEnabled();
	});

	test("should show coupon suggestions on input", async ({ page }) => {
		const couponInput = page.getByPlaceholder("Code promo");

		// Commencer à taper un code promo
		await couponInput.fill("BLACK");

		// Vérifier que les suggestions apparaissent
		await expect(page.getByText("BLACKFRIDAY")).toBeVisible();
	});

	test("should apply coupon from suggestions", async ({ page }) => {
		const couponInput = page.getByPlaceholder("Code promo");

		// Taper pour afficher les suggestions
		await couponInput.fill("DISCOUNT");

		// Attendre que les suggestions apparaissent
		await page.waitForTimeout(300);

		// Cliquer sur une suggestion
		const suggestion = page
			.locator("div")
			.filter({ hasText: /^DISCOUNTPERCENT10$/ })
			.first();
		await suggestion.click();

		// Vérifier que le coupon est appliqué
		await expect(page.getByText("Coupon appliqué")).toBeVisible();
		await expect(
			page.getByText("DISCOUNTPERCENT10").first()
		).toBeVisible();
	});

	test("should calculate correct price with 10% discount", async ({
		page,
	}) => {
		// Le sous-total initial est 80€
		// Avec une réduction de 10%, le total devrait être 72€

		const couponInput = page.getByPlaceholder("Code promo");
		await couponInput.fill("DISCOUNTPERCENT10");
		await page.getByRole("button", { name: /ajouter un coupon/i }).click();

		// Attendre que le calcul soit effectué
		await page.waitForTimeout(500);

		// Vérifier le montant final
		const finalAmount = page
			.locator("div")
			.filter({ hasText: /^Montant final/ })
			.locator("span.font-bold");

		await expect(finalAmount).toContainText("72.00 €");
	});

	test("should allow applying different coupon after removing first one", async ({
		page,
	}) => {
		const couponInput = page.getByPlaceholder("Code promo");

		// Appliquer un premier coupon
		await couponInput.fill("DISCOUNTPERCENT10");
		await page.getByRole("button", { name: /ajouter un coupon/i }).click();
		await expect(page.getByText("DISCOUNTPERCENT10")).toBeVisible();

		// Supprimer le coupon
		await page.getByText("DISCOUNTPERCENT10 ✕").click();

		// Appliquer un deuxième coupon différent
		await couponInput.fill("DISCOUNTEURO10");
		await page.getByRole("button", { name: /ajouter un coupon/i }).click();

		// Vérifier que c'est bien le nouveau coupon qui est appliqué
		await expect(page.getByText("DISCOUNTEURO10")).toBeVisible();
		await expect(page.getByText("DISCOUNTPERCENT10")).not.toBeVisible();
	});

	test("should handle keyboard navigation in coupon suggestions", async ({
		page,
	}) => {
		const couponInput = page.getByPlaceholder("Code promo");

		// Taper pour afficher les suggestions
		await couponInput.fill("DISCOUNT");

		// Attendre que les suggestions apparaissent
		await page.waitForTimeout(300);

		// Naviguer avec les flèches
		await couponInput.press("ArrowDown");
		await couponInput.press("Enter");

		// Vérifier qu'un coupon a été appliqué
		await expect(page.getByText("Coupon appliqué")).toBeVisible();
	});
});
