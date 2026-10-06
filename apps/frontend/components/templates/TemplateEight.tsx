import { AdditionalSections } from "./AdditionalSections";
import { ResumePage } from "./ResumePage";
import { createTemplateTools, ResumePhoto } from "./templatePrimitives";
import { getResumePageStyle, type TemplateProps } from "./TemplateOne";

export default function TemplateEight({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  onPhotoUpload,
  indexOffsets = {},
}: TemplateProps) {
  const accent = data.primaryColor || "#f4dc00";
  const tools = createTemplateTools({ data, elementStyles, selectedElementId, onSelectElement, selectionColor: accent });

  return (
    <ResumePage
      data={data}
      className="mx-auto flex bg-white font-sans text-neutral-800 shadow-xl"
      style={{ ...getResumePageStyle(data), ...tools.selectionStyle, padding: 0, fontFamily: data.fontFamily || "Arial, sans-serif" }}
    >
      <aside className="flex w-[36%] flex-col bg-[#1d1d1d] text-white">
        <ResumePhoto data={data} onPhotoUpload={onPhotoUpload} className="h-[65mm] w-full bg-neutral-200" label={`${data.fullName || "Candidate"} portrait`} />
        <div className="space-y-10 px-6 py-7">
          {data.summary && (
            <section>
              <h2 className="mb-4 text-[12pt] font-light uppercase tracking-[0.22em] text-neutral-300">About me</h2>
              <p onClick={(event) => tools.select("summary", event)} className={tools.itemClass("summary", "text-[9pt] leading-relaxed text-neutral-300")} style={tools.itemStyle("summary", "#d4d4d4")}>{data.summary}</p>
            </section>
          )}
          {data.skills.length > 0 && (
            <section>
              <h2 className="mb-4 text-[12pt] font-light uppercase tracking-[0.22em] text-neutral-300">Skills</h2>
              <div className="space-y-3">
                {data.skills.map((skill, index) => {
                  const id = `skill-${(indexOffsets.skills || 0) + index}`;
                  const width = `${Math.max(45, 88 - (index % 5) * 9)}%`;
                  return (
                    <div key={id}>
                      <div onClick={(event) => tools.select(id, event)} className={tools.itemClass(id, "mb-1 text-[8.5pt] text-neutral-300")} style={tools.itemStyle(id, "#d4d4d4")}>{skill}</div>
                      <div className="h-0.5 bg-neutral-700"><div className="h-full bg-neutral-300" style={{ width }} /></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {data.languages.length > 0 && (
            <section>
              <h2 className="mb-3 text-[12pt] font-light uppercase tracking-[0.22em] text-neutral-300">Languages</h2>
              <div className="space-y-1 text-[8.5pt] text-neutral-300">
                {data.languages.map((language, index) => {
                  const id = `language-${(indexOffsets.languages || 0) + index}`;
                  return <p key={id} onClick={(event) => tools.select(id, event)} className={tools.itemClass(id)} style={tools.itemStyle(id, "#d4d4d4")}>{language}</p>;
                })}
              </div>
            </section>
          )}
        </div>
      </aside>

      <main className="w-[64%] px-7 py-9">
        <header className="mb-8 text-center">
          <h1 onClick={(event) => tools.select("fullName", event)} className={tools.itemClass("fullName", "relative z-10 inline-block px-3 text-[25pt] font-black uppercase leading-tight tracking-wide")} style={{ ...tools.itemStyle("fullName"), backgroundImage: `linear-gradient(transparent 62%, ${accent} 62%)` }}>{data.fullName}</h1>
          <p onClick={(event) => tools.select("jobTitle", event)} className={tools.itemClass("jobTitle", "mt-2 text-[9pt] font-semibold uppercase tracking-[0.18em] text-neutral-500")} style={tools.itemStyle("jobTitle")}>{data.jobTitle}</p>
          <div className="mt-4 space-y-1 text-[8pt] text-neutral-400">
            <p onClick={(event) => tools.select("contact-location", event)} className={tools.itemClass("contact-location")} style={tools.itemStyle("contact-location")}>{data.location}</p>
            <p><span onClick={(event) => tools.select("contact-phone", event)} className={tools.itemClass("contact-phone")} style={tools.itemStyle("contact-phone")}>{data.phone}</span>{data.phone && data.email && " · "}<span onClick={(event) => tools.select("contact-email", event)} className={tools.itemClass("contact-email")} style={tools.itemStyle("contact-email")}>{data.email}</span></p>
          </div>
        </header>

        <div className="space-y-8">
          {data.experience.length > 0 && (
            <section className="resume-section">
              <SectionTitle>Experience</SectionTitle>
              <div className="space-y-5">
                {data.experience.map((experience, index) => {
                  const itemIndex = (indexOffsets.experience || 0) + index;
                  return (
                    <article key={experience.id || itemIndex} className="resume-item">
                      <h3 onClick={(event) => tools.select(`exp-${itemIndex}-role`, event)} className={tools.itemClass(`exp-${itemIndex}-role`, "text-[9pt] font-semibold uppercase tracking-[0.12em]")} style={tools.itemStyle(`exp-${itemIndex}-role`)}>{experience.role} <span className="font-normal text-neutral-400">({experience.period})</span></h3>
                      <p onClick={(event) => tools.select(`exp-${itemIndex}-company`, event)} className={tools.itemClass(`exp-${itemIndex}-company`, "mt-1 text-[8pt] font-semibold uppercase tracking-wider text-neutral-500")} style={tools.itemStyle(`exp-${itemIndex}-company`)}>{experience.company}</p>
                      {experience.details && <p onClick={(event) => tools.select(`exp-${itemIndex}-details`, event)} className={tools.itemClass(`exp-${itemIndex}-details`, "mt-2 whitespace-pre-line text-[8pt] leading-relaxed text-neutral-500")} style={tools.itemStyle(`exp-${itemIndex}-details`)}>{experience.details}</p>}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {data.education && data.education.length > 0 && (
            <section className="resume-section">
              <SectionTitle>Education</SectionTitle>
              <div className="space-y-4">
                {data.education.map((education, index) => {
                  const itemIndex = (indexOffsets.education || 0) + index;
                  return (
                    <article key={education.id || itemIndex} className="resume-item">
                      <h3 onClick={(event) => tools.select(`edu-${itemIndex}-degree`, event)} className={tools.itemClass(`edu-${itemIndex}-degree`, "text-[9pt] font-semibold uppercase tracking-[0.12em]")} style={tools.itemStyle(`edu-${itemIndex}-degree`)}>{education.degree} <span className="font-normal text-neutral-400">({education.period})</span></h3>
                      <p onClick={(event) => tools.select(`edu-${itemIndex}-inst`, event)} className={tools.itemClass(`edu-${itemIndex}-inst`, "mt-1 text-[8pt] text-neutral-500")} style={tools.itemStyle(`edu-${itemIndex}-inst`)}>{education.institution}{education.grade ? ` · ${education.grade}` : ""}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <AdditionalSections data={data} accentColor="#333333" includeLanguages={false} selectedElementId={selectedElementId} onSelectElement={onSelectElement} elementStyles={elementStyles} indexOffsets={indexOffsets} />
        </div>
      </main>
    </ResumePage>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-4 text-[14pt] font-light uppercase tracking-[0.18em] text-neutral-700">{children}</h2>;
}
