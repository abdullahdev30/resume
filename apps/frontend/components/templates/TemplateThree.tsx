import React from "react";
import type { ResumeData } from "./TemplateOne";

interface TemplateProps {
  data: ResumeData;
}

export default function TemplateThree({ data }: TemplateProps) {
  const accentColor = data.primaryColor || "#334155";

  return (
    <div
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto p-10 font-serif text-slate-800"
      style={{ fontFamily: data.fontFamily || "Georgia, serif" }}
    >
      {/* Centered Header */}
      <div className="text-center border-b-2 border-slate-300 pb-6 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-900 mb-1">
          {data.fullName || "YOUR NAME"}
        </h1>
        <p className="text-xs uppercase font-sans font-semibold tracking-widest text-slate-500 mb-3">
          {data.jobTitle || "PROFESSIONAL TITLE"}
        </p>
        <p className="text-xs font-sans text-slate-600 space-x-2">
          <span>{data.email}</span>
          <span>•</span>
          <span>{data.phone}</span>
          <span>•</span>
          <span>{data.location}</span>
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
          <p className="text-xs text-slate-700 leading-relaxed text-center italic max-w-2xl mx-auto">{data.summary}</p>
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
            {data.skills.map((skill, index) => (
              <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded border border-slate-200">
                {skill}
              </span>
            ))}
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
            {data.experience.map((exp, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-baseline font-sans">
                  <span className="font-bold text-xs text-slate-900">{exp.role} — {exp.company}</span>
                  <span className="text-[10px] text-slate-500 italic">{exp.period}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{exp.details}</p>
              </div>
            ))}
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
            {data.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-start font-sans text-xs">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree}</span>
                  <span className="text-slate-500 ml-2">({edu.institution})</span>
                </div>
                <span className="text-[10px] text-slate-400">{edu.period}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}