"use client";

import { LANGUAGES, type LanguageCode } from "@/lib/languages";

export function LanguageSelect({ value, onChange, label, id }: {
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  label: string;
  id?: string;
}) {
  return <label className="field" htmlFor={id}>
    <span className="field-label">{label}</span>
    <select id={id} className="field-control" value={value} onChange={(event) => onChange(event.target.value as LanguageCode)}>
      {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
    </select>
  </label>;
}
