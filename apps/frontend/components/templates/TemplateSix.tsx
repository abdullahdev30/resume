import React from "react";
import { Camera, User as UserIcon } from "lucide-react";
import { getResumePageStyle, type ResumeData, type TemplateProps } from "./TemplateOne";
import { AdditionalSections } from "./AdditionalSections";
import { ResumePage } from "./ResumePage";

export default function TemplateSix({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  onPhotoUpload,
  indexOffsets = {},
}: TemplateProps) {
  const primaryColor = data.primaryColor || "#9333ea";

  const getItemStyle = (id: string, defaultColor?: string): React.CSSProperties => {
    const custom = elementStyles[id];
    return {
      fontWeight: custom?.isBold !== undefined ? (custom.isBold ? "bold" : "normal") : undefined,
      fontStyle: custom?.isItalic !== undefined ? (custom.isItalic ? "italic" : "normal") : undefined,
      textDecoration: custom?.isUnderline !== undefined ? (custom.isUnderline ? "underline" : "none") : undefined,
      textAlign: custom?.align || undefined,
      color: custom?.color || defaultColor || undefined,
      fontSize: custom?.fontSize ? `${custom.fontSize}pt` : undefined,
      lineHeight: custom?.lineHeight || data.lineSpacing || undefined,
      fontFamily: custom?.fontFamily || undefined,
    };
  };

  const getItemClass = (id: string, baseClass: string = "") => {
    const isSelected = selectedElementId === id;
    return `${baseClass} cursor-pointer transition p-0.5 rounded-xs ${
      isSelected ? "ring-2 ring-purple-500 ring-offset-1 bg-purple-500/10" : "hover:ring-1 hover:ring-purple-400/50"
    }`.trim();
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectElement) {
      onSelectElement(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoUpload) {
      onPhotoUpload(file);
    }
  };

  return (
    <ResumePage
      data={data}
      className="bg-white shadow-xl mx-auto font-sans text-slate-800 flex flex-row"
      style={{
        ...getResumePageStyle(data),
        fontFamily: data.fontFamily || "inherit",
        fontWeight: data.isBold ? "bold" : undefined,
        fontStyle: data.isItalic ? "italic" : undefined,
        textDecoration: data.isUnderline ? "underline" : undefined,
        textAlign: data.textAlign || "left",
      }}
    >
      {/* Left Sidebar with Big Candidate Avatar Frame */}
      <div className="w-[36%] bg-slate-900 text-white p-8 flex flex-col justify-between">
        <div>
          {/* Circular Photo Card on Canvas */}
          <div className="relative group mx-auto mb-6 w-32 h-32 flex justify-center cursor-pointer">
            <label className="block w-32 h-32 rounded-full overflow-hidden border-4 border-purple-400/30 bg-slate-800 shadow-2xl cursor-pointer relative group-hover:border-purple-400 transition">
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt="Candidate Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-slate-800 hover:bg-slate-700 transition">
                  <UserIcon className="w-12 h-12 text-purple-300 mb-1" />
                  {onPhotoUpload && (
                    <span className="text-[10px] font-bold text-purple-300 flex items-center">
                      <Camera className="w-3 h-3 mr-1" />
                      <span>Upload Photo</span>
                    </span>
                  )}
                </div>
              )}

              {onPhotoUpload && (
                <>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                    <Camera className="w-4 h-4 mr-1" />
                    <span>Change</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </>
              )}
            </label>
          </div>

          <h1
            onClick={(e) => handleSelect("fullName", e)}
            className={getItemClass("fullName", "text-2xl font-extrabold uppercase tracking-wider text-white text-center mb-1")}
            style={getItemStyle("fullName", "#ffffff")}
          >
            {data.fullName}
          </h1>

          <p
            onClick={(e) => handleSelect("jobTitle", e)}
            className={getItemClass("jobTitle", "text-xs font-semibold text-purple-300 uppercase tracking-widest text-center mb-6")}
            style={getItemStyle("jobTitle", "#c084fc")}
          >
            {data.jobTitle}
          </p>

          {/* Contact info */}
          <div className="mb-6 space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contact Info</h3>
            <p onClick={(e) => handleSelect("contact-phone", e)} className={getItemClass("contact-phone", "truncate")}>
              Phone: {data.phone}
            </p>
            <p onClick={(e) => handleSelect("contact-email", e)} className={getItemClass("contact-email", "truncate")}>
              Email: {data.email}
            </p>
            <p onClick={(e) => handleSelect("contact-location", e)} className={getItemClass("contact-location", "truncate")}>
              Location: {data.location}
            </p>
          </div>

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="mb-6 border-t border-slate-800 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Core Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, index) => {
                  const id = `skill-${(indexOffsets.skills || 0) + index}`;
                  return (
                    <span
                      key={index}
                      onClick={(e) => handleSelect(id, e)}
                      className={getItemClass(id, "text-[11px] bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2.5 py-1 rounded-md")}
                      style={getItemStyle(id, "#d8b4fe")}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-800 text-center">
          Portfolio & Resume Studio
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-[64%] p-8 space-y-6 bg-white">
        {/* Summary */}
        {data.summary && (
          <div>
            <h3
              onClick={(e) => handleSelect("section-summary", e)}
              className={getItemClass("section-summary", "text-xs font-bold uppercase tracking-widest pb-1 mb-3 border-b-2")}
              style={{ color: primaryColor, borderColor: primaryColor, ...getItemStyle("section-summary") }}
            >
              About & Portfolio
            </h3>
            <p
              onClick={(e) => handleSelect("summary", e)}
              className={getItemClass("summary", "text-xs text-slate-600 leading-relaxed")}
              style={getItemStyle("summary")}
            >
              {data.summary}
            </p>
          </div>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h3
              onClick={(e) => handleSelect("section-experience", e)}
              className={getItemClass("section-experience", "text-xs font-bold uppercase tracking-widest pb-1 mb-4 border-b-2")}
              style={{ color: primaryColor, borderColor: primaryColor, ...getItemStyle("section-experience") }}
            >
              Experience Timeline
            </h3>
            <div className="space-y-4">
              {data.experience.map((exp, index) => {
                const itemIndex = (indexOffsets.experience || 0) + index;
                const roleId = `exp-${itemIndex}-role`;
                const companyId = `exp-${itemIndex}-company`;
                const detailsId = `exp-${itemIndex}-details`;

                return (
                  <div key={exp.id || itemIndex} className="resume-item space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h4
                        onClick={(e) => handleSelect(roleId, e)}
                        className={getItemClass(roleId, "text-xs font-bold text-slate-900")}
                        style={getItemStyle(roleId)}
                      >
                        {exp.role}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400">{exp.period}</span>
                    </div>
                    <p
                      onClick={(e) => handleSelect(companyId, e)}
                      className={getItemClass(companyId, "text-[11px] font-medium text-purple-700")}
                      style={getItemStyle(companyId)}
                    >
                      {exp.company}
                    </p>
                    <p
                      onClick={(e) => handleSelect(detailsId, e)}
                      className={getItemClass(detailsId, "text-xs text-slate-600 leading-relaxed whitespace-pre-line")}
                      style={getItemStyle(detailsId)}
                    >
                      {exp.details}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div>
            <h3
              onClick={(e) => handleSelect("section-education", e)}
              className={getItemClass("section-education", "text-xs font-bold uppercase tracking-widest pb-1 mb-4 border-b-2")}
              style={{ color: primaryColor, borderColor: primaryColor, ...getItemStyle("section-education") }}
            >
              Education
            </h3>
            <div className="space-y-3">
              {data.education.map((edu, index) => {
                const itemIndex = (indexOffsets.education || 0) + index;
                const degreeId = `edu-${itemIndex}-degree`;
                const instId = `edu-${itemIndex}-inst`;

                return (
                  <div key={edu.id || itemIndex} className="resume-item flex justify-between items-start">
                    <div>
                      <h4
                        onClick={(e) => handleSelect(degreeId, e)}
                        className={getItemClass(degreeId, "text-xs font-bold text-slate-900")}
                        style={getItemStyle(degreeId)}
                      >
                        {edu.degree}
                      </h4>
                      <p
                        onClick={(e) => handleSelect(instId, e)}
                        className={getItemClass(instId, "text-[11px] text-slate-500")}
                        style={getItemStyle(instId)}
                      >
                        {edu.institution}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{edu.period}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <AdditionalSections data={data} accentColor={primaryColor} selectedElementId={selectedElementId} onSelectElement={onSelectElement} elementStyles={elementStyles} indexOffsets={indexOffsets} />
      </div>
    </ResumePage>
  );
}
