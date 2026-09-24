import React from "react";
import type { ResumeData, TemplateProps } from "./TemplateOne";

export default function TemplateThree({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
}: TemplateProps) {
  const accentColor = data.primaryColor || "#334155";

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
      isSelected ? "ring-2 ring-slate-700 ring-offset-1 bg-slate-500/10" : "hover:ring-1 hover:ring-slate-400/50"
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
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto p-10 font-serif text-slate-800"
      style={{
        fontFamily: data.fontFamily || "Georgia, serif",
        fontWeight: data.isBold ? "bold" : undefined,
        fontStyle: data.isItalic ? "italic" : undefined,
        textDecoration: data.isUnderline ? "underline" : undefined,
        textAlign: data.textAlign || "center",
      }}
    >
      {/* Centered Header */}
      <div className="text-center border-b-2 border-slate-300 pb-6 mb-6">
        <h1
          onClick={(e) => handleSelect("fullName", e)}
          className={getItemClass("fullName", "text-3xl font-bold uppercase tracking-widest text-slate-900 mb-1")}
          style={getItemStyle("fullName")}
        >
          {data.fullName || "YOUR NAME"}
        </h1>
        <p
          onClick={(e) => handleSelect("jobTitle", e)}
          className={getItemClass("jobTitle", "text-xs uppercase font-sans font-semibold tracking-widest text-slate-500 mb-3")}
          style={getItemStyle("jobTitle")}
        >
          {data.jobTitle || "PROFESSIONAL TITLE"}
        </p>
        <p className="text-xs font-sans text-slate-600 space-x-2">
          <span onClick={(e) => handleSelect("contact-email", e)} className={getItemClass("contact-email")}>
            {data.email}
          </span>
          <span>•</span>
          <span onClick={(e) => handleSelect("contact-phone", e)} className={getItemClass("contact-phone")}>
            {data.phone}
          </span>
          <span>•</span>
          <span onClick={(e) => handleSelect("contact-location", e)} className={getItemClass("contact-location")}>
            {data.location}
          </span>
        </p>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-6">
          <h2
            className="text-xs font-sans font-bold uppercase tracking-widest border-b pb-1 mb-2 text-center"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Executive Summary
          </h2>
          <p
            onClick={(e) => handleSelect("summary", e)}
            className={getItemClass("summary", "text-xs text-slate-700 leading-relaxed text-center italic max-w-2xl mx-auto")}
            style={getItemStyle("summary")}
          >
            {data.summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-xs font-sans font-bold uppercase tracking-widest border-b pb-1 mb-3 text-center"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Areas of Expertise
          </h2>
          <div className="flex flex-wrap justify-center gap-2 font-sans text-xs">
            {data.skills.map((skill, index) => {
              const id = `skill-${index}`;
              return (
                <span
                  key={index}
                  onClick={(e) => handleSelect(id, e)}
                  className={getItemClass(id, "bg-slate-100 text-slate-700 px-3 py-1 rounded border border-slate-200")}
                  style={getItemStyle(id)}
                >
                  {skill}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-xs font-sans font-bold uppercase tracking-widest border-b pb-1 mb-4 text-center"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Professional Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp, index) => {
              const roleId = `exp-${index}-role`;
              const detailsId = `exp-${index}-details`;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-baseline font-sans">
                    <span
                      onClick={(e) => handleSelect(roleId, e)}
                      className={getItemClass(roleId, "font-bold text-xs text-slate-900")}
                      style={getItemStyle(roleId)}
                    >
                      {exp.role} — {exp.company}
                    </span>
                    <span className="text-[10px] text-slate-500 italic">{exp.period}</span>
                  </div>
                  <p
                    onClick={(e) => handleSelect(detailsId, e)}
                    className={getItemClass(detailsId, "text-xs text-slate-700 leading-relaxed whitespace-pre-line")}
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
          <h2
            className="text-xs font-sans font-bold uppercase tracking-widest border-b pb-1 mb-4 text-center"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Education & Credential
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, index) => {
              const degreeId = `edu-${index}-degree`;

              return (
                <div key={index} className="flex justify-between items-start font-sans text-xs">
                  <div>
                    <span
                      onClick={(e) => handleSelect(degreeId, e)}
                      className={getItemClass(degreeId, "font-bold text-slate-900")}
                      style={getItemStyle(degreeId)}
                    >
                      {edu.degree}
                    </span>
                    <span className="text-slate-500 ml-2">({edu.institution})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{edu.period}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}