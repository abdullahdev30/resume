import { AdditionalSections } from "./AdditionalSections";
import { ResumePage } from "./ResumePage";
import { createTemplateTools, detailLines, ResumePhoto } from "./templatePrimitives";
import { getResumePageStyle, type TemplateProps } from "./TemplateOne";

export default function TemplateTen({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  onPhotoUpload,
  indexOffsets = {},
}: TemplateProps) {
  const accent = data.primaryColor || "#2f6d82";
  const tools = createTemplateTools({ data, elementStyles, selectedElementId, onSelectElement, selectionColor: accent });

  return (
    <ResumePage
      data={data}
      className="mx-auto bg-white font-sans text-slate-700 shadow-xl"
      style={{ ...getResumePageStyle(data), ...tools.selectionStyle, padding: `${data.pageMargin ?? 8}mm`, fontFamily: data.fontFamily || "Georgia, serif" }}
    >
      <header className="px-8 py-6 text-center text-white" style={{ backgroundColor: accent }}>
        <h1 onClick={(event) => tools.select("fullName", event)} className={tools.itemClass("fullName", "text-[20pt] font-normal uppercase tracking-[0.2em]")} style={tools.itemStyle("fullName", "#ffffff")}>{data.fullName}</h1>
        <p onClick={(event) => tools.select("jobTitle", event)} className={tools.itemClass("jobTitle", "mt-2 text-[8pt] uppercase tracking-[0.16em] text-white/90")} style={tools.itemStyle("jobTitle", "#ffffff")}>{data.jobTitle}</p>
      </header>

      <div className="grid grid-cols-2 pt-6">
        <div className="space-y-7 border-r pr-6 text-right" style={{ borderColor: `${accent}55` }}>
          <ResumePhoto data={data} onPhotoUpload={onPhotoUpload} className="ml-auto mr-[-14mm] h-20 w-20 rounded-full border-4 border-white shadow-lg" label={`${data.fullName || "Candidate"} portrait`} />

          {data.summary && (
            <section className="resume-section">
              <SectionTitle align="right" accent={accent}>Summary</SectionTitle>
              <p onClick={(event) => tools.select("summary", event)} className={tools.itemClass("summary", "mt-3 text-[8pt] leading-relaxed text-slate-600")} style={tools.itemStyle("summary")}>{data.summary}</p>
            </section>
          )}

          {data.education && data.education.length > 0 && (
            <section className="resume-section">
              <SectionTitle align="right" accent={accent}>Education</SectionTitle>
              <div className="mt-3 space-y-4">
                {data.education.map((education, index) => {
                  const itemIndex = (indexOffsets.education || 0) + index;
                  return (
                    <article key={education.id || itemIndex} className="resume-item text-[8pt]">
                      <div className="font-semibold" style={{ color: accent }}>{education.period}</div>
                      <h3 onClick={(event) => tools.select(`edu-${itemIndex}-degree`, event)} className={tools.itemClass(`edu-${itemIndex}-degree`, "mt-1 font-bold text-slate-800")} style={tools.itemStyle(`edu-${itemIndex}-degree`)}>{education.degree}</h3>
                      <p onClick={(event) => tools.select(`edu-${itemIndex}-inst`, event)} className={tools.itemClass(`edu-${itemIndex}-inst`, "mt-1 text-slate-500")} style={tools.itemStyle(`edu-${itemIndex}-inst`)}>{education.institution}{education.grade ? ` · ${education.grade}` : ""}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {data.skills.length > 0 && (
            <section className="resume-section">
              <SectionTitle align="right" accent={accent}>Relevant Skills</SectionTitle>
              <div className="mt-4 space-y-2">
                {data.skills.map((skill, index) => {
                  const id = `skill-${(indexOffsets.skills || 0) + index}`;
                  const width = `${Math.max(48, 92 - (index % 6) * 7)}%`;
                  return (
                    <div key={id} className="grid grid-cols-[1fr_72px] items-center gap-3 text-[7.5pt]">
                      <span onClick={(event) => tools.select(id, event)} className={tools.itemClass(id)} style={tools.itemStyle(id)}>{skill}</span>
                      <span className="h-0.5 bg-slate-200"><span className="block h-full" style={{ width, backgroundColor: accent }} /></span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-7 pl-6">
          <section className="resume-section pt-1">
            <SectionTitle accent={accent}>Contact</SectionTitle>
            <div className="mt-3 space-y-1 text-[8pt]">
              <p><strong className="mr-2 font-bold text-slate-700">phone</strong><span onClick={(event) => tools.select("contact-phone", event)} className={tools.itemClass("contact-phone")} style={tools.itemStyle("contact-phone")}>{data.phone}</span></p>
              <p><strong className="mr-2 font-bold text-slate-700">email</strong><span onClick={(event) => tools.select("contact-email", event)} className={tools.itemClass("contact-email")} style={tools.itemStyle("contact-email")}>{data.email}</span></p>
              <p><strong className="mr-2 font-bold text-slate-700">address</strong><span onClick={(event) => tools.select("contact-location", event)} className={tools.itemClass("contact-location")} style={tools.itemStyle("contact-location")}>{data.location}</span></p>
            </div>
          </section>

          {data.experience.length > 0 && (
            <section className="resume-section">
              <SectionTitle accent={accent}>Professional Experience</SectionTitle>
              <div className="mt-4 space-y-5">
                {data.experience.map((experience, index) => {
                  const itemIndex = (indexOffsets.experience || 0) + index;
                  return (
                    <article key={experience.id || itemIndex} className="resume-item text-[8pt]">
                      <div className="font-semibold" style={{ color: accent }}>{experience.period}</div>
                      <h3 onClick={(event) => tools.select(`exp-${itemIndex}-role`, event)} className={tools.itemClass(`exp-${itemIndex}-role`, "mt-1 font-bold text-slate-800")} style={tools.itemStyle(`exp-${itemIndex}-role`)}>{experience.role}</h3>
                      <p onClick={(event) => tools.select(`exp-${itemIndex}-company`, event)} className={tools.itemClass(`exp-${itemIndex}-company`, "mt-0.5 font-semibold text-slate-600")} style={tools.itemStyle(`exp-${itemIndex}-company`)}>{experience.company}</p>
                      {experience.details && (
                        <ul onClick={(event) => tools.select(`exp-${itemIndex}-details`, event)} className={tools.itemClass(`exp-${itemIndex}-details`, "mt-2 space-y-1 pl-4 leading-relaxed text-slate-600")} style={tools.itemStyle(`exp-${itemIndex}-details`)}>
                          {detailLines(experience.details).map((line, lineIndex) => <li key={lineIndex} className="list-disc marker:text-[var(--template-selection)]">{line}</li>)}
                        </ul>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <AdditionalSections data={data} accentColor={accent} includeLanguages selectedElementId={selectedElementId} onSelectElement={onSelectElement} elementStyles={elementStyles} indexOffsets={indexOffsets} />
        </div>
      </div>
    </ResumePage>
  );
}

function SectionTitle({ children, accent, align = "left" }: { children: string; accent: string; align?: "left" | "right" }) {
  return (
    <h2 className={`flex items-center gap-3 text-[9pt] font-bold uppercase tracking-[0.16em] ${align === "right" ? "justify-end" : "justify-start"}`} style={{ color: accent }}>
      {align === "right" ? <>{children}<span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} /></> : <><span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />{children}</>}
    </h2>
  );
}
