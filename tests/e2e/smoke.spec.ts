import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("redirects unauth'd traffic to /login", async ({ page }) => {
    const response = await page.goto("/invoices");
    // After redirect, we should be at /login
    await expect(page).toHaveURL(/\/login$/);
    // Response from the final navigation should be 200
    expect(response?.status()).toBe(200);
  });

  test("login page renders the magic link form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
  });
});
