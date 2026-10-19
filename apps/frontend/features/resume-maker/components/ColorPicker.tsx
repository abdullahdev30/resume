import { useState } from "react";
import Modal from "./Modal";
export default function ColorPicker({
  title,
  initial,
  recent,
  onApply,
  onClose,
}: {
  title: string;
  initial: string;
  recent: string[];
  onApply: (color: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Modal title={title} onClose={onClose}>
      <label>
        Choose a color
        <input
          aria-label="Color picker"
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#222222"}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <label className="hex-label">
        Hex color
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#263b50"
          maxLength={7}
        />
      </label>
      <div className="color-swatches">
        {Array.from(
          new Set([
            "#222222",
            "#263b50",
            "#ffffff",
            "#707070",
            "#8b3434",
            "#375b44",
            "#fff0a8",
            ...recent,
          ]),
        ).map((color) => (
          <button
            key={color}
            aria-label={`Choose ${color}`}
            title={color}
            style={{ background: color }}
            onClick={() => setValue(color)}
          />
        ))}
      </div>
      <div className="dialog-actions">
        <button onClick={onClose}>Cancel</button>
        <button
          className="primary"
          disabled={!/^#[0-9a-f]{6}$/i.test(value)}
          onClick={() => onApply(value)}
        >
          Apply
        </button>
      </div>
    </Modal>
  );
}
