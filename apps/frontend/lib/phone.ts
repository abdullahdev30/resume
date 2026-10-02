import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "PK";
export const PHONE_COUNTRIES = getCountries();

function compactPhoneInput(value: string): string {
  const trimmed = value.trim().replace(/^00/u, "+");
  const digits = trimmed.replace(/\D/gu, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

function internationalCandidate(value: string, defaultCountry: CountryCode): string {
  const compact = compactPhoneInput(value);
  if (!compact || compact.startsWith("+") || compact.startsWith("0")) return compact;

  const defaultCallingCode = getCountryCallingCode(defaultCountry);
  if (compact.startsWith(defaultCallingCode) && compact.length >= 8) return `+${compact}`;

  const callingCodes = [...new Set(PHONE_COUNTRIES.map(getCountryCallingCode))]
    .sort((left, right) => right.length - left.length);
  const detectedCode = callingCodes.find((code) => compact.startsWith(code) && compact.length - code.length >= 7);
  return detectedCode ? `+${compact}` : compact;
}

export type PhoneAnalysis = {
  country: CountryCode;
  e164: string;
  formatted: string;
  valid: boolean;
};

export function analyzePhoneNumber(value: string, defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY): PhoneAnalysis {
  const candidate = internationalCandidate(value, defaultCountry);
  const parsed = candidate.startsWith("+")
    ? parsePhoneNumberFromString(candidate)
    : parsePhoneNumberFromString(candidate, defaultCountry);
  const country = parsed?.country || defaultCountry;
  const formatter = candidate.startsWith("+") ? new AsYouType() : new AsYouType(country);
  const formatted = candidate ? formatter.input(candidate) : "";
  return {
    country,
    e164: parsed?.isValid() ? parsed.number : "",
    formatted,
    valid: Boolean(parsed?.isValid()),
  };
}

export function formatPhoneNumber(value: string, defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY): string {
  if (!value) return "";
  const analysis = analyzePhoneNumber(value, defaultCountry);
  if (analysis.valid) {
    const parsed = parsePhoneNumberFromString(analysis.e164);
    return parsed?.formatInternational() || analysis.formatted;
  }
  return analysis.formatted || value;
}

export function countryFlag(country: CountryCode): string {
  return country
    .toUpperCase()
    .replace(/./gu, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}
