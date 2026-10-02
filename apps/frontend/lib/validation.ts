export type ValidationResult = { valid: true; value: string } | { valid: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[\p{L}\p{M}\s'’\-]*[\p{L}\p{M}])?$/u;
const UNSAFE_MARKUP_PATTERN = /<\/?[a-z][^>]*>|(?:javascript|data):/iu;

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function validateEmail(value: string, required = true): string | null {
  const normalized = normalizeEmail(value);
  if (!normalized) return required ? "Enter your email address." : null;
  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function normalizePlainText(value: string, maxLength?: number): string {
  const withoutMarkup = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/giu, "")
    .replace(/<[^>]+>/gu, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "");
  const normalized = withoutMarkup.replace(/[ \t]+/gu, " ").trim();
  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

export function validateName(value: string, label = "Name", required = true): string | null {
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (!normalized) return required ? `${label} is required.` : null;
  if (normalized.length < 2) return `${label} must be at least 2 characters.`;
  if (normalized.length > 100) return `${label} must be 100 characters or fewer.`;
  if (!NAME_PATTERN.test(normalized)) {
    return `${label} may contain letters, spaces, hyphens, and apostrophes.`;
  }
  return null;
}

export function validateText(
  value: string,
  options: { label: string; required?: boolean; minLength?: number; maxLength: number },
): string | null {
  const normalized = value.trim();
  if (!normalized) return options.required ? `${options.label} is required.` : null;
  if (UNSAFE_MARKUP_PATTERN.test(value)) return `${options.label} must not contain HTML or script content.`;
  if (options.minLength && normalized.length < options.minLength) {
    return `${options.label} must be at least ${options.minLength} characters.`;
  }
  if (normalized.length > options.maxLength) {
    return `${options.label} must be ${options.maxLength} characters or fewer.`;
  }
  return null;
}

function isDomain(hostname: string, expectedDomain: string): boolean {
  return hostname === expectedDomain || hostname.endsWith(`.${expectedDomain}`);
}

export function normalizeHttpUrl(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Enter a URL." };

  if (/^(?:javascript|data|vbscript|file):/iu.test(trimmed)) {
    return { valid: false, error: "Only public HTTP or HTTPS links are allowed." };
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//iu.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTP or HTTPS links are allowed." };
    }
    if (!parsed.hostname || parsed.username || parsed.password) {
      return { valid: false, error: "Enter a valid public URL without embedded credentials." };
    }
    return { valid: true, value: parsed.toString() };
  } catch {
    return { valid: false, error: "Enter a valid URL, for example https://example.com." };
  }
}

export function validateUrl(
  value: string,
  options: { required?: boolean; platform?: string } = {},
): string | null {
  if (!value.trim()) return options.required ? "Enter a URL." : null;
  const normalized = normalizeHttpUrl(value);
  if (!normalized.valid) return normalized.error;

  const parsed = new URL(normalized.value);
  const platform = options.platform?.trim().toLocaleLowerCase() || "";
  if (platform.includes("linkedin")) {
    if (!isDomain(parsed.hostname, "linkedin.com") || !/^\/in\/[^/]+/iu.test(parsed.pathname)) {
      return "Enter a LinkedIn profile URL on linkedin.com/in/.";
    }
  }
  if (platform.includes("github") && !isDomain(parsed.hostname, "github.com")) {
    return "Enter a GitHub URL on github.com.";
  }
  return null;
}

export function normalizeUrl(value: string): string {
  if (!value.trim()) return "";
  const result = normalizeHttpUrl(value);
  return result.valid ? result.value : value.trim();
}

function localToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function validateDate(value: string, options: { label: string; required?: boolean; allowFuture?: boolean }): string | null {
  if (!value) return options.required ? `${options.label} is required.` : null;
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00`))) {
    return `Enter a valid ${options.label.toLocaleLowerCase()}.`;
  }
  if (!options.allowFuture && value > localToday()) {
    return `${options.label} cannot be in the future.`;
  }
  return null;
}

export function validateEndDate(
  endDate: string,
  startDate: string,
  options: { current?: boolean; label?: string; allowFuture?: boolean } = {},
): string | null {
  if (options.current || !endDate) return null;
  const dateError = validateDate(endDate, {
    label: options.label || "End date",
    allowFuture: options.allowFuture,
  });
  if (dateError) return dateError;
  if (startDate && endDate < startDate) return "End date must be on or after the start date.";
  return null;
}

export function validateDatePeriod(value: string, required = false): string | null {
  const normalized = value.trim();
  if (!normalized) return required ? "Enter a date range." : null;
  const [startDate = "", endValue = ""] = normalized.split(/\s+-\s+/u, 2);
  const startError = validateDate(startDate, { label: "Start date", required: true });
  if (startError) return "Use YYYY-MM-DD - YYYY-MM-DD, or YYYY-MM-DD - Present.";
  const current = endValue.toLocaleLowerCase() === "present";
  if (!current && !endValue) return "Add an end date or use Present.";
  return validateEndDate(current ? "" : endValue, startDate, { current });
}

export function validateFile(
  file: File,
  options: { allowedTypes: readonly string[]; maxBytes: number; label?: string },
): string | null {
  const label = options.label || "File";
  if (!options.allowedTypes.includes(file.type)) return `${label} type is not supported.`;
  if (file.size > options.maxBytes) {
    return `${label} must be ${Math.round(options.maxBytes / (1024 * 1024))} MB or smaller.`;
  }
  return null;
}
