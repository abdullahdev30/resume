import { test, expect } from "@playwright/test";
test("template editor retains inline text, full toolbar, outline and local photo upload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/editor/1");
  const outline = page.locator("#guest-editor-details");
  await expect(outline).toBeVisible();
  const toolbar = page.locator(".guest-editor-full-toolbar");
  await expect(toolbar).toBeVisible();
  const openWidth = (await toolbar.boundingBox())!.width;
  expect((await outline.boundingBox())!.y).toBeGreaterThanOrEqual(
    (await toolbar.boundingBox())!.y +
      (await toolbar.boundingBox())!.height -
      1,
  );
  await expect(outline.getByRole("link")).toHaveCount(0);
  await page
    .locator(".guest-preview-canvas .resume-element-id--fullName")
    .click();
  const name = page.getByRole("textbox", { name: "Full name", exact: true });
  await expect(name).toBeVisible();
  await name.fill("Alex Example");
  await name.press("Enter");
  await expect(
    page.locator(".guest-preview-canvas .resume-element-id--fullName"),
  ).toHaveText(/Alex Example/i);
  await outline
    .getByRole("button", { name: "Alex Example", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByLabel("Full name", { exact: true })
    .fill("Jordan Example");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(
    page.locator(".guest-preview-canvas .resume-element-id--fullName"),
  ).toHaveText(/Jordan Example/i);
  await page
    .getByRole("button", { name: "Hide resume details", exact: true })
    .click();
  await expect(outline).toBeHidden();
  expect((await toolbar.boundingBox())!.width).toBeCloseTo(openWidth, 0);
  await page
    .getByRole("button", { name: "Show resume details", exact: true })
    .click();
  await expect(outline).toBeVisible();
  const input = page.locator(".guest-preview-canvas input[type=file]").first();
  const chooserPromise = page.waitForEvent("filechooser");
  await input.locator("..").click();
  const chooser = await chooserPromise;
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#336699";
    context.fillRect(0, 0, 64, 64);
    return canvas.toDataURL("image/png").split(",")[1]!;
  });
  await chooser.setFiles({
    name: "profile.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await expect(
    page.getByRole("dialog", { name: "Adjust profile photo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply image", exact: false }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Apply image", exact: false }).click();
  await expect(
    page.locator('.guest-preview-canvas img[alt="Avatar"]'),
  ).toHaveAttribute("src", /^blob:/);
  expect(errors).toEqual([]);
});
