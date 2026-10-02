"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

import {
  analyzePhoneNumber,
  countryFlag,
  DEFAULT_PHONE_COUNTRY,
  formatPhoneNumber,
  PHONE_COUNTRIES,
} from "../../lib/phone";
import { FormField } from "./FormField";

const PRIORITY_COUNTRIES: CountryCode[] = ["PK", "US", "GB", "AE", "SA", "QA", "KW", "BH", "OM", "AU"];

function countryName(country: CountryCode): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(country) || country;
  } catch {
    return country;
  }
}

const COUNTRY_OPTIONS = PHONE_COUNTRIES
  .map((country) => ({
    country,
    name: countryName(country),
    callingCode: getCountryCallingCode(country),
  }))
  .sort((left, right) => {
    const leftPriority = PRIORITY_COUNTRIES.indexOf(left.country);
    const rightPriority = PRIORITY_COUNTRIES.indexOf(right.country);
    if (leftPriority >= 0 || rightPriority >= 0) {
      if (leftPriority < 0) return 1;
      if (rightPriority < 0) return -1;
      return leftPriority - rightPriority;
    }
    return left.name.localeCompare(right.name);
  });

type PhoneInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  required?: boolean;
  optional?: boolean;
  defaultCountry?: CountryCode;
  autoFocus?: boolean;
  onFocus?: () => void;
  className?: string;
  id?: string;
};

export function PhoneInput({
  value,
  onValueChange,
  label = "Phone number",
  required = false,
  optional = false,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  autoFocus,
  onFocus,
  className = "",
  id,
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const initial = analyzePhoneNumber(value, defaultCountry);
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [displayValue, setDisplayValue] = useState(() => formatPhoneNumber(value, initial.country));
  const [search, setSearch] = useState("");
  const [touched, setTouched] = useState(false);
  const analysis = analyzePhoneNumber(displayValue, country);
  const error = !displayValue.trim()
    ? required ? "Enter a phone number." : null
    : analysis.valid ? null : `Enter a valid phone number for ${countryName(country)}.`;
  const visibleError = touched ? error || undefined : undefined;

  useEffect(() => {
    inputRef.current?.setCustomValidity(error || "");
  }, [error]);

  useEffect(() => {
    if (!value) {
      if (displayValue) setDisplayValue("");
      return;
    }
    const current = analyzePhoneNumber(displayValue, country);
    if (current.e164 === value) return;
    const external = analyzePhoneNumber(value, country);
    setCountry(external.country);
    setDisplayValue(formatPhoneNumber(value, external.country));
  }, [value]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((option) =>
      `${option.name} ${option.country} +${option.callingCode}`.toLocaleLowerCase().includes(query),
    );
  }, [search]);

  const updateValue = (raw: string, selectedCountry = country) => {
    const next = analyzePhoneNumber(raw, selectedCountry);
    setCountry(next.country);
    setDisplayValue(next.formatted);
    onValueChange(next.valid ? next.e164 : next.formatted);
  };

  const chooseCountry = (nextCountry: CountryCode) => {
    const current = analyzePhoneNumber(displayValue, country);
    const nationalNumber = current.e164
      ? parsePhoneNumberFromString(current.e164)?.nationalNumber || ""
      : displayValue.replace(/\D/gu, "").replace(/^0/u, "");
    setCountry(nextCountry);
    setSearch("");
    menuRef.current?.removeAttribute("open");
    updateValue(nationalNumber, nextCountry);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <FormField
      id={inputId}
      label={label}
      optional={optional}
      error={visibleError}
      hint={!visibleError ? "Select a country, then enter or paste the complete number." : undefined}
    >
      <div className="phone-input-wrap">
        <details className="phone-country" ref={menuRef}>
          <summary aria-label={`Country: ${countryName(country)}, +${getCountryCallingCode(country)}`}>
            <span aria-hidden="true">{countryFlag(country)}</span>
            <span>+{getCountryCallingCode(country)}</span>
          </summary>
          <div className="phone-country-menu">
            <label className="phone-country-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search countries</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country or code"
                autoComplete="off"
              />
            </label>
            <div className="phone-country-options" role="listbox" aria-label="Countries">
              {filteredCountries.map((option) => (
                <button
                  key={option.country}
                  type="button"
                  role="option"
                  aria-selected={option.country === country}
                  onClick={() => chooseCountry(option.country)}
                >
                  <span aria-hidden="true">{countryFlag(option.country)}</span>
                  <span>{option.name}</span>
                  <span>+{option.callingCode}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && <p>No countries found.</p>}
            </div>
          </div>
        </details>
        <input
          ref={inputRef}
          id={inputId}
          type="tel"
          className={["field-control", "phone-number-control", className].filter(Boolean).join(" ")}
          value={displayValue}
          required={required}
          autoFocus={autoFocus}
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={Boolean(visibleError)}
          aria-describedby={visibleError ? `${inputId}-error` : `${inputId}-hint`}
          placeholder="+92 300 1234567"
          onFocus={onFocus}
          onChange={(event) => updateValue(event.target.value)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            if (!pasted) return;
            event.preventDefault();
            updateValue(pasted);
          }}
          onBlur={() => {
            setTouched(true);
            const normalized = analyzePhoneNumber(displayValue, country);
            if (normalized.valid) {
              setDisplayValue(formatPhoneNumber(normalized.e164, normalized.country));
              onValueChange(normalized.e164);
            }
          }}
          onInvalid={(event) => {
            event.preventDefault();
            setTouched(true);
          }}
        />
      </div>
    </FormField>
  );
}
