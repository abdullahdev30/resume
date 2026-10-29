import { expect, test, type Page } from "@playwright/test";

async function fillLogin(
  page: Page,
  email = "john@example.com",
  password = "Password123!",
) {
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

async function fillOtp(page: Page, value = "123456") {
  for (let index = 0; index < value.length; index++) {
    await page
      .getByRole("textbox", { name: `Digit ${index + 1}`, exact: true })
      .fill(value[index]!);
  }
}

test("all auth screens open, links work, free access stays available", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "login",
    "register",
    "forgot-password",
    "verify-email",
    "verify-otp-recovery",
    "change-password",
    "reset-password",
    "verified",
  ]) {
    await page.goto(`/auth/${route}`);
    await expect(page.locator(".auth-form-card")).toBeVisible();
  }
  await page.goto("/auth/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/auth\/forgot-password$/);
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await page.getByRole("link", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/register$/);
  await page.goto("/auth/login");
  await page
    .getByRole("link", { name: "Continue free without an account" })
    .click();
  await expect(page).toHaveURL(/\/builder$/);
  expect(errors).toEqual([]);
});

test("login distinguishes credentials, provider failure, and unverified email", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await fillLogin(page, "john@example.com", "incorrect");
  await expect(page.locator(".auth-form-card")).toContainText(
    "Invalid email or password.",
  );
  await fillLogin(page, "offline@example.com");
  await expect(page.locator(".auth-form-card")).toContainText(
    "Authentication service is temporarily unavailable.",
  );
  await fillLogin(page, "unverified@example.com");
  await expect(page).toHaveURL(/\/auth\/verify-email$/);
  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveValue("unverified@example.com");
});

test("login uses backend HttpOnly cookies, preserves safe destination and supports logout", async ({
  page,
  context,
}) => {
  await page.goto("/auth/login?next=/builder");
  await fillLogin(page);
  await expect(page).toHaveURL(/\/builder$/);
  const cookies = await context.cookies();
  expect(
    cookies.filter((cookie) =>
      ["access_token", "refresh_token"].includes(cookie.name),
    ),
  ).toHaveLength(2);
  expect(
    cookies
      .filter((cookie) =>
        ["access_token", "refresh_token"].includes(cookie.name),
      )
      .every((cookie) => cookie.httpOnly),
  ).toBe(true);
  await page.reload();
  expect((await page.request.get("/api/v1/auth/me")).status()).toBe(200);
  expect((await page.request.post("/api/v1/auth/logout")).status()).toBe(200);
  expect(
    (await context.cookies()).some((cookie) => cookie.name === "access_token"),
  ).toBe(false);
  expect((await page.request.get("/api/v1/auth/me")).status()).toBe(401);
});

test("verification works on direct entry and refresh, supports resend and OTP editing", async ({
  page,
}) => {
  await page.goto("/auth/verify-email");
  await expect(
    page.getByRole("button", { name: "Verify code", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("john@example.com");
  await page.getByRole("button", { name: "Resend code", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveValue("john@example.com");
  await fillOtp(page, "999999");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page.locator(".auth-form-card")).toContainText(
    "Invalid or expired OTP.",
  );
  // Deleting a middle digit must leave later digits in their original positions.
  await page.getByRole("textbox", { name: "Digit 3", exact: true }).fill("");
  await expect(
    page.getByRole("textbox", { name: "Digit 4", exact: true }),
  ).toHaveValue("9");
  await expect(
    page.getByRole("button", { name: "Verify code", exact: true }),
  ).toBeDisabled();
});

test("password recovery completes through the backend and clears recovery state", async ({
  page,
}) => {
  await page.goto("/auth/forgot-password");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("john@example.com");
  await page
    .getByRole("button", { name: "Send recovery code", exact: true })
    .click();
  await expect(page).toHaveURL(/\/auth\/verify-otp-recovery$/);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveValue("john@example.com");
  await fillOtp(page);
  await page
    .getByRole("button", { name: "Verify recovery code", exact: true })
    .click();
  await expect(page).toHaveURL(/\/auth\/change-password$/);
  await page.reload();
  await page
    .getByLabel("New password", { exact: true })
    .fill("UpdatedPassword123!");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("UpdatedPassword123!");
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("auth_recovery_code")),
  ).toBeNull();
});

test("registration verifies email and creates a backend session", async ({
  page,
}) => {
  await page.goto("/auth/register");
  await page
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill("John Doe");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("john@example.com");
  await page
    .getByRole("textbox", { name: "Phone number", exact: true })
    .fill("03001234567");
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("Password123!");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/verify-email$/);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveValue("john@example.com");
  await fillOtp(page);
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  expect((await page.request.get("/api/v1/auth/me")).status()).toBe(200);
});

test("expired access cookies rotate through the backend before opening a protected screen", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "refresh_token",
      value: "old-refresh-token",
      url: "http://127.0.0.1:3101",
      httpOnly: true,
    },
  ]);
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "access_token")
      ?.value,
  ).toBe("new-access-token");
});
