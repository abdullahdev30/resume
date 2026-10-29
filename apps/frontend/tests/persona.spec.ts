import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/auth/login?next=/persona");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("john@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/persona$/);
}

async function createPersona(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Create a persona", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Persona name", exact: true })
    .fill(name);
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("A persona for focused applications");
  await page
    .getByRole("button", { name: "Create persona", exact: true })
    .click();
  await expect(page).toHaveURL(/\/persona\/[a-f0-9-]+$/);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  return page.url();
}

test("persona flow: create, category CRUD, refresh, isolation, rename, search, and deletion", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await expect(
    page.getByRole("link", { name: "Persona", exact: true }),
  ).toBeVisible();
  const firstUrl = await createPersona(page, "Engineering persona");
  await page
    .getByRole("button", { name: "Add details", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "First name", exact: true })
    .fill("Alex");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("alex@example.com");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(
    page.getByText("alex@example.com", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Address", exact: false }).click();
  await page
    .getByRole("button", { name: "Add details", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Street address", exact: true })
    .fill("25 Main Street");
  await page.getByRole("textbox", { name: "City", exact: true }).fill("Lahore");
  await page
    .getByRole("textbox", { name: "Country", exact: true })
    .fill("Pakistan");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.getByText("25 Main Street", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Skills & languages/ }).click();
  await page
    .getByRole("button", { name: "Add new", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Skill or language", exact: true })
    .fill("Python");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await page.getByRole("button", { name: "Edit Python", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Skill or language", exact: true })
    .fill("TypeScript");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await page.screenshot({
    path: info.outputPath("persona-category.png"),
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("button", { name: /Skills & languages/ }).click();
  await expect(
    page.getByRole("heading", { name: "TypeScript", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete TypeScript", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "TypeScript", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "All personas", exact: true }).click();
  const secondUrl = await createPersona(page, "Design persona");
  await expect(page.getByText("alex@example.com", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: /Address/ }).click();
  await expect(page.getByText("25 Main Street", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Edit persona", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Persona name", exact: true })
    .fill("Creative persona");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Creative persona", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "All personas", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search personas" })
    .fill("Engineering");
  await expect(
    page.locator(`a[href="${new URL(firstUrl).pathname}"]`),
  ).toBeVisible();
  await expect(
    page.locator(`a[href="${new URL(secondUrl).pathname}"]`),
  ).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Search personas" }).fill("");
  await page.screenshot({
    path: info.outputPath("persona-gallery.png"),
    fullPage: true,
  });
  await page.goto(secondUrl);
  await page
    .getByRole("button", { name: "Delete persona", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page).toHaveURL(/\/persona$/);
  await expect(
    page.locator(`a[href="${new URL(secondUrl).pathname}"]`),
  ).toHaveCount(0);
  await page.goto(firstUrl);
  await expect(
    page.getByText("alex@example.com", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Account profile", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "First name", exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("persona requires login and has a usable narrow layout", async ({
  page,
}) => {
  await page.goto("/persona");
  await expect(page).toHaveURL(/\/auth\/login\?next=/);
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "A persona for every direction." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("persona photo and certificate uploads survive refresh and gallery keeps three columns", async ({
  page,
}) => {
  await login(page);
  await createPersona(page, "Media persona");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("Upload persona photo", { exact: true })
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png });
  await expect(
    page.getByRole("img", { name: "Media persona photo", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("img", { name: "Media persona photo", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Certificates/ }).click();
  await page
    .getByRole("button", { name: "Add new", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Certificate title", exact: true })
    .fill("Cloud certification");
  await page
    .getByLabel("Upload certificate (optional)", { exact: true })
    .setInputFiles({
      name: "certificate.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\ncertificate"),
    });
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Cloud certification", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Certificates/ }).click();
  await expect(
    page.getByRole("heading", { name: "Cloud certification", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "All personas", exact: true }).click();
  // Add one more card to verify the desktop grid rather than just its CSS rule.
  await createPersona(page, "Third persona");
  await page.getByRole("link", { name: "All personas", exact: true }).click();
  const cards = page.locator('a[href^="/persona/"][aria-label^="Open "]');
  await expect.poll(() => cards.count()).toBeGreaterThanOrEqual(3);
  const boxes = await cards.evaluateAll((elements) =>
    elements.slice(0, 3).map((element) => ({
      top: element.getBoundingClientRect().top,
      left: element.getBoundingClientRect().left,
    })),
  );
  expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
  expect(new Set(boxes.map((box) => box.left)).size).toBe(3);
});

test("account profile stays separate when its details are copied into a persona", async ({
  page,
}, info) => {
  await login(page);
  const before = await (await page.request.get("/api/v1/auth/profile")).json();
  await page
    .getByRole("button", { name: "Create a persona", exact: true })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Persona name", exact: true })
    .fill("Copied account persona");
  await page.getByRole("radio", { name: /Use my account details/ }).check();
  await page
    .getByRole("button", { name: "Create persona", exact: true })
    .click();
  await expect(page).toHaveURL(/\/persona\/[a-f0-9-]+$/);
  await expect(
    page.getByText("john@example.com", { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await page
    .getByRole("textbox", { name: "First name", exact: true })
    .fill("Taylor");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("persona@example.com");
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(
    page.getByText("persona@example.com", { exact: true }),
  ).toBeVisible();
  expect(await (await page.request.get("/api/v1/auth/profile")).json()).toEqual(
    before,
  );
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  const profile = page.locator('[aria-label="Account profile details"]');
  await expect(profile).toContainText("John Doe");
  await expect(profile).toContainText("john@example.com");
  await expect(profile).toContainText("03001234567");
  await expect(profile).not.toContainText("persona@example.com");
  await page.screenshot({
    path: info.outputPath("account-profile.png"),
    fullPage: true,
  });
});
