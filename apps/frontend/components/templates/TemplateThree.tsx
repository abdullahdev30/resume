import React from 'react';

interface TemplateThreeProps {
  data: {
    fullName: string;
    jobTitle: string;
    profileImage: string;
    phone: string;
    email: string;
    address: string;
    summary: string;
    skills: string[];
    experience: {
      role: string;
      company: string;
      period: string;
      desc: string;
    }[];
  };
}

export default function TemplateThree({ data }: TemplateThreeProps) {
  return (
    <div className="bg-white shadow-lg max-w-[210mm] mx-auto flex font-sans min-h-[297mm]">
      {/* Left Light-Gray Sidebar */}
      <div className="w-1/3 bg-gray-200 p-6 flex flex-col items-center text-center">
        <img 
          src={data.profileImage || "https://via.placeholder.com/120"} 
          alt="Profile" 
          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md mb-4"
        />
        <div className="w-full text-left mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 border-b border-gray-400 pb-1 mb-2">Contact</h3>
          <p className="text-xs text-gray-600 mb-1">{data.phone}</p>
          <p className="text-xs text-gray-600 mb-1">{data.email}</p>
          <p className="text-xs text-gray-600 mb-4">{data.address}</p>

          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700 border-b border-gray-400 pb-1 mb-2">Skills</h3>
          <ul className="text-xs text-gray-700 space-y-1">
            {data.skills?.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
      </div>

      {/* Right Main Panel */}
      <div className="w-2/3 p-8 text-gray-900">
        <div className="bg-gray-900 text-white p-6 -mx-8 -mt-8 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider">{data.fullName || "RICHARD SANCHEZ"}</h1>
          <p className="text-sm text-gray-300 font-medium">{data.jobTitle || "MARKETING MANAGER"}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-2">Profile</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800 border-b border-gray-300 pb-1 mb-4">Work Experience</h3>
          {data.experience?.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-xs font-bold">
                <span>{exp.company}</span>
                <span>{exp.period}</span>
              </div>
              <p className="text-xs font-semibold text-gray-600 mb-1">{exp.role}</p>
              <p className="text-xs text-gray-500">{exp.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}