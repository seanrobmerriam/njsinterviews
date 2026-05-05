import { test, expect } from "@playwright/test";

test("accessing /problems without auth redirects to /sign-in", async ({ page }) => {
  await page.goto("/problems");
  await expect(page).toHaveURL(/sign-in/);
});

test("accessing /problems/two-sum without auth redirects to /sign-in", async ({ page }) => {
  await page.goto("/problems/two-sum");
  await expect(page).toHaveURL(/sign-in/);
});
