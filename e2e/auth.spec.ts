import { test, expect } from "@playwright/test";

test("sign-in page loads without error", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page).not.toHaveTitle(/error/i);
  await expect(page.locator("body")).toBeVisible();
});

test("sign-up page loads without error", async ({ page }) => {
  await page.goto("/sign-up");
  await expect(page).not.toHaveTitle(/error/i);
  await expect(page.locator("body")).toBeVisible();
});

test("accessing /dashboard without auth redirects to /sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/sign-in/);
});

test("accessing /portal/dashboard without auth redirects to /sign-in", async ({ page }) => {
  await page.goto("/portal/dashboard");
  await expect(page).toHaveURL(/sign-in/);
});
