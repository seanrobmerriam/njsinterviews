import { test, expect } from "@playwright/test";

test("accessing /assess/invalid-token-xyz shows an error message (not a 500)", async ({
  page,
}) => {
  const response = await page.goto("/assess/invalid-token-xyz");
  // Should not be a 500 server error
  expect(response?.status()).not.toBe(500);
  // Should show some error/not-found content, not crash
  await expect(page.locator("body")).toBeVisible();
  // Check it's not a blank/broken page — some text must be present
  const bodyText = await page.locator("body").innerText();
  expect(bodyText.trim().length).toBeGreaterThan(0);
});
