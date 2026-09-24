import React from "react";
import type { ResumeData } from "./TemplateOne";

interface TemplateProps {
  data: ResumeData;
}

export default function TemplateTwo({ data }: TemplateProps) {
  const primaryColor = data.primaryColor || "#059669";

  return (
    <div
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 font-sans text-slate-800"
      style={{ fontFamily: data.fontFamily || "inherit" }}
    >
      {/* Top Header Banner */}
      <div className="flex items-center justify-between pb-6 border-b-4" style={{ borderColor: primaryColor }}>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
            {data.fullName || "Your Full Name"}
          </h1>
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            {data.jobTitle || "Professional Title"}
          </p>
        </div>

        {data.avatarUrl && (
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
            <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Contact Pill Bar */}
      <div className="flex flex-wrap gap-4 py-3 border-b border-slate-100 text-xs text-slate-600 font-medium">
        <span>📍 {data.location || "City, Country"}</span>
        <span>📞 {data.phone || "+1 555-0000"}</span>
        <span>✉️ {data.email || "email@example.com"}</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-8 mt-6">
        {/* Left Column (Skills & Education) */}
        <div className="col-span-1 space-y-6">
          {/* Summary */}
          {data.summary && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
                About Me
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{data.summary}</p>
            </div>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 border-b border-slate-200 pb-1">
                Top Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-emerald-800 bg-emerald-50 border border-emerald-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
                Languages
              </h3>
              <ul className="text-xs text-slate-600 space-y-1">
                {data.languages.map((l, i) => (
                  <li key={i}>• {l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Main Column (Work Experience & Education) */}
        <div className="col-span-2 space-y-6">
          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 border-b border-slate-200 pb-1">
                Work Experience
              </h3>
              <div className="space-y-5">
                {data.experience.map((exp, i) => (
                  <div key={i} className="relative pl-4 border-l-2" style={{ borderColor: primaryColor }}>
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{exp.period}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-emerald-700">{exp.company}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line">{exp.details}</p>
                  </div>
                ))}
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
                {data.education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                      <p className="text-[11px] text-slate-500">{edu.institution}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{edu.period}</span>
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