import { test, expect } from "@playwright/test";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
const sizes: Record<string, [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  A3: [297, 420],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  Tabloid: [279.4, 431.8],
  Executive: [184.15, 266.7],
};
test("full editing flow keeps content and settings in this tab only", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const requests: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:3100") &&
      !r.url().startsWith("data:")
    )
      requests.push(r.url());
  });
  await page.goto("/builder");
  await expect(
    page.getByRole("heading", { name: "Create your resume", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".template-card")).toHaveCount(8);
  await page.getByRole("tab", { name: "Compact", exact: true }).click();
  await expect(page.locator(".template-card")).toHaveCount(3);
  await page.getByRole("tab", { name: "All", exact: true }).click();
  await page
    .getByRole("button", { name: "Use Classic template", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Resume content", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Resume title" })
    .fill("Jordan Lee Resume");
  await page.getByLabel("Font family", { exact: true }).selectOption("Lato");
  await page.getByLabel("Font size", { exact: true }).fill("11.5");
  await page.getByLabel("Font size", { exact: true }).press("Tab");
  await page.getByRole("button", { name: "File", exact: true }).click();
  await page.getByRole("menuitem", { name: "Page setup", exact: true }).click();
  await page.getByLabel("Paper size").selectOption("Letter");
  await page.getByLabel("Landscape", { exact: true }).check();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Resume title")).toHaveValue(
    "Jordan Lee Resume",
  );
  await expect(page.getByLabel("Font family", { exact: true })).toHaveValue(
    "Lato",
  );
  await expect(page.getByLabel("Font size", { exact: true })).toHaveValue(
    "11.5",
  );
  await expect(page.locator(".editor-footer")).toContainText(
    "Letter · landscape",
  );
  await page.getByRole("button", { name: "File", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Switch template", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Traditional Serif type, centered heading" })
    .click();
  await expect(page.locator(".resume-content")).toContainText("Alex Morgan");
  await page.getByRole("button", { name: "Add section", exact: true }).click();
  await page.getByLabel("Section type").selectOption("Custom section");
  await page.getByLabel("Section name").fill("Volunteer work");
  await page
    .getByRole("button", { name: "Add section", exact: true })
    .last()
    .click();
  await expect(page.locator(".resume-content")).toContainText("Volunteer work");
  await page.getByLabel("Move Volunteer work up").click();
  await page.reload();
  await expect(page.locator(".resume-content")).toContainText("Volunteer work");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(await context.cookies()).toHaveLength(0);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await page
    .getByRole("button", { name: "Back to templates", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Jordan Lee Resume" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: false }).click();
  await page.getByRole("button", { name: "File", exact: true }).click();
  await page.getByRole("menuitem", { name: "Clear data", exact: true }).click();
  await page.getByRole("button", { name: "Clear data", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Create your resume", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("resume-maker-session")),
  ).toBeNull();
});
test("blank resume, corrupt storage, and unavailable storage are safe", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("resume-maker-session"))
      sessionStorage.setItem("resume-maker-session", "{invalid json");
  });
  await page.goto("/builder");
  await page.getByRole("button", { name: "Start a blank resume" }).click();
  await expect(page.locator(".resume-content")).toContainText("Your name");
  await expect(page.locator(".resume-content")).not.toContainText(
    "Alex Morgan",
  );
  await page.getByRole("textbox", { name: "Resume content" }).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("My private experience");
  await page.reload();
  await expect(page.locator(".resume-content")).toContainText(
    "My private experience",
  );
});
test("storage failure falls back to editing in memory", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.goto("/builder");
  await page.getByRole("button", { name: "Start a blank resume" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Browser storage is unavailable",
  );
  await expect(page.locator(".resume-content")).toBeVisible();
});
for (const [name, [w, h]] of Object.entries(sizes))
  for (const orientation of ["portrait", "landscape"])
    test(`PDF ${name} ${orientation} has correct dimensions and text fonts`, async ({
      page,
    }, testInfo) => {
      await page.goto("/builder");
      await page
        .getByRole("button", { name: "Use Classic template", exact: true })
        .click();
      await page.getByRole("button", { name: "File", exact: true }).click();
      await page
        .getByRole("menuitem", { name: "Page setup", exact: true })
        .click();
      await page.getByLabel("Paper size").selectOption(name);
      await page
        .getByLabel(orientation === "landscape" ? "Landscape" : "Portrait", {
          exact: true,
        })
        .check();
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        window.print = () => {};
      });
      await page
        .getByRole("button", { name: "Download PDF", exact: false })
        .click();
      await expect(
        page.getByRole("button", { name: "Download PDF", exact: false }),
      ).toBeEnabled();
      await page.emulateMedia({ media: "print" });
      const bytes = await page.pdf({
        path: testInfo.outputPath(`${name}-${orientation}.pdf`),
        preferCSSPageSize: true,
        printBackground: true,
      });
      const pdf = await PDFDocument.load(bytes);
      expect(pdf.getPageCount()).toBeGreaterThan(0);
      for (const p of pdf.getPages()) {
        const size = p.getSize();
        // Chromium quantizes physical page sizes to print pixels (up to 0.75 pt).
        expect(
          Math.abs(
            size.width - ((orientation === "portrait" ? w : h) * 72) / 25.4,
          ),
        ).toBeLessThanOrEqual(0.75);
        expect(
          Math.abs(
            size.height - ((orientation === "portrait" ? h : w) * 72) / 25.4,
          ),
        ).toBeLessThanOrEqual(0.75);
      }
      const resources = pdf.getPage(0).node.Resources();
      expect(resources).toBeDefined();
      expect(
        resources!.lookup(PDFName.of("Font"), PDFDict).keys().length,
      ).toBeGreaterThan(0);
      const loadingTask = getDocument({
        data: new Uint8Array(bytes),
        useSystemFonts: true,
        disableFontFace: true,
      });
      const parsed = await loadingTask.promise;
      let text = "";
      for (let i = 1; i <= parsed.numPages; i++) {
        const p = await parsed.getPage(i);
        const viewport = p.getViewport({ scale: 1 });
        const content = await p.getTextContent();
        for (const item of content.items) {
          if (!("str" in item)) continue;
          text += item.str + " ";
          if (!item.str.trim()) continue;
          expect(item.transform[4]).toBeGreaterThanOrEqual(-1);
          expect(item.transform[4] + item.width).toBeLessThanOrEqual(
            viewport.width + 1,
          );
          expect(item.transform[5]).toBeGreaterThan(0);
          expect(item.transform[5]).toBeLessThan(viewport.height);
        }
      }
      expect(text).toContain("Alex Morgan");
      expect(text).toContain("Stakeholder communication");
      await loadingTask.destroy();
    });
