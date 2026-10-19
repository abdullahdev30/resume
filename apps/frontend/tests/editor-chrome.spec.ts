import { test, expect } from "@playwright/test";
test("light editor, visible rulers, search, and margin controls", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/builder");
  await page
    .getByRole("button", { name: "Use Classic template", exact: true })
    .click();
  await expect(page.locator(".editor-app")).toHaveCSS(
    "background-color",
    "rgb(248, 250, 253)",
  );
  await expect(
    page.getByRole("heading", { name: "Document tabs" }),
  ).toBeVisible();
  const ruler = await page.locator(".ruler").boundingBox();
  const workspace = await page.locator(".workspace").boundingBox();
  expect(ruler!.y).toBeGreaterThanOrEqual(workspace!.y);
  await page
    .getByRole("button", { name: "Find in document", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Find text", exact: true })
    .fill("Northstar");
  await page.getByRole("button", { name: "Find", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => getSelection()?.toString()))
    .toBe("Northstar");
  await page.getByRole("button", { name: "Paint format", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Find text", exact: true })
    .fill("Thoughtful");
  await page.getByRole("button", { name: "Find", exact: true }).click();
  await expect(
    page.locator(".resume-content strong").filter({ hasText: "Thoughtful" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Close search" }).click();
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printed = "true";
    };
  });
  await page.getByRole("button", { name: "Print", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "true");
  await page.getByRole("slider", { name: "Left page margin" }).focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.reload();
  await expect(
    page.getByRole("slider", { name: "Left page margin" }),
  ).toHaveValue("1");
  await page.screenshot({
    path: info.outputPath("light-editor.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 600, height: 850 });
  await expect(page.locator(".section-sidebar")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
