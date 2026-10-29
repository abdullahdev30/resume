import { test, expect } from "@playwright/test";
test("gallery and shared editor fit desktop and mobile", async ({
  page,
}, info) => {
  await page.goto("/templates");
  await expect(page.locator(".resume-workspace-template-card")).toHaveCount(11);
  await page.screenshot({
    path: info.outputPath("gallery.png"),
    fullPage: true,
  });
  await page.goto("/editor/1");
  await expect(
    page.getByRole("navigation", { name: "Document outline" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("editor.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 600, height: 850 });
  await expect(
    page.getByRole("tab", { name: "Preview", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Live resume preview" }),
  ).toBeVisible();
});
