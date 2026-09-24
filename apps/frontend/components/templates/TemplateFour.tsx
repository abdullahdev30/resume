import React from 'react';

interface ResumeProps {
  data: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    skills: string[];
    experience: {
      title: string;
      company: string;
      duration: string;
      description: string;
    }[];
  };
}

export default function TemplateOne({ data }: ResumeProps) {
  return (
    <div className="bg-white p-8 shadow-lg max-w-[210mm] mx-auto text-black font-sans">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-3xl font-bold uppercase tracking-wider">{data.fullName || "YOUR NAME"}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {data.phone} — {data.email} — {data.location}
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-center border-b border-gray-300 pb-1 mb-2">Professional Summary</h2>
        <p className="text-sm text-gray-700 text-center">{data.summary}</p>
      </div>

      {/* Technical Proficiencies / Skills */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-center border-b border-gray-300 pb-1 mb-2">Technical Proficiencies</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {data.skills?.map((skill, index) => (
            <span key={index} className="text-xs bg-gray-100 px-3 py-1 rounded border border-gray-200">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Professional Experience */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-center border-b border-gray-300 pb-1 mb-4">Professional Experience</h2>
        {data.experience?.map((exp, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between font-bold text-sm">
              <span>{exp.title} — {exp.company}</span>
              <span>{exp.duration}</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}