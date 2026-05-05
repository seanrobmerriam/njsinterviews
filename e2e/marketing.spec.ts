import { test, expect } from "@playwright/test";

test("landing page loads with heading", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CodeGauntlet/i);
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
});

test("pricing page loads with Pricing heading and plan names", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: /pricing/i })).toBeVisible();
  await expect(page.getByText(/free/i)).toBeVisible();
  await expect(page.getByText(/pro/i)).toBeVisible();
  await expect(page.getByText(/business/i)).toBeVisible();
});

test("health check returns ok", async ({ page }) => {
  const response = await page.goto("/api/health");
  expect(response?.status()).toBe(200);
  const body = await response?.json();
  expect(body).toMatchObject({ ok: true });
});
