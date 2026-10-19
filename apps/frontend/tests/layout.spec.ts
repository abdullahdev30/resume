import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
test("gallery and editor layouts, long paragraphs, and explicit page breaks", async ({
  page,
}, info) => {
  await page.goto("/builder");
  await expect(page.locator(".template-card")).toHaveCount(8);
  await page.screenshot({
    path: info.outputPath("dashboard.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Use Classic template", exact: true })
    .click();
  await expect(page.locator(".resume-content")).toContainText("Alex Morgan");
  await expect(page.locator(".resume-content ul").first()).toHaveCSS(
    "list-style-type",
    "disc",
  );
  await page.waitForTimeout(250);
  await page.screenshot({
    path: info.outputPath("editor.png"),
    fullPage: true,
  });
  const content = page.getByRole("textbox", { name: "Resume content" });
  await content.fill(
    "Experience and achievements working with customers and colleagues. ".repeat(
      180,
    ) + "THE END",
  );
  await expect
    .poll(async () => page.locator(".paper-background").count())
    .toBeGreaterThan(1);
  await page.waitForTimeout(500);
  const invalid = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(".resume-content")!;
    const paper = document.querySelector<HTMLElement>(".paper-scale")!;
    const scale = Number(paper.dataset.zoom);
    const boxes = [...document.querySelectorAll(".paper-background")].map((x) =>
      x.getBoundingClientRect(),
    );
    return [...root.children]
      .filter((x) => !x.classList.contains("page-gap"))
      .map((x) => x.getBoundingClientRect())
      .filter(
        (x) =>
          !boxes.some(
            (b) =>
              x.top >= b.top + ((19 * 96) / 25.4) * scale - 1 &&
              x.bottom <= b.bottom - ((19 * 96) / 25.4) * scale + 1,
          ),
      )
      .map((x) => ({ top: x.top, bottom: x.bottom }));
  });
  expect(invalid).toEqual([]);
  await content.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Control+Enter");
  await page.keyboard.type("A separate page");
  await page.waitForTimeout(400);
  const screenCount = await page.locator(".paper-background").count();
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page
    .getByRole("button", { name: "Download PDF", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: false }),
  ).toBeEnabled();
  const bytes = await page.pdf({
    preferCSSPageSize: true,
    path: info.outputPath("long-resume.pdf"),
  });
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(screenCount);
});
