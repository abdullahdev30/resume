import React from 'react';

interface TemplateTwoProps {
  data: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    languages: string[];
    skills: string[];
    summary: string;
    experience: {
      role: string;
      company: string;
      period: string;
      details: string;
    }[];
  };
}

export default function TemplateTwo({ data }: TemplateTwoProps) {
  return (
    <div className="bg-white shadow-lg max-w-[210mm] mx-auto flex font-sans min-h-[297mm]">
      {/* Left Sidebar (Dark) */}
      <div className="w-1/3 bg-[#1e293b] text-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-wide uppercase mb-1">{data.fullName || "VIOLET RODRIGUEZ"}</h1>
          <p className="text-blue-300 text-sm font-medium mb-8">{data.jobTitle || "Business Analyst"}</p>

          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-600 pb-1">Languages</h3>
            <ul className="text-sm space-y-1">
              {data.languages?.map((lang, i) => <li key={i}>{lang}</li>)}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-600 pb-1">Skills</h3>
            <div className="flex flex-wrap gap-1">
              {data.skills?.map((skill, i) => (
                <span key={i} className="text-xs bg-slate-700 px-2 py-1 rounded">{skill}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          <p>{data.phone}</p>
          <p>{data.email}</p>
          <p>{data.location}</p>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-2/3 p-8 text-gray-800">
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 border-b-2 border-blue-900 pb-1 mb-2">Summary</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{data.summary}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 border-b-2 border-blue-900 pb-1 mb-4">Experience</h3>
          {data.experience?.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-blue-900">{exp.role}</span>
                <span className="text-xs text-gray-500">{exp.period}</span>
              </div>
              <p className="text-xs font-semibold text-gray-600 mb-1">{exp.company}</p>
              <p className="text-xs text-gray-600">{exp.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}