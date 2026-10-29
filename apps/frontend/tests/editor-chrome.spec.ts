import { test, expect } from "@playwright/test";
test("shared editor page controls persist custom dimensions and individual margins", async ({
  page,
}) => {
  await page.goto("/editor/2");
  await page.locator(".resume-workspace-page-options > summary").click();
  await page.getByLabel("Page size", { exact: true }).selectOption("Custom");
  await page.getByLabel("Custom page width").fill("200");
  await page.getByLabel("Custom page height").fill("280");
  await page.getByLabel("left margin", { exact: true }).fill("15");
  await page.reload();
  await page.locator(".resume-workspace-page-options > summary").click();
  await expect(page.getByLabel("Custom page width")).toHaveValue("200");
  await expect(page.getByLabel("left margin", { exact: true })).toHaveValue(
    "15",
  );
});

test("section removal and reordering preserve recoverable content", async ({
  page,
}) => {
  await page.goto("/editor/3");
  await page
    .getByRole("navigation", { name: "Document outline" })
    .getByRole("button", { name: "Professional summary", exact: true })
    .click();
  await page
    .getByLabel("Summary", { exact: true })
    .fill("Keep this summary when hidden.");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Manage resume sections" }).click();
  await page
    .getByRole("button", { name: "Move Summary down", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove Summary", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.locator(".resume-workspace-preview-canvas"),
  ).not.toContainText("Keep this summary when hidden.");
  await page.getByRole("button", { name: "Manage resume sections" }).click();
  await page.getByLabel("Add section", { exact: true }).selectOption("summary");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".resume-workspace-preview-canvas")).toContainText(
    "Keep this summary when hidden.",
  );
  await page.reload();
  await expect(page.locator(".resume-workspace-preview-canvas")).toContainText(
    "Keep this summary when hidden.",
  );
});
