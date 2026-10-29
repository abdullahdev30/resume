import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";

for (let templateId = 1; templateId <= 10; templateId++) {
  test(`template ${templateId} creates styled server PDF through shared editor`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await login(page, "/resumes/create/template");
    await expect(page.getByLabel("Use existing persona")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Use this template", exact: true })
      .nth(templateId - 1)
      .click();
    await page
      .getByRole("button", { name: "Enter information manually", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Document outline" })
      .getByRole("button", { name: "Your Name", exact: true })
      .click();
    await page
      .getByLabel("Full name", { exact: true })
      .fill(`Alex Template ${templateId}`);
    await page
      .getByLabel("Professional title", { exact: true })
      .fill("Software Engineer");
    await page.getByLabel("Email", { exact: true }).fill("alex@example.com");
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Document outline" })
      .getByRole("button", { name: "Professional summary", exact: true })
      .click();
    await page
      .getByLabel("Summary", { exact: true })
      .fill("Builds reliable software with clear technical communication.");
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Document outline" })
      .getByRole("button", { name: "Work experience", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add experience", exact: true })
      .click();
    await page.getByLabel("Job title", { exact: true }).fill("Engineer");
    await page.getByLabel("Company", { exact: true }).fill("Example Company");
    await page.getByLabel("Period", { exact: true }).fill("2022-2026");
    await page
      .getByLabel("Description / achievements", { exact: true })
      .fill("Delivered reliable systems and documented the results.");
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    if (templateId === 1) {
      const png = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#336699";
        ctx.fillRect(0, 0, 64, 64);
        return canvas.toDataURL("image/png").split(",")[1]!;
      });
      const chooserPromise = page.waitForEvent("filechooser");
      await page
        .locator(".resume-workspace-preview-canvas input[type=file]")
        .first()
        .locator("..")
        .click();
      await (
        await chooserPromise
      ).setFiles({
        name: "profile.png",
        mimeType: "image/png",
        buffer: Buffer.from(png, "base64"),
      });
      await expect(
        page.getByRole("button", { name: "Apply image", exact: false }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Apply image", exact: false })
        .click();
      await expect(
        page.locator('.resume-workspace-preview-canvas img[alt="Avatar"]'),
      ).toHaveAttribute("src", /^data:image/);
    }
    const created = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/resumes/template") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    const resume = await response.json();
    await page.screenshot({
      path: info.outputPath("preview.png"),
      fullPage: true,
    });
    const html = await (
      await page.request.get(`/api/v1/resumes/${resume.id}/html`)
    ).json();
    expect(html.html).toContain("font-size:");
    expect(html.html).toContain("background-color:");
    expect(html.html).toContain("padding");
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download PDF", exact: true })
      .click();
    const download = await event;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);
    const filename = info.outputPath("resume.pdf");
    await writeFile(filename, bytes);
    const result = JSON.parse(
      execFileSync(
        path.resolve("../backend/venv/Scripts/python.exe"),
        [
          "-c",
          `import pymupdf,json,sys; d=pymupdf.open(sys.argv[1]); p=d[0]; p.get_pixmap().save(sys.argv[2]); print(json.dumps({'text':''.join(x.get_text() for x in d),'drawings':len(p.get_drawings()),'fonts':len(p.get_fonts()),'colors':list({s['color'] for b in p.get_text('dict')['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans']})}))`,
          filename,
          info.outputPath("pdf.png"),
        ],
        { encoding: "utf8" },
      ),
    );
    expect(result.text.replace(/\s+/g, "").toLowerCase()).toContain(
      `alextemplate${templateId}`,
    );
    expect(result.text.replace(/\s+/g, " ")).toContain(
      "Builds reliable software",
    );
    expect(result.text.toLowerCase()).toContain("example company");
    expect(result.text.replace(/\s+/g, " ")).toContain(
      "Delivered reliable systems",
    );
    if (templateId === 1) {
      expect(resume.resume_data.avatarUrl).toMatch(/^data:image/);
      const imageCount = Number(
        execFileSync(
          path.resolve("../backend/venv/Scripts/python.exe"),
          [
            "-c",
            "import pymupdf,sys; d=pymupdf.open(sys.argv[1]); print(sum(len(p.get_images()) for p in d))",
            filename,
          ],
          { encoding: "utf8" },
        ),
      );
      expect(imageCount).toBeGreaterThan(0);
    }
    expect(result.drawings).toBeGreaterThan(0);
    expect(result.fonts).toBeGreaterThan(0);
    expect(result.colors.length).toBeGreaterThan(1);
    await page.reload();
    await expect(
      page.locator(".resume-workspace-preview-canvas"),
    ).toContainText(`Alex Template ${templateId}`);
    const deleted = await page.request.delete(`/api/v1/resumes/${resume.id}`);
    expect(deleted.status()).toBe(200);
    expect(errors).toEqual([]);
  });
}

test("persona autofill stays independent and AI draft waits for acceptance", async ({
  page,
}) => {
  await login(page, "/resumes/create/template");
  const created = await page.request.post("/api/v1/personas", {
    data: { name: "Resume source" },
  });
  expect(created.status()).toBe(201);
  const persona = await created.json();
  expect(
    (
      await page.request.put(`/api/v1/personas/${persona.id}/personal`, {
        data: {
          first_name: "Alex",
          last_name: "Morgan",
          email: "alex@example.com",
          summary: "A factual persona summary.",
        },
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Use this template", exact: true })
    .nth(1)
    .click();
  await page.getByLabel("Use existing persona").selectOption(persona.id);
  await page
    .getByRole("button", { name: "Use this persona", exact: true })
    .click();
  await expect(page.locator(".resume-workspace-preview-canvas")).toContainText(
    "Alex Morgan",
  );
  await page
    .locator(".resume-workspace-preview-canvas .resume-element-id--fullName")
    .click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Independent Resume");
  await page.getByLabel("Full name", { exact: true }).press("Enter");
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/resumes/template") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await saved).status()).toBe(201);
  const original = await (
    await page.request.get(`/api/v1/personas/${persona.id}`)
  ).json();
  expect(original.data.personal.first_name).toBe("Alex");
  const before = await (await page.request.get("/api/v1/resumes")).json();
  await page.goto("/resumes/create/ai");
  await page.getByLabel("Persona", { exact: true }).selectOption(persona.id);
  await page
    .getByLabel("What should this resume emphasize?", { exact: true })
    .fill("Use a conservative design and improve the supplied wording.");
  await page
    .getByRole("button", { name: "Generate resume", exact: true })
    .click();
  await expect(page.locator(".resume-workspace-preview-canvas")).toContainText(
    "Alex Morgan",
  );
  const after = await (await page.request.get("/api/v1/resumes")).json();
  expect(after.resumes.length).toBe(before.resumes.length);
  const accepted = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/resumes/template") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const acceptedResponse = await accepted;
  expect(acceptedResponse.status()).toBe(201);
  const record = await acceptedResponse.json();
  expect(record.resume_type).toBe("ai");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect(await (await event).suggestedFilename()).toMatch(/\.pdf$/);
});

async function login(page: Page, destination: string) {
  await page.goto(`/auth/login?next=${encodeURIComponent(destination)}`);
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("john@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
}

test("stored PDF creation, HTML extraction, editing and downloading", async ({
  page,
}) => {
  await login(page, "/resumes");
  const created = await page.request.post("/api/v1/resumes/template", {
    data: {
      title: "PDF workflow resume",
      template_id: "2",
      resume_data: {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        phone: "+12025550123",
        summary: "Initial professional summary.",
        experience: [
          {
            role: "Engineer",
            company: "Example Company",
            period: "Jan 2020 – Present",
            details: "Built reliable software.",
          },
        ],
        certificates: [
          {
            title: "Cloud",
            issuer: "Example",
            date: "Jan 2024",
            url: "https://example.com/certificate",
          },
        ],
        socialLinks: [
          { platform: "Portfolio", url: "https://example.com" },
          { platform: "LinkedIn", url: "https://linkedin.com/in/alex" },
          { platform: "GitHub", url: "https://github.com/alex" },
          { platform: "Blog", url: "https://example.com/blog" },
        ],
      },
      html_content: "<h1>Alex Morgan</h1><p>Initial professional summary.</p>",
    },
    timeout: 60000,
  });
  expect(created.status()).toBe(201);
  const resume = await created.json();
  await page.goto(`/resumes/${resume.id}`);
  await expect(
    page.getByRole("heading", { name: "PDF workflow resume", exact: true }),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const pdf = await PDFDocument.load(Buffer.concat(chunks));
  expect(pdf.getPageCount()).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "View PDF as HTML", exact: true })
    .click();
  await expect(
    page
      .frameLocator('iframe[title="Extracted PDF HTML"]')
      .getByText("Alex Morgan", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit resume", exact: true }).click();
  await expect(page).toHaveURL(/\/editor\/2\?resumeId=/);
  await expect(
    page.getByText("Alex Morgan", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.locator(".resume-workspace-editor-full-toolbar"),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Document outline" }),
  ).toBeVisible();
  await page
    .locator("#resume-workspace-editor-details")
    .getByRole("button", { name: "Work experience", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Work experience", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .locator(".resume-workspace-preview-canvas .resume-element-id--fullName")
    .click();
  await page
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill("Alex Updated");
  await page
    .getByRole("textbox", { name: "Full name", exact: true })
    .press("Enter");
  await page.locator(".resume-workspace-page-options > summary").click();
  await page
    .getByLabel("Page orientation", { exact: true })
    .selectOption("landscape");
  await page.locator(".resume-workspace-page-options > summary").click();
  // Save through the real editor to exercise its HTML snapshot and PDF version.
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get(`/api/v1/resumes/${resume.id}`)).json())
          .source_version,
      { timeout: 60000 },
    )
    .toBeGreaterThan(1);
  const html = await (
    await page.request.get(`/api/v1/resumes/${resume.id}/html`)
  ).json();
  expect(html.html).toContain("resume-page");
  expect(html.html).toContain("Alex Updated");
  const preserved = await (
    await page.request.get(`/api/v1/resumes/${resume.id}`)
  ).json();
  expect(preserved.resume_data.experience[0].period).toBe("Jan 2020 – Present");
  expect(preserved.resume_data.certificates[0].url).toBe(
    "https://example.com/certificate",
  );
  expect(preserved.resume_data.socialLinks[3].platform).toBe("Blog");
  expect(preserved.resume_data.pageOrientation).toBe("landscape");
  await page.reload();
  await expect(
    page.locator(
      ".resume-workspace-preview-canvas .resume-element-id--fullName",
    ),
  ).toHaveText("Alex Updated");
  const latestDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const latestStream = await (await latestDownloadEvent).createReadStream();
  const latestChunks: Buffer[] = [];
  for await (const chunk of latestStream!)
    latestChunks.push(Buffer.from(chunk));
  const latestPdf = await PDFDocument.load(Buffer.concat(latestChunks));
  expect(latestPdf.getPage(0).getWidth()).toBeGreaterThan(
    latestPdf.getPage(0).getHeight(),
  );
  await page.screenshot({
    path: "test-results/account-shared-editor.png",
    fullPage: true,
  });
});

test("cached personas and account profile remain visible while their API is unavailable", async ({
  page,
}) => {
  await login(page, "/persona");
  await page
    .getByRole("button", { name: "Create a persona", exact: true })
    .first()
    .click();
  const cachedName = `Cached persona ${Date.now()}`;
  await page
    .getByRole("textbox", { name: "Persona name", exact: true })
    .fill(cachedName);
  await page
    .getByRole("button", { name: "Create persona", exact: true })
    .click();
  await page.getByRole("link", { name: "All personas", exact: true }).click();
  await expect(
    page.getByRole("link", { name: `Open ${cachedName}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.locator('[aria-label="Account profile details"]'),
  ).toContainText("John Doe");
  await page.route("**/api/v1/personas", (route) => route.abort());
  await page.route("**/api/v1/auth/profile", (route) => route.abort());
  await page.getByRole("link", { name: "Persona", exact: true }).click();
  await expect(
    page.getByRole("link", { name: `Open ${cachedName}`, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Loading personas...", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.locator('[aria-label="Account profile details"]'),
  ).toContainText("John Doe");
  await expect(
    page.getByText("Loading account profile...", { exact: true }),
  ).toHaveCount(0);
});

test("account templates copy the selected persona into a stored editable PDF", async ({
  page,
}) => {
  await login(page, "/resumes");
  const created = await page.request.post("/api/v1/personas", {
    data: { name: "Template persona" },
  });
  expect(created.status()).toBe(201);
  const persona = await created.json();
  const updated = await page.request.put(
    `/api/v1/personas/${persona.id}/personal`,
    {
      data: {
        first_name: "Taylor",
        last_name: "Template",
        email: "taylor@example.com",
        summary: "Persona template snapshot.",
      },
    },
  );
  expect(updated.ok()).toBeTruthy();
  await page.goto(`/resumes/create/template?personaId=${persona.id}`);
  await page
    .getByRole("button", { name: "Use this template", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Use existing persona")).toHaveValue(persona.id);
  await page
    .getByRole("button", { name: "Use this persona", exact: true })
    .click();
  await expect(page.locator(".resume-workspace-preview-canvas")).toContainText(
    "Taylor Template",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/editor\/[^?]+\?resumeId=/, {
    timeout: 60000,
  });
  await expect(
    page.locator(
      ".resume-workspace-preview-canvas .resume-element-id--fullName",
    ),
  ).toHaveText("Taylor Template");
  const id = new URL(page.url()).searchParams.get("resumeId");
  const source = await (
    await page.request.get(`/api/v1/resumes/${id}/html`)
  ).json();
  expect(source.html).toContain("resume-page");
  expect(source.html).toContain("Taylor Template");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toMatch(/\.pdf$/);
});

test("AI prompt bar sends instructions, reviews proposals and preserves failed prompts", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.fetch;
    window.fetch = async (...args) => {
      if (
        String(args[0]).includes(".woff2") &&
        !document.documentElement.dataset.fontRetryTest
      ) {
        document.documentElement.dataset.fontRetryTest = "true";
        throw new TypeError("Failed to fetch");
      }
      return original(...args);
    };
  });

  await login(page, "/resumes");
  const response = await page.request.post("/api/v1/resumes/template", {
    data: {
      title: "Prompt bar resume",
      template_id: "2",
      html_content:
        '<div class="resume-page"><h1>Alex Morgan</h1><p>Original summary.</p></div>',
      resume_data: {
        fullName: "Alex Morgan",
        email: "alex@example.com",
        summary: "Original summary.",
      },
    },
    timeout: 60000,
  });
  expect(response.status()).toBe(201);
  const resume = await response.json();
  await page.goto(`/editor/2?resumeId=${resume.id}`);
  const assistant = page.getByRole("region", { name: "AI resume assistant" });
  await expect(
    assistant.getByRole("button", { name: "Send AI prompt" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Resume template", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    assistant.getByRole("button", { name: "Prompt suggestions" }),
  ).toHaveCount(0);
  const compact = (await assistant.boundingBox())!;
  const canvas = (await page
    .locator(".resume-workspace-preview-canvas")
    .boundingBox())!;
  expect(compact.width).toBeLessThanOrEqual(302);
  expect(compact.y).toBeGreaterThan(canvas.y);
  expect(compact.y + compact.height).toBeLessThanOrEqual(
    canvas.y + canvas.height,
  );
  await page.screenshot({ path: "test-results/prompt-compact.png" });
  await assistant.hover();
  await expect
    .poll(async () => (await assistant.boundingBox())!.width)
    .toBeGreaterThan(compact.width + 100);
  await page.screenshot({ path: "test-results/prompt-expanded.png" });
  await page.mouse.move(0, 0);
  await expect
    .poll(async () => (await assistant.boundingBox())!.width)
    .toBeLessThanOrEqual(compact.width + 1);
  const prompt = assistant.getByRole("textbox", { name: "AI instruction" });
  await prompt.fill("Make my summary more concise");
  await expect
    .poll(async () => (await assistant.boundingBox())!.width)
    .toBeGreaterThan(compact.width + 100);
  await page.route(`**/api/v1/resumes/${resume.id}/ai-edit`, async (route) => {
    expect(route.request().postDataJSON().instruction).toBe(
      "Make my summary more concise",
    );
    await route.fulfill({
      json: {
        template_id: "9",
        resume_data: { ...resume.resume_data, summary: "Concise AI summary." },
      },
    });
  });
  await prompt.press("Enter");
  await expect(page.getByText("Proposal ready", { exact: true })).toBeVisible();
  const source = await (
    await page.request.get(`/api/v1/resumes/${resume.id}`)
  ).json();
  expect(source.resume_data.summary).toBe("Original summary.");
  await page
    .getByRole("button", { name: "Apply proposal", exact: true })
    .click();
  await expect(page.getByText("Proposal ready", { exact: true })).toHaveCount(
    0,
  );
  await expect
    .poll(
      async () =>
        (await (await page.request.get(`/api/v1/resumes/${resume.id}`)).json())
          .resume_data.summary,
      { timeout: 60000 },
    )
    .toBe("Concise AI summary.");
  expect(
    (await (await page.request.get(`/api/v1/resumes/${resume.id}`)).json())
      .template_id,
  ).toBe("2");
  expect(
    await page.evaluate(() => document.documentElement.dataset.fontRetryTest),
  ).toBe("true");
  await page.route(`**/api/v1/resumes/${resume.id}/ai-edit`, (route) =>
    route.fulfill({
      status: 503,
      json: { detail: { message: "AI is temporarily unavailable." } },
    }),
  );
  await prompt.fill("Improve my experience");
  await assistant.getByRole("button", { name: "Send AI prompt" }).click();
  await expect(assistant.getByRole("alert")).toBeVisible();
  await expect(prompt).toHaveValue("Improve my experience");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    assistant.getByRole("button", { name: "Send AI prompt" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/account-editor-mobile.png",
    fullPage: true,
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBeTruthy();
});

test("long canonical resume keeps every entry in the server PDF", async ({
  page,
}, info) => {
  await login(page, "/resumes");
  const experience = Array.from({ length: 12 }, (_, i) => ({
    role: `Engineer ${i + 1}`,
    company: `Employer-${i + 1}`,
    period: "2020-2026",
    details:
      "Built and documented reliable software systems with colleagues. ".repeat(
        12,
      ) + ` Final-marker-${i + 1}.`,
  }));
  const response = await page.request.post("/api/v1/resumes/template", {
    data: {
      title: "Long resume",
      template_id: "3",
      resume_data: {
        fullName: "Long Resume Candidate",
        jobTitle: "Engineer",
        email: "long@example.com",
        summary: "Long document verification.",
        experience,
        skills: ["Python"],
        languages: [],
        fontFamily: "Roboto, sans-serif",
      },
      html_content:
        '<div class="resume-page">Initial source before canonical edit</div>',
    },
    timeout: 60000,
  });
  expect(response.status()).toBe(201);
  const record = await response.json();
  await page.goto(`/editor/3?resumeId=${record.id}`);
  await page.getByLabel("Resume title").fill("Long canonical resume");
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/resumes/${record.id}`) &&
      r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await saved).status()).toBe(200);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const filename = info.outputPath("long-resume.pdf");
  await (await downloaded).saveAs(filename);
  const result = JSON.parse(
    execFileSync(
      path.resolve("../backend/venv/Scripts/python.exe"),
      [
        "-c",
        "import pymupdf,json,sys; d=pymupdf.open(sys.argv[1]); print(json.dumps({'pages':len(d),'text':''.join(p.get_text() for p in d)}))",
        filename,
      ],
      { encoding: "utf8" },
    ),
  );
  expect(result.pages).toBeGreaterThan(1);
  for (let i = 1; i <= 12; i++)
    expect(result.text.replace(/\s+/g, " ")).toContain(`Final-marker-${i}.`);
  expect(
    (await page.request.delete(`/api/v1/resumes/${record.id}`)).status(),
  ).toBe(200);
});

test("resume gallery uses saved templates, tracks opens and separates Home sections", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "/resumes");
  const stamp = Date.now();
  const records = [];
  for (const [template_id, fullName] of [
    ["2", "Gallery Engineer"],
    ["4", "Gallery Executive"],
  ]) {
    const response = await page.request.post("/api/v1/resumes/template", {
      data: {
        title: `${fullName} ${stamp}`,
        template_id,
        resume_data: {
          fullName,
          email: "gallery@example.com",
          summary: "Saved resume thumbnail content.",
        },
        html_content: `<h1>${fullName}</h1>`,
      },
      timeout: 60000,
    });
    expect(response.status()).toBe(201);
    records.push(await response.json());
  }
  await page.goto("/resumes");
  const first = page.getByRole("link", {
    name: `Open ${records[0].title}`,
    exact: true,
  });
  await first.scrollIntoViewIfNeeded();
  await expect(first.locator(".resume-page")).toContainText("Gallery Engineer");
  await expect(first.getByRole("button")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Edit resume", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toHaveCount(0);
  await first.click();
  await expect(page).toHaveURL(new RegExp(`resumeId=${records[0].id}$`));
  await page.goto("/resumes");
  await page
    .getByRole("link", { name: `Open ${records[1].title}`, exact: true })
    .click();
  await expect(page.getByLabel("Resume title")).toHaveValue(records[1].title);
  await page.goto("/dashboard");
  const trending = page.getByRole("region", { name: "Trending templates" });
  const recent = page.getByRole("region", { name: "Recently opened resumes" });
  await expect(trending.getByRole("link", { name: /^Use / })).toHaveCount(10);
  const links = recent.locator('a[aria-label^="Open "]');
  await expect(links).toHaveCount(2);
  await expect(links.first()).toHaveAttribute(
    "aria-label",
    `Open ${records[1].title}`,
  );
  expect(
    await trending.evaluate((e) => getComputedStyle(e).backgroundColor),
  ).not.toBe(await recent.evaluate((e) => getComputedStyle(e).backgroundColor));
  await page.screenshot({
    path: info.outputPath("home-gallery.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page
        .locator(".app-sidebar")
        .evaluate((element) => element.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("home-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await links.first().click();
  await page
    .locator("summary")
    .filter({ hasText: /^File$/ })
    .click();
  await page
    .getByRole("button", { name: "Delete resume", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete resume", exact: true })
    .click();
  await expect(page).toHaveURL(/\/resumes$/);
  await expect(
    page.getByRole("link", { name: `Open ${records[1].title}`, exact: true }),
  ).toHaveCount(0);
  await page.goto("/dashboard");
  await page
    .getByRole("region", { name: "Trending templates" })
    .getByRole("link", { name: /^Use / })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Choose how to fill your selected template.",
  );
  await page
    .getByRole("button", { name: "Enter information manually", exact: true })
    .click();
  await expect(page.getByLabel("Resume title")).toBeVisible();
  expect(errors).toEqual([]);
  await page.request.delete(`/api/v1/resumes/${records[0].id}`);
});

test("frontend typography matches the free gallery and editor shows logo with document title", async ({
  page,
}, info) => {
  await page.goto("/templates");
  const typography = async (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          family: css.fontFamily,
          size: css.fontSize,
          weight: css.fontWeight,
        };
      });
  const body = await typography("body");
  const heading = await typography("main h1");
  expect(body.family.toLowerCase()).toContain("arial");
  expect(body.size).toBe("16px");
  await page.goto("/auth/login");
  expect(await typography(".auth-brand-copy h1")).toEqual(heading);
  await login(page, "/dashboard");
  for (const route of ["/dashboard", "/resumes", "/persona", "/settings"]) {
    await page.goto(route);
    await expect(page.locator("main h1").first()).toBeVisible();
    expect(await typography("main h1")).toEqual(heading);
    expect(await typography("body")).toEqual(body);
  }
  const response = await page.request.post("/api/v1/resumes/template", {
    data: {
      title: "Typography check resume",
      template_id: "3",
      resume_data: {
        fullName: "Typography Candidate",
        fontFamily: "'Times New Roman', serif",
        summary: "Keep the document font separate from interface typography.",
      },
      html_content: "<h1>Typography Candidate</h1>",
    },
    timeout: 60000,
  });
  expect(response.status()).toBe(201);
  const record = await response.json();
  await page.goto(`/editor/3?resumeId=${record.id}`);
  const header = page.locator(".resume-workspace-editor-header");
  const title = page.getByLabel("Resume title");
  await expect(title).toHaveValue("Typography check resume");
  await expect(header).not.toContainText("Resume Builder");
  const logo = header.locator("img");
  await expect(logo).toHaveAttribute("src", /resume_logo/);
  const aligned = async () => {
    const l = (await logo.boundingBox())!;
    const t = (await title.boundingBox())!;
    expect(t.x).toBeGreaterThan(l.x + l.width);
    expect(Math.abs(l.y + l.height / 2 - (t.y + t.height / 2))).toBeLessThan(4);
  };
  await aligned();
  const documentHeading = page.locator(".resume-workspace-preview-canvas h1");
  expect(
    (
      await documentHeading.evaluate((e) => getComputedStyle(e).fontFamily)
    ).toLowerCase(),
  ).toContain("times new roman");
  expect(
    await documentHeading.evaluate((e) =>
      parseFloat(getComputedStyle(e).fontSize),
    ),
  ).toBeGreaterThan(16);
  await page.screenshot({ path: info.outputPath("editor-logo-title.png") });
  await title.fill("Updated document title");
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/resumes/${record.id}`) &&
      r.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await saved).status()).toBe(200);
  await page.reload();
  await expect(title).toHaveValue("Updated document title");
  await page.setViewportSize({ width: 390, height: 844 });
  await aligned();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("editor-logo-title-mobile.png"),
  });
  await page.request.delete(`/api/v1/resumes/${record.id}`);
});
