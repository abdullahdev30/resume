import { test, expect } from "@playwright/test";
test("original home, typography, gallery and editor remain the default flow", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Build Your Resume for Free",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".landing-hero")).toBeVisible();
  await expect(page.locator(".resume-maker-app")).toHaveCount(0);
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase()),
  ).toContain("arial");
  expect(
    await page
      .locator(".landing-hero h1")
      .evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase()),
  ).toContain("georgia");
  await page.screenshot({
    path: info.outputPath("restored-home.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Create Resume", exact: true }).click();
  await expect(page).toHaveURL(/\/templates$/);
  await expect(page.locator(".resume-workspace-template-card")).toHaveCount(11);
  await page
    .getByRole("button", { name: "Use this template", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/editor\/1$/);
  await expect(
    page.locator(".resume-workspace-editor-full-toolbar"),
  ).toBeVisible();
  await expect(
    page.locator(".resume-workspace-document-outline"),
  ).toBeVisible();
});
