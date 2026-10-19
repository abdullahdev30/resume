import { useState } from "react";
import Modal from "./Modal";
import { useResume } from "../store/resume";
import { presets, dimensions } from "../templates/catalog";
const factors = { mm: 1, cm: 10, in: 25.4, px: 25.4 / 96 };
export default function PageSetup({ onClose }: { onClose: () => void }) {
  const page = useResume((s) => s.page);
  const update = useResume((s) => s.update);
  const [unit, setUnit] = useState<keyof typeof factors>("mm");
  const [error, setError] = useState("");
  const f = factors[unit];
  function number(value: number) {
    return Math.round((value / f) * 100) / 100;
  }
  const [w, h] = dimensions(page);
  const invalid =
    page.margins.left + page.margins.right > w - 20 ||
    page.margins.top + page.margins.bottom > h - 20;
  function setMargin(side: keyof typeof page.margins, v: number) {
    const margins = { ...page.margins, [side]: v * f };
    if (v >= 0 && v * f <= 200) update({ page: { ...page, margins } });
  }
  return (
    <Modal
      title="Page setup"
      onClose={() => {
        if (!invalid) onClose();
        else
          setError("Reduce margins to leave at least 20 mm of writing space.");
      }}
    >
      <div className="form-grid">
        <label>
          Paper size
          <select
            value={page.preset}
            onChange={(e) => {
              const p = presets[e.target.value];
              update({
                page: {
                  ...page,
                  preset: e.target.value,
                  ...(p ? { width: p[0], height: p[1] } : {}),
                },
              });
            }}
          >
            {Object.keys(presets).map((p) => (
              <option key={p}>{p}</option>
            ))}
            <option>Custom</option>
          </select>
        </label>
        <label>
          Units
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as keyof typeof factors)}
          >
            {Object.keys(factors).map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        <label>
          Width ({unit})
          <input
            type="number"
            step="0.1"
            min={50 / f}
            max={1000 / f}
            value={number(page.width)}
            onChange={(e) => {
              const v = +e.target.value * f;
              if (v >= 50 && v <= 1000)
                update({ page: { ...page, preset: "Custom", width: v } });
            }}
          />
        </label>
        <label>
          Height ({unit})
          <input
            type="number"
            step="0.1"
            min={50 / f}
            max={1000 / f}
            value={number(page.height)}
            onChange={(e) => {
              const v = +e.target.value * f;
              if (v >= 50 && v <= 1000)
                update({ page: { ...page, preset: "Custom", height: v } });
            }}
          />
        </label>
      </div>
      <fieldset>
        <legend>Orientation</legend>
        {(["portrait", "landscape"] as const).map((o) => (
          <label className="inline-label" key={o}>
            <input
              type="radio"
              name="orientation"
              checked={page.orientation === o}
              onChange={() => update({ page: { ...page, orientation: o } })}
            />
            {o[0]!.toUpperCase() + o.slice(1)}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Margins ({unit})</legend>
        <div className="preset-buttons">
          {(
            [
              ["Narrow", 12.7],
              ["Normal", 19],
              ["Wide", 25.4],
            ] as const
          ).map(([name, value]) => (
            <button
              key={name}
              onClick={() =>
                update({
                  page: {
                    ...page,
                    margins: {
                      top: +value,
                      bottom: +value,
                      left: +value,
                      right: +value,
                    },
                  },
                })
              }
            >
              {name}
            </button>
          ))}
        </div>
        <div className="form-grid">
          {(Object.keys(page.margins) as (keyof typeof page.margins)[]).map(
            (side) => (
              <label key={side}>
                {side[0]!.toUpperCase() + side.slice(1)}
                <input
                  type="number"
                  min="0"
                  max={200 / f}
                  step="0.1"
                  value={number(page.margins[side])}
                  onChange={(e) => setMargin(side, +e.target.value)}
                />
              </label>
            ),
          )}
        </div>
      </fieldset>
      <label className="inline-label">
        Page color
        <input
          type="color"
          value={page.color}
          onChange={(e) => update({ page: { ...page, color: e.target.value } })}
        />
      </label>
      {(invalid || error) && (
        <p role="alert" className="error">
          Reduce margins to leave at least 20 mm of writing space.
        </p>
      )}
      <p className="muted">
        Changes apply to the whole resume and update the page immediately.
      </p>
      <div className="dialog-actions">
        <button className="primary" disabled={invalid} onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
