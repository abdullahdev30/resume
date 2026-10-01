import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { ResumeItemOffsets } from "./pagination";
import type { ElementStyle, ResumeData } from "./TemplateOne";

export function AdditionalSections({
  data,
  accentColor,
  includeLanguages = true,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  indexOffsets = {},
}: {
  data: ResumeData;
  accentColor: string;
  includeLanguages?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string) => void;
  elementStyles?: Record<string, ElementStyle>;
  indexOffsets?: ResumeItemOffsets;
}) {
  const hasContent = Boolean(
    data.projects?.length
    || data.certificates?.length
    || data.socialLinks?.length
    || (includeLanguages && data.languages.length),
  );
  if (!hasContent) return null;

  const getItemStyle = (id: string): CSSProperties => {
    const custom = elementStyles[id];
    return {
      fontWeight: custom?.isBold !== undefined ? (custom.isBold ? "bold" : "normal") : undefined,
      fontStyle: custom?.isItalic !== undefined ? (custom.isItalic ? "italic" : "normal") : undefined,
      textDecoration: custom?.isUnderline !== undefined ? (custom.isUnderline ? "underline" : "none") : undefined,
      textAlign: custom?.align,
      color: custom?.color,
      fontSize: custom?.fontSize ? `${custom.fontSize}pt` : undefined,
      lineHeight: custom?.lineHeight,
      fontFamily: custom?.fontFamily,
    };
  };
  const getItemClass = (id: string, baseClass = "") => {
    if (!onSelectElement) return baseClass;
    const selected = selectedElementId === id;
    return `${baseClass} cursor-pointer rounded-xs p-0.5 transition ${
      selected
        ? "ring-2 ring-[var(--primary)] ring-offset-1 bg-[var(--primary-tint)]"
        : "hover:ring-1 hover:ring-[var(--primary)]/50"
    }`.trim();
  };
  const select = (id: string, event: MouseEvent) => {
    event.stopPropagation();
    onSelectElement?.(id);
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 font-sans sm:grid-cols-2">
      {data.projects && data.projects.length > 0 && (
        <section className="resume-section min-w-0">
          <SectionTitle color={accentColor}>Projects</SectionTitle>
          <div className="space-y-3">
            {data.projects.map((project, index) => {
              const itemIndex = (indexOffsets.projects || 0) + index;
              const nameId = `project-${itemIndex}-name`;
              const descriptionId = `project-${itemIndex}-description`;
              const technologiesId = `project-${itemIndex}-technologies`;
              return (
                <div className="resume-item min-w-0" key={project.id || `${project.name}-${index}`}>
                  <div onClick={(event) => select(nameId, event)} className={getItemClass(nameId, "text-xs font-bold text-slate-900")} style={getItemStyle(nameId)}>{project.name}</div>
                  {project.description && <p onClick={(event) => select(descriptionId, event)} className={getItemClass(descriptionId, "mt-1 text-[11px] leading-relaxed text-slate-600")} style={getItemStyle(descriptionId)}>{project.description}</p>}
                  {project.technologies.length > 0 && <p onClick={(event) => select(technologiesId, event)} className={getItemClass(technologiesId, "mt-1 text-[10px] text-slate-500")} style={getItemStyle(technologiesId)}>{project.technologies.join(" · ")}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {data.certificates && data.certificates.length > 0 && (
        <section className="resume-section min-w-0">
          <SectionTitle color={accentColor}>Certifications</SectionTitle>
          <div className="space-y-2">
            {data.certificates.map((certificate, index) => {
              const itemIndex = (indexOffsets.certificates || 0) + index;
              const titleId = `certificate-${itemIndex}-title`;
              const issuerId = `certificate-${itemIndex}-issuer`;
              const dateId = `certificate-${itemIndex}-date`;
              return (
                <div className="resume-item min-w-0" key={certificate.id || `${certificate.title}-${index}`}>
                  <div onClick={(event) => select(titleId, event)} className={getItemClass(titleId, "text-xs font-bold text-slate-900")} style={getItemStyle(titleId)}>{certificate.title}</div>
                  <p className="text-[10px] text-slate-500">
                    {certificate.issuer && <span onClick={(event) => select(issuerId, event)} className={getItemClass(issuerId)} style={getItemStyle(issuerId)}>{certificate.issuer}</span>}
                    {certificate.issuer && certificate.date && " · "}
                    {certificate.date && <span onClick={(event) => select(dateId, event)} className={getItemClass(dateId)} style={getItemStyle(dateId)}>{certificate.date}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {includeLanguages && data.languages.length > 0 && (
        <section className="resume-section min-w-0">
          <SectionTitle color={accentColor}>Languages</SectionTitle>
          <p className="text-xs leading-relaxed text-slate-600">
            {data.languages.map((language, index) => {
              const id = `language-${(indexOffsets.languages || 0) + index}`;
              return (
                <span key={id}>
                  {index > 0 && " · "}
                  <span onClick={(event) => select(id, event)} className={getItemClass(id)} style={getItemStyle(id)}>{language}</span>
                </span>
              );
            })}
          </p>
        </section>
      )}

      {data.socialLinks && data.socialLinks.length > 0 && (
        <section className="resume-section min-w-0">
          <SectionTitle color={accentColor}>Links</SectionTitle>
          <div className="space-y-1 text-[11px] text-slate-600">
            {data.socialLinks.map((link, index) => {
              const itemIndex = (indexOffsets.socialLinks || 0) + index;
              const platformId = `social-${itemIndex}-platform`;
              const urlId = `social-${itemIndex}-url`;
              return (
                <div key={link.id || `${link.platform}-${index}`} className="resume-item min-w-0 break-all">
                  <span onClick={(event) => select(platformId, event)} className={getItemClass(platformId, "font-semibold text-slate-800")} style={getItemStyle(platformId)}>{link.platform}</span>
                  {": "}
                  <span onClick={(event) => select(urlId, event)} className={getItemClass(urlId)} style={getItemStyle(urlId)}>{link.url}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children, color }: { children: ReactNode; color: string }) {
  return (
    <h3
      className="mb-3 border-b pb-1 text-[11px] font-bold uppercase tracking-widest"
      style={{ borderColor: color, color }}
    >
      {children}
    </h3>
  );
}
