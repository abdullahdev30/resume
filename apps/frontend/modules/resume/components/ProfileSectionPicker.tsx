"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { toast } from "@/components/feedback/Toast";

export interface ProfilePickerItem {
  id: string;
  label: string;
  detail?: string;
  selected: boolean;
}

export function ProfileSectionPicker({
  title,
  items,
  onAdd,
  onRemove,
}: {
  title: string;
  items: ProfilePickerItem[];
  onAdd: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      `${item.label} ${item.detail || ""}`.toLocaleLowerCase().includes(normalized),
    );
  }, [items, query]);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3">
      <div>
        <h3 className="text-xs font-extrabold text-[var(--text)]">Add from profile · {title}</h3>
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
          Choose saved profile entries. Removing one here affects only this resume.
        </p>
      </div>
      {items.length > 5 && (
        <label className="relative block">
          <span className="sr-only">Search {title}</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-xs outline-none focus:border-[var(--primary)]"
          />
        </label>
      )}
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.selected) {
                onRemove?.(item.id);
                toast.info(`${item.label} was removed from this resume only.`);
              } else {
                onAdd(item.id);
                toast.success(`${item.label} was added to this resume.`);
              }
            }}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-xs transition hover:border-[var(--primary)]"
          >
            <span className="min-w-0">
              <span className="block truncate font-bold text-[var(--text)]">{item.label}</span>
              {item.detail && <span className="block truncate text-[10px] text-[var(--text-muted)]">{item.detail}</span>}
            </span>
            <span className="shrink-0 text-[10px] font-bold text-[var(--primary)]">{item.selected ? "Remove" : "+ Add"}</span>
          </button>
        ))}
        {visibleItems.length === 0 && <p className="py-3 text-center text-xs text-[var(--text-muted)]">No matches.</p>}
      </div>
    </section>
  );
}
