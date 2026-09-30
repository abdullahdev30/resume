import React from "react";
import { Camera, User as UserIcon } from "lucide-react";
import type { ResumeData, TemplateProps } from "./TemplateOne";

export default function TemplateTwo({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  onPhotoUpload,
}: TemplateProps) {
  const primaryColor = data.primaryColor || "#059669";

  const getItemStyle = (id: string, defaultColor?: string): React.CSSProperties => {
    const custom = elementStyles[id];
    return {
      fontWeight: custom?.isBold !== undefined ? (custom.isBold ? "bold" : "normal") : undefined,
      fontStyle: custom?.isItalic !== undefined ? (custom.isItalic ? "italic" : "normal") : undefined,
      textDecoration: custom?.isUnderline !== undefined ? (custom.isUnderline ? "underline" : "none") : undefined,
      textAlign: custom?.align || undefined,
      color: custom?.color || defaultColor || undefined,
    };
  };

  const getItemClass = (id: string, baseClass: string = "") => {
    const isSelected = selectedElementId === id;
    return `${baseClass} cursor-pointer transition p-0.5 rounded-xs ${
      isSelected ? "ring-2 ring-emerald-500 ring-offset-1 bg-emerald-500/10" : "hover:ring-1 hover:ring-emerald-400/50"
    }`.trim();
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectElement) {
      onSelectElement(id);
    }
  };

  return (
    <div
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 font-sans text-slate-800"
      style={{
        fontFamily: data.fontFamily || "inherit",
        fontWeight: data.isBold ? "bold" : undefined,
        fontStyle: data.isItalic ? "italic" : undefined,
        textDecoration: data.isUnderline ? "underline" : undefined,
        textAlign: data.textAlign || "left",
      }}
    >
      {/* Top Header Banner */}
      <div className="flex items-center justify-between pb-6 border-b-4" style={{ borderColor: primaryColor }}>
        <div className="space-y-1">
          <h1
            onClick={(e) => handleSelect("fullName", e)}
            className={getItemClass("fullName", "text-3xl font-extrabold tracking-tight")}
            style={{ color: primaryColor, ...getItemStyle("fullName") }}
          >
            {data.fullName}
          </h1>
          <p
            onClick={(e) => handleSelect("jobTitle", e)}
            className={getItemClass("jobTitle", "text-sm font-semibold uppercase tracking-widest text-slate-500")}
            style={getItemStyle("jobTitle")}
          >
            {data.jobTitle}
          </p>
        </div>

        {/* Interactive Canvas Avatar Frame */}
        <div className="relative group flex-shrink-0 cursor-pointer">
          <label className="block w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-100 shadow-md cursor-pointer relative group-hover:border-emerald-600 transition">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-1 text-center bg-slate-100 hover:bg-slate-200 transition">
                <UserIcon className="w-6 h-6 text-emerald-600 mb-0.5" />
                <span className="text-[8px] font-bold text-emerald-700 flex items-center">
                  <Camera className="w-2.5 h-2.5 mr-0.5" />
                  <span>Photo</span>
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[9px] font-bold">
              <Camera className="w-3 h-3 mr-1" />
              <span>Upload</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onPhotoUpload?.(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* Contact Pill Bar */}
      <div className="flex flex-wrap gap-4 py-3 border-b border-slate-100 text-xs text-slate-600 font-medium">
        <span onClick={(e) => handleSelect("contact-location", e)} className={getItemClass("contact-location")}>
          Location: {data.location}
        </span>
        <span onClick={(e) => handleSelect("contact-phone", e)} className={getItemClass("contact-phone")}>
          Phone: {data.phone}
        </span>
        <span onClick={(e) => handleSelect("contact-email", e)} className={getItemClass("contact-email")}>
          Email: {data.email}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-8 mt-6">
        {/* Left Column */}
        <div className="col-span-1 space-y-6">
          {/* Summary */}
          {data.summary && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
                About Me
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

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 border-b border-slate-200 pb-1">
                Top Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => {
                  const id = `skill-${i}`;
                  return (
                    <span
                      key={i}
                      onClick={(e) => handleSelect(id, e)}
                      className={getItemClass(id, "text-[11px] font-semibold px-2.5 py-1 rounded-md text-emerald-800 bg-emerald-50 border border-emerald-200")}
                      style={getItemStyle(id)}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Column */}
        <div className="col-span-2 space-y-6">
          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-1">
                Work Experience
              </h3>
              <div className="space-y-5">
                {data.experience.map((exp, i) => {
                  const roleId = `exp-${i}-role`;
                  const companyId = `exp-${i}-company`;
                  const detailsId = `exp-${i}-details`;

                  return (
                    <div key={i} className="relative pl-4 border-l-2" style={{ borderColor: primaryColor }}>
                      <div className="flex justify-between items-baseline">
                        <h4
                          onClick={(e) => handleSelect(roleId, e)}
                          className={getItemClass(roleId, "text-xs font-bold text-slate-900")}
                          style={getItemStyle(roleId)}
                        >
                          {exp.role}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{exp.period}</span>
                      </div>
                      <p
                        onClick={(e) => handleSelect(companyId, e)}
                        className={getItemClass(companyId, "text-[11px] font-semibold text-emerald-700")}
                        style={getItemStyle(companyId)}
                      >
                        {exp.company}
                      </p>
                      <p
                        onClick={(e) => handleSelect(detailsId, e)}
                        className={getItemClass(detailsId, "text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line")}
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-1">
                Education
              </h3>
              <div className="space-y-3">
                {data.education.map((edu, i) => {
                  const degreeId = `edu-${i}-degree`;
                  const instId = `edu-${i}-inst`;

                  return (
                    <div key={i} className="flex justify-between items-start">
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
                      <span className="text-[10px] text-slate-400">{edu.period}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
