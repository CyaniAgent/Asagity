import { test, expect } from "@playwright/test";

test.describe("Welcome Page", () => {
  test("loads and displays instance name", async ({ page }) => {
    await page.goto("/");
    // Welcome page should render
    await expect(page.locator("text=Asagity")).toBeVisible();
  });

  test("shows login button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /login|登录/i })).toBeVisible();
  });

  test("shows direct enter button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /direct|直接/i })).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("can navigate to about page", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL(/\/about/);
  });

  test("can navigate to settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
  });
});

test.describe("Accessibility", () => {
  test("welcome page has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForTimeout(2000);
    // Filter out known non-critical errors (e.g., favicon, API connection)
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("Failed to fetch") && !e.includes("WebSocket")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
