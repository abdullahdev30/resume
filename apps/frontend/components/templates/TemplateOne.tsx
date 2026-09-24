import React from "react";

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

interface TemplateProps {
  data: ResumeData;
}

export default function TemplateOne({ data }: TemplateProps) {
  const accentColor = data.primaryColor || "#0f172a";

  return (
    <div
      className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] mx-auto flex flex-row font-sans text-slate-800"
      style={{ fontFamily: data.fontFamily || "inherit" }}
    >
      {/* Left Sidebar */}
      <div className="w-[34%] bg-slate-900 text-white p-7 flex flex-col justify-between">
        <div>
          {data.avatarUrl && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 mx-auto mb-5 shadow-lg">
              <img src={data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          )}

          <h1 className="text-xl font-bold uppercase tracking-wider text-white mb-1 text-center md:text-left">
            {data.fullName || "Your Full Name"}
          </h1>
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-6 text-center md:text-left">
            {data.jobTitle || "Job Title"}
          </p>

          {/* Contact */}
          <div className="mb-6 space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contact</h3>
            <p className="truncate">{data.phone || "+1 (555) 000-0000"}</p>
            <p className="truncate">{data.email || "email@example.com"}</p>
            <p className="truncate">{data.location || "City, Country"}</p>
          </div>

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="mb-6 border-t border-slate-800 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Core Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, index) => (
                  <span key={index} className="text-[11px] bg-slate-800 text-blue-300 border border-slate-700/60 px-2.5 py-1 rounded-md">
                    {skill}
                  </span>
                ))}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{lang}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-800 text-center">
          Generated via ResumeCraft AI
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-[66%] p-8 space-y-6 bg-white">
        {/* Summary */}
        {data.summary && (
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest pb-1 mb-3 border-b-2"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              Professional Profile
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest pb-1 mb-4 border-b-2"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              Work Experience
            </h3>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                    <span className="text-[10px] font-semibold text-slate-400">{exp.period}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">{exp.company}</p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest pb-1 mb-4 border-b-2"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              Education & Qualifications
            </h3>
            <div className="space-y-3">
              {data.education.map((edu, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{edu.degree}</h4>
                    <p className="text-[11px] text-slate-500">{edu.institution}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{edu.period}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}