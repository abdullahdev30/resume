import { memo } from "react";
import type { Template } from "../templates/catalog";
export default memo(function Thumbnail({ template }: { template: Template }) {
  return (
    <div
      className={`thumbnail ${template.centered ? "centered" : ""} ${template.columns ? "two-col" : ""}`}
      style={
        {
          fontFamily: template.font,
          "--template-accent": template.accent,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div className="mini-name">ALEX MORGAN</div>
      <div className="mini-role">Product Manager</div>
      <div className="mini-contact">
        San Francisco, CA · alex.morgan@email.com
      </div>
      <div className="mini-body">
        {["PROFILE", "EXPERIENCE", "EDUCATION", "SKILLS"].map((s, i) => (
          <section key={s}>
            <h4>{s}</h4>
            {i === 1 && <strong>Senior Product Manager</strong>}
            {Array.from({ length: i === 1 ? 7 : i === 0 ? 3 : 2 }, (_, j) => (
              <span
                className="mini-line"
                style={{ width: `${j % 3 === 2 ? 72 : 100}%` }}
                key={j}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
});
