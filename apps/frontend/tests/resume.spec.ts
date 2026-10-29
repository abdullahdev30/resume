import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
const sizes: Record<string, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  A5: [148, 210],
  B5: [176, 250],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  Tabloid: [279.4, 431.8],
  Executive: [184.15, 266.7],
};
test("free workflow recovers session draft, never calls backend, locks its template and clears data", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const backend: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/v1/"))
      backend.push(request.url());
  });
  await page.goto("/templates");
  await expect(page.locator(".resume-workspace-template-card")).toHaveCount(11);
  await page
    .getByRole("button", { name: "Use this template", exact: true })
    .first()
    .click();
  await page
    .getByRole("navigation", { name: "Document outline" })
    .getByRole("button", { name: "Your Name", exact: true })
    .click();
  await page.getByLabel("Full name", { exact: true }).fill("Jordan Example");
  await page
    .getByLabel("Professional title", { exact: true })
    .fill("Software Engineer");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Resume title").fill("Jordan Resume");
  await page
    .getByLabel("Document font", { exact: true })
    .selectOption("Georgia, serif");
  await page.locator(".resume-workspace-page-options > summary").click();
  await page.getByLabel("Page size", { exact: true }).selectOption("Letter");
  await page
    .getByLabel("Page orientation", { exact: true })
    .selectOption("landscape");
  await page.locator(".resume-workspace-page-options > summary").click();
  await expect(page.getByLabel("Resume template", { exact: true })).toHaveCount(
    0,
  );
  await page.reload();
  await expect(page.getByLabel("Resume title")).toHaveValue("Jordan Resume");
  await expect(page.getByLabel("Document font", { exact: true })).toHaveValue(
    "Georgia, serif",
  );
  await expect(page.locator(".resume-workspace-preview-canvas")).toContainText(
    "Jordan Example",
  );
  await expect(
    page.locator(".resume-workspace-preview-canvas .resume-page").first(),
  ).toHaveAttribute("data-page-orientation", "landscape");
  expect(await context.cookies()).toHaveLength(0);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("resume-maker-session")!).version,
    ),
  ).toBe(2);
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printed = "true";
    };
  });
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-printed", "true");
  await page.getByText("File", { exact: true }).click();
  await page.getByRole("button", { name: "Clear data", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear data", exact: true })
    .click();
  await expect(
    page.locator(".resume-workspace-preview-canvas"),
  ).not.toContainText("Jordan Example");
  expect(backend).toEqual([]);
  expect(errors).toEqual([]);
});
for (const [size, [width, height]] of Object.entries(sizes))
  for (const orientation of ["portrait", "landscape"]) {
    test(`free print dimensions ${size} ${orientation}`, async ({
      page,
    }, info) => {
      await page.goto("/editor/2");
      await page
        .getByRole("navigation", { name: "Document outline" })
        .getByRole("button", { name: "Your Name", exact: true })
        .click();
      await page
        .getByLabel("Full name", { exact: true })
        .fill("Selectable Resume Text");
      await page
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
      await page.locator(".resume-workspace-page-options > summary").click();
      await page.getByLabel("Page size", { exact: true }).selectOption(size);
      await page
        .getByLabel("Page orientation", { exact: true })
        .selectOption(orientation);
      await page.locator(".resume-workspace-page-options > summary").click();
      const bytes = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        path: info.outputPath(`${size}-${orientation}.pdf`),
      });
      const pdf = await PDFDocument.load(bytes);
      const first = pdf.getPage(0);
      expect(
        Math.abs(
          first.getWidth() -
            ((orientation === "portrait" ? width : height) * 72) / 25.4,
        ),
      ).toBeLessThan(1);
      expect(
        Math.abs(
          first.getHeight() -
            ((orientation === "portrait" ? height : width) * 72) / 25.4,
        ),
      ).toBeLessThan(1);
      expect(pdf.getPageCount()).toBe(1);
    });
  }
test("corrupt session data safely starts a new draft", async ({ page }) => {
  await page.goto("/templates");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "resume-maker-session",
      '{"version":2,"state":{"data":null}}',
    ),
  );
  await page.goto("/editor/1");
  await expect(page.getByLabel("Resume title")).toHaveValue("My Resume");
});

test("malformed entry storage cannot crash the shared editor", async ({
  page,
}) => {
  await page.goto("/editor/1");
  await page.waitForTimeout(650);
  await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem("resume-maker-session")!);
    raw.state.data.experience = [null];
    sessionStorage.setItem("resume-maker-session", JSON.stringify(raw));
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await expect(page.getByLabel("Resume title")).toHaveValue("My Resume");
  expect(errors).toEqual([]);
});
