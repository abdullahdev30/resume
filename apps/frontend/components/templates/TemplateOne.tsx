import React from "react";
import { Camera, User as UserIcon } from "lucide-react";

export interface ElementStyle {
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  align?: "left" | "center" | "right";
  color?: string;
}

export interface ResumeData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  avatarUrl?: string;
  summary: string;
  primaryColor?: string;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: "left" | "center" | "right";
  skills: string[];
  languages: string[];
  experience: {
    id?: string;
    role: string;
    company: string;
    period: string;
    details: string;
  }[];
  education?: {
    id?: string;
    degree: string;
    institution: string;
    period: string;
    grade?: string;
  }[];
}

export interface TemplateProps {
  data: ResumeData;
  selectedElementId?: string | null;
  onSelectElement?: (id: string) => void;
  elementStyles?: Record<string, ElementStyle>;
  onPhotoUpload?: (file: File) => void;
}

export default function TemplateOne({
  data,
  selectedElementId,
  onSelectElement,
  elementStyles = {},
  onPhotoUpload,
}: TemplateProps) {
  const accentColor = data.primaryColor || "#0E7C7B";

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
      isSelected ? "ring-2 ring-teal-500 ring-offset-1 bg-teal-500/10" : "hover:ring-1 hover:ring-teal-400/50"
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
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto flex flex-row font-sans text-slate-800"
      style={{
        fontFamily: data.fontFamily || "inherit",
        fontWeight: data.isBold ? "bold" : undefined,
        fontStyle: data.isItalic ? "italic" : undefined,
        textDecoration: data.isUnderline ? "underline" : undefined,
        textAlign: data.textAlign || "left",
      }}
    >
      {/* Left Sidebar */}
      <div className="w-[34%] bg-slate-900 text-white p-7 flex flex-col justify-between">
        <div>
          {/* Interactive Canvas Avatar Frame */}
          <div className="relative group mx-auto mb-5 w-24 h-24 flex justify-center cursor-pointer">
            <label className="block w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-lg cursor-pointer relative group-hover:border-teal-400 transition">
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center bg-slate-800 hover:bg-slate-700 transition">
                  <UserIcon className="w-8 h-8 text-teal-300 mb-0.5" />
                  <span className="text-[9px] font-bold text-teal-300 flex items-center">
                    <Camera className="w-3 h-3 mr-0.5" />
                    <span>Upload</span>
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                <Camera className="w-3.5 h-3.5 mr-1" />
                <span>Photo</span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onPhotoUpload?.(e.target.files[0])}
              />
            </label>
          </div>

          <h1
            onClick={(e) => handleSelect("fullName", e)}
            className={getItemClass("fullName", "text-xl font-bold uppercase tracking-wider text-white mb-1")}
            style={getItemStyle("fullName", "#ffffff")}
          >
            {data.fullName || "Your Full Name"}
          </h1>

          <p
            onClick={(e) => handleSelect("jobTitle", e)}
            className={getItemClass("jobTitle", "text-xs font-semibold text-teal-400 uppercase tracking-widest mb-6")}
            style={getItemStyle("jobTitle", "#2dd4bf")}
          >
            {data.jobTitle || "Job Title"}
          </p>

          {/* Contact */}
          <div className="mb-6 space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contact</h3>
            <p
              onClick={(e) => handleSelect("contact-phone", e)}
              className={getItemClass("contact-phone", "truncate")}
              style={getItemStyle("contact-phone")}
            >
              {data.phone || "+1 (555) 000-0000"}
            </p>
            <p
              onClick={(e) => handleSelect("contact-email", e)}
              className={getItemClass("contact-email", "truncate")}
              style={getItemStyle("contact-email")}
            >
              {data.email || "email@example.com"}
            </p>
            <p
              onClick={(e) => handleSelect("contact-location", e)}
              className={getItemClass("contact-location", "truncate")}
              style={getItemStyle("contact-location")}
            >
              {data.location || "City, Country"}
            </p>
          </div>

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="mb-6 border-t border-slate-800 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Core Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, index) => {
                  const id = `skill-${index}`;
                  return (
                    <span
                      key={index}
                      onClick={(e) => handleSelect(id, e)}
                      className={getItemClass(id, "text-[11px] bg-slate-800 text-teal-300 border border-slate-700/60 px-2.5 py-1 rounded-md")}
                      style={getItemStyle(id, "#5eead4")}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div className="mb-6 border-t border-slate-800 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Languages</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                {data.languages.map((lang, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>{lang}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-800 text-center">
          Generated via Resume Builder
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-[66%] p-8 space-y-6 bg-white">
        {/* Summary */}
        {data.summary && (
          <div>
            <h3
              onClick={(e) => handleSelect("section-summary", e)}
              className={getItemClass("section-summary", "text-xs font-bold uppercase tracking-widest pb-1 mb-3 border-b-2")}
              style={{ color: accentColor, borderColor: accentColor, ...getItemStyle("section-summary") }}
            >
              Professional Profile
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
              style={{ color: accentColor, borderColor: accentColor, ...getItemStyle("section-experience") }}
            >
              Work Experience
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
                      className={getItemClass(companyId, "text-[11px] font-medium text-slate-500")}
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
              style={{ color: accentColor, borderColor: accentColor, ...getItemStyle("section-education") }}
            >
              Education & Qualifications
            </h3>
            <div className="space-y-3">
              {data.education.map((edu, index) => {
                const degreeId = `edu-${index}-degree`;
                const instId = `edu-${index}-inst`;

                return (
                  <div key={index} className="flex justify-between items-start">
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
      </div>
    </div>
  );
}