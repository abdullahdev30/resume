import React from "react";
import { Camera, User as UserIcon } from "lucide-react";
import type { ResumeData, TemplateProps } from "./TemplateOne";

export default function TemplateFour({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  onPhotoUpload,
}: TemplateProps) {
  const primaryColor = data.primaryColor || "#1e3a8a";

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
      isSelected ? "ring-2 ring-blue-400 ring-offset-1 bg-blue-500/10" : "hover:ring-1 hover:ring-blue-300/50"
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
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto font-sans text-slate-800 flex flex-col"
      style={{
        fontFamily: data.fontFamily || "inherit",
        fontWeight: data.isBold ? "bold" : undefined,
        fontStyle: data.isItalic ? "italic" : undefined,
        textDecoration: data.isUnderline ? "underline" : undefined,
        textAlign: data.textAlign || "left",
      }}
    >
      {/* Top Navy Header Block */}
      <div className="p-8 text-white flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
        <div>
          <h1
            onClick={(e) => handleSelect("fullName", e)}
            className={getItemClass("fullName", "text-3xl font-extrabold uppercase tracking-wide")}
            style={getItemStyle("fullName", "#ffffff")}
          >
            {data.fullName}
          </h1>
          <p
            onClick={(e) => handleSelect("jobTitle", e)}
            className={getItemClass("jobTitle", "text-xs text-blue-200 uppercase font-semibold tracking-widest mt-1")}
            style={getItemStyle("jobTitle", "#bfdbfe")}
          >
            {data.jobTitle}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-blue-100 mt-4 font-medium">
            <span onClick={(e) => handleSelect("contact-phone", e)} className={getItemClass("contact-phone")}>
              📞 {data.phone}
            </span>
            <span onClick={(e) => handleSelect("contact-email", e)} className={getItemClass("contact-email")}>
              ✉️ {data.email}
            </span>
            <span onClick={(e) => handleSelect("contact-location", e)} className={getItemClass("contact-location")}>
              📍 {data.location}
            </span>
          </div>
        </div>

        {/* Interactive Canvas Avatar Frame */}
        <div className="relative group flex-shrink-0 cursor-pointer">
          <label className="block w-24 h-24 rounded-xl overflow-hidden border-2 border-white/40 bg-slate-800 shadow-xl cursor-pointer relative group-hover:border-white transition">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-1 text-center bg-slate-800/80 hover:bg-slate-700 transition">
                <UserIcon className="w-8 h-8 text-blue-200 mb-0.5" />
                <span className="text-[9px] font-bold text-blue-200 flex items-center">
                  <Camera className="w-3 h-3 mr-0.5" />
                  <span>Photo</span>
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
              <Camera className="w-3.5 h-3.5 mr-1" />
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

      {/* Main Body Grid */}
      <div className="p-8 grid grid-cols-3 gap-8 flex-1">
        {/* Main Column */}
        <div className="col-span-2 space-y-6">
          {/* Summary */}
          {data.summary && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
                Executive Profile
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

          {/* Work History */}
          {data.experience && data.experience.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-4">
                Career History
              </h3>
              <div className="space-y-4">
                {data.experience.map((exp, index) => {
                  const roleId = `exp-${index}-role`;
                  const companyId = `exp-${index}-company`;
                  const detailsId = `exp-${index}-details`;

                  return (
                    <div key={index} className="space-y-1">
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
                        className={getItemClass(companyId, "text-[11px] font-semibold text-blue-900")}
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
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-6 border-l border-slate-100 pl-6">
          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
                Core Competencies
              </h3>
              <div className="flex flex-col space-y-1.5">
                {data.skills.map((skill, index) => {
                  const id = `skill-${index}`;
                  return (
                    <div
                      key={index}
                      onClick={(e) => handleSelect(id, e)}
                      className={getItemClass(id, "text-xs font-medium bg-slate-100 text-slate-800 px-3 py-1.5 rounded border border-slate-200")}
                      style={getItemStyle(id)}
                    >
                      {skill}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
                Education
              </h3>
              <div className="space-y-3">
                {data.education.map((edu, index) => {
                  const degreeId = `edu-${index}-degree`;

                  return (
                    <div key={index}>
                      <h4
                        onClick={(e) => handleSelect(degreeId, e)}
                        className={getItemClass(degreeId, "text-xs font-bold text-slate-900")}
                        style={getItemStyle(degreeId)}
                      >
                        {edu.degree}
                      </h4>
                      <p className="text-[11px] text-slate-500">{edu.institution}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{edu.period}</span>
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
