import type React from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className="tab"
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
