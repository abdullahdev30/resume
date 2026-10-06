import { AdditionalSections } from "./AdditionalSections";
import { ResumePage } from "./ResumePage";
import { createTemplateTools, detailLines, ResumePhoto } from "./templatePrimitives";
import { getResumePageStyle, type TemplateProps } from "./TemplateOne";

export default function TemplateNine({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  onPhotoUpload,
  indexOffsets = {},
}: TemplateProps) {
  const accent = data.primaryColor || "#e87520";
  const tools = createTemplateTools({ data, elementStyles, selectedElementId, onSelectElement, selectionColor: accent });

  return (
    <ResumePage
      data={data}
      className="mx-auto bg-white text-slate-800 shadow-xl"
      style={{
        ...getResumePageStyle(data),
        ...tools.selectionStyle,
        padding: `${data.pageMargin ?? 13}mm`,
        fontFamily: data.fontFamily || "Georgia, serif",
      }}
    >
      <header>
        <ResumePhoto data={data} onPhotoUpload={onPhotoUpload} className="mx-auto h-24 w-24 rounded-full border border-slate-200 shadow-sm" label={`${data.fullName || "Candidate"} portrait`} />
        <h1 onClick={(event) => tools.select("fullName", event)} className={tools.itemClass("fullName", "mt-7 text-[17pt] font-normal uppercase tracking-[0.12em]")} style={tools.itemStyle("fullName")}>{data.fullName}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 border-y py-2 text-[7.5pt] text-slate-500" style={{ borderColor: accent }}>
          <span onClick={(event) => tools.select("contact-phone", event)} className={tools.itemClass("contact-phone")} style={tools.itemStyle("contact-phone")}>{data.phone}</span>
          <span style={{ color: accent }}>•</span>
          <span onClick={(event) => tools.select("contact-email", event)} className={tools.itemClass("contact-email")} style={tools.itemStyle("contact-email")}>{data.email}</span>
          <span style={{ color: accent }}>•</span>
          <span onClick={(event) => tools.select("contact-location", event)} className={tools.itemClass("contact-location")} style={tools.itemStyle("contact-location")}>{data.location}</span>
        </div>
        {data.jobTitle && <p onClick={(event) => tools.select("jobTitle", event)} className={tools.itemClass("jobTitle", "mt-3 text-center text-[8pt] font-semibold uppercase tracking-[0.16em]")} style={tools.itemStyle("jobTitle", accent)}>{data.jobTitle}</p>}
        {data.summary && <p onClick={(event) => tools.select("summary", event)} className={tools.itemClass("summary", "mx-auto mt-3 max-w-[92%] text-center text-[8.5pt] leading-relaxed")} style={tools.itemStyle("summary", accent)}>{data.summary}</p>}
      </header>

      <div className="mt-5 space-y-6">
        {data.experience.length > 0 && (
          <section className="resume-section">
            <SectionTitle>Work History</SectionTitle>
            <div className="space-y-5 pt-3">
              {data.experience.map((experience, index) => {
                const itemIndex = (indexOffsets.experience || 0) + index;
                return (
                  <article key={experience.id || itemIndex} className="resume-item">
                    <span className="inline-block px-2 py-1 text-[7pt] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>{experience.period}</span>
                    <p className="mt-2 text-[8.5pt]">
                      <span onClick={(event) => tools.select(`exp-${itemIndex}-role`, event)} className={tools.itemClass(`exp-${itemIndex}-role`, "font-bold")} style={tools.itemStyle(`exp-${itemIndex}-role`)}>{experience.role}</span>
                      {experience.company && " | "}
                      <span onClick={(event) => tools.select(`exp-${itemIndex}-company`, event)} className={tools.itemClass(`exp-${itemIndex}-company`)} style={tools.itemStyle(`exp-${itemIndex}-company`)}>{experience.company}</span>
                    </p>
                    {experience.details && (
                      <ul onClick={(event) => tools.select(`exp-${itemIndex}-details`, event)} className={tools.itemClass(`exp-${itemIndex}-details`, "mt-2 space-y-1 pl-5 text-[8pt] leading-relaxed text-slate-600")} style={tools.itemStyle(`exp-${itemIndex}-details`)}>
                        {detailLines(experience.details).map((line, lineIndex) => <li key={lineIndex} className="list-disc pl-1 marker:text-[var(--template-selection)]">{line}</li>)}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {data.education && data.education.length > 0 && (
          <section className="resume-section">
            <SectionTitle>Education</SectionTitle>
            <div className="space-y-3 pt-3">
              {data.education.map((education, index) => {
                const itemIndex = (indexOffsets.education || 0) + index;
                return (
                  <article key={education.id || itemIndex} className="resume-item flex items-start justify-between gap-4 text-[8.5pt]">
                    <div>
                      <h3 onClick={(event) => tools.select(`edu-${itemIndex}-degree`, event)} className={tools.itemClass(`edu-${itemIndex}-degree`, "font-bold")} style={tools.itemStyle(`edu-${itemIndex}-degree`)}>{education.degree}</h3>
                      <p onClick={(event) => tools.select(`edu-${itemIndex}-inst`, event)} className={tools.itemClass(`edu-${itemIndex}-inst`, "mt-1 text-slate-600")} style={tools.itemStyle(`edu-${itemIndex}-inst`)}>{education.institution}{education.grade ? ` · ${education.grade}` : ""}</p>
                    </div>
                    <span className="shrink-0 font-semibold" style={{ color: accent }}>{education.period}</span>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {data.skills.length > 0 && (
          <section className="resume-section">
            <SectionTitle>Skills</SectionTitle>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 text-[8pt]">
              {data.skills.map((skill, index) => {
                const id = `skill-${(indexOffsets.skills || 0) + index}`;
                return <span key={id} onClick={(event) => tools.select(id, event)} className={tools.itemClass(id, "before:mr-1 before:content-['•']")} style={{ color: accent, ...tools.itemStyle(id) }}>{skill}</span>;
              })}
            </div>
          </section>
        )}

        <AdditionalSections data={data} accentColor={accent} includeLanguages selectedElementId={selectedElementId} onSelectElement={onSelectElement} elementStyles={elementStyles} indexOffsets={indexOffsets} />
      </div>
    </ResumePage>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="inline-block bg-slate-100 px-4 py-1.5 text-[9pt] font-bold uppercase tracking-[0.12em] text-slate-800">{children}</h2>;
}
