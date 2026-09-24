import React from "react";
import type { ResumeData } from "./TemplateOne";

interface TemplateProps {
  data: ResumeData;
}

export default function TemplateFour({ data }: TemplateProps) {
  const primaryColor = data.primaryColor || "#1e3a8a";

  return (
    <div
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto font-sans text-slate-800 flex flex-col"
      style={{ fontFamily: data.fontFamily || "inherit" }}
    >
      {/* Top Navy Header Block */}
      <div className="p-8 text-white flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">{data.fullName || "EXECUTIVE NAME"}</h1>
          <p className="text-xs text-blue-200 uppercase font-semibold tracking-widest mt-1">
            {data.jobTitle || "EXECUTIVE LEADER"}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-blue-100 mt-4 font-medium">
            <span>📞 {data.phone}</span>
            <span>✉️ {data.email}</span>
            <span>📍 {data.location}</span>
          </div>
        </div>

        {data.avatarUrl && (
          <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-white/40 shadow-xl flex-shrink-0">
            <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        )}
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
              <p className="text-xs text-slate-600 leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Work History */}
          {data.experience && data.experience.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-4">
                Career History
              </h3>
              <div className="space-y-4">
                {data.experience.map((exp, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                      <span className="text-[10px] font-semibold text-slate-400">{exp.period}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-900">{exp.company}</p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.details}</p>
                  </div>
                ))}
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
                {data.skills.map((skill, index) => (
                  <div key={index} className="text-xs font-medium bg-slate-100 text-slate-800 px-3 py-1.5 rounded border border-slate-200">
                    {skill}
                  </div>
                ))}
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
                {data.education.map((edu, index) => (
                  <div key={index}>
                    <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                    <p className="text-[11px] text-slate-500">{edu.institution}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">{edu.period}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}