import { AdditionalSections } from "./AdditionalSections";
import { ResumePage } from "./ResumePage";
import { createTemplateTools } from "./templatePrimitives";
import { getResumePageStyle, type TemplateProps } from "./TemplateOne";

export default function TemplateSeven({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  indexOffsets = {},
}: TemplateProps) {
  const accent = data.primaryColor || "#0b2742";
  const tools = createTemplateTools({ data, elementStyles, selectedElementId, onSelectElement, selectionColor: accent });

  return (
    <ResumePage
      data={data}
      className="mx-auto bg-white font-sans text-slate-950 shadow-xl"
      style={{
        ...getResumePageStyle(data),
        ...tools.selectionStyle,
        padding: `${data.pageMargin ?? 16}mm`,
        fontFamily: data.fontFamily || "Arial, sans-serif",
      }}
    >
      <header className="mb-7">
        <h1
          onClick={(event) => tools.select("fullName", event)}
          className={tools.itemClass("fullName", "text-[32pt] font-normal leading-none tracking-wide")}
          style={tools.itemStyle("fullName")}
        >
          {data.fullName}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 text-[11pt] text-slate-800">
          <span onClick={(event) => tools.select("contact-email", event)} className={tools.itemClass("contact-email")} style={tools.itemStyle("contact-email")}>{data.email}</span>
          <span aria-hidden="true">•</span>
          <span onClick={(event) => tools.select("contact-phone", event)} className={tools.itemClass("contact-phone")} style={tools.itemStyle("contact-phone")}>{data.phone}</span>
          <span aria-hidden="true">•</span>
          <span onClick={(event) => tools.select("contact-location", event)} className={tools.itemClass("contact-location")} style={tools.itemStyle("contact-location")}>{data.location}</span>
        </div>
        {data.jobTitle && (
          <p onClick={(event) => tools.select("jobTitle", event)} className={tools.itemClass("jobTitle", "mt-2 text-[10pt] font-semibold uppercase tracking-[0.16em]")} style={tools.itemStyle("jobTitle", accent)}>{data.jobTitle}</p>
        )}
      </header>

      <div className="space-y-6">
        {data.education && data.education.length > 0 && (
          <section className="resume-section">
            <SectionTitle>Education</SectionTitle>
            <div className="space-y-4 pt-2">
              {data.education.map((education, index) => {
                const itemIndex = (indexOffsets.education || 0) + index;
                return (
                  <article key={education.id || itemIndex} className="resume-item">
                    <div className="flex items-start justify-between gap-5 text-[10.5pt]">
                      <h3 onClick={(event) => tools.select(`edu-${itemIndex}-inst`, event)} className={tools.itemClass(`edu-${itemIndex}-inst`, "font-bold")} style={tools.itemStyle(`edu-${itemIndex}-inst`)}>{education.institution}</h3>
                      <span className="max-w-36 text-right font-bold">{education.period}</span>
                    </div>
                    <p onClick={(event) => tools.select(`edu-${itemIndex}-degree`, event)} className={tools.itemClass(`edu-${itemIndex}-degree`, "ml-3 mt-2 text-[10.5pt] italic")} style={tools.itemStyle(`edu-${itemIndex}-degree`)}>
                      {education.degree}{education.grade ? `, ${education.grade}` : ""}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {data.summary && (
          <section className="resume-section">
            <SectionTitle>Professional Summary</SectionTitle>
            <p onClick={(event) => tools.select("summary", event)} className={tools.itemClass("summary", "pt-2 text-[10.5pt] leading-relaxed")} style={tools.itemStyle("summary")}>{data.summary}</p>
          </section>
        )}

        {data.experience.length > 0 && (
          <section className="resume-section">
            <SectionTitle>Professional Experience</SectionTitle>
            <div className="space-y-4 pt-2">
              {data.experience.map((experience, index) => {
                const itemIndex = (indexOffsets.experience || 0) + index;
                return (
                  <article key={experience.id || itemIndex} className="resume-item text-[10.5pt]">
                    <div className="flex items-baseline justify-between gap-5">
                      <h3 onClick={(event) => tools.select(`exp-${itemIndex}-company`, event)} className={tools.itemClass(`exp-${itemIndex}-company`, "font-bold")} style={tools.itemStyle(`exp-${itemIndex}-company`)}>{experience.company}</h3>
                      <span className="shrink-0 font-bold">{experience.period}</span>
                    </div>
                    <p onClick={(event) => tools.select(`exp-${itemIndex}-role`, event)} className={tools.itemClass(`exp-${itemIndex}-role`, "ml-3 mt-1 italic")} style={tools.itemStyle(`exp-${itemIndex}-role`)}>{experience.role}</p>
                    {experience.details && <p onClick={(event) => tools.select(`exp-${itemIndex}-details`, event)} className={tools.itemClass(`exp-${itemIndex}-details`, "ml-6 mt-1 whitespace-pre-line leading-relaxed before:mr-3 before:font-bold before:content-['•']")} style={tools.itemStyle(`exp-${itemIndex}-details`, accent)}>{experience.details}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <AdditionalSections data={data} accentColor={accent} includeLanguages selectedElementId={selectedElementId} onSelectElement={onSelectElement} elementStyles={elementStyles} indexOffsets={indexOffsets} />

        {data.skills.length > 0 && (
          <section className="resume-section">
            <SectionTitle>Skills</SectionTitle>
            <p className="pt-2 text-[10.5pt] font-semibold leading-relaxed">
              {data.skills.map((skill, index) => {
                const id = `skill-${(indexOffsets.skills || 0) + index}`;
                return <span key={id}>{index > 0 && " · "}<span onClick={(event) => tools.select(id, event)} className={tools.itemClass(id)} style={tools.itemStyle(id)}>{skill}</span></span>;
              })}
            </p>
          </section>
        )}
      </div>
    </ResumePage>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="border-b border-slate-900 pb-1 text-[11pt] font-normal uppercase tracking-[0.14em]">{children}</h2>;
}
