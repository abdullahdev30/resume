import React from 'react';

interface TemplateFourProps {
  data: {
    fullName: string;
    jobTitle: string;
    avatar: string;
    about: string;
    skills: string[];
    phone: string;
    email: string;
    location: string;
    experience: {
      company: string;
      period: string;
      role: string;
      tasks: string;
    }[];
  };
}

export default function TemplateFour({ data }: TemplateFourProps) {
  return (
    <div className="bg-white shadow-lg max-w-[210mm] mx-auto flex font-sans min-h-[297mm]">
      {/* Left Slate Sidebar */}
      <div className="w-1/3 bg-[#334155] text-white p-6 flex flex-col items-center text-center">
        <img 
          src={data.avatar || "https://via.placeholder.com/100"} 
          alt="Avatar" 
          className="w-24 h-24 rounded-full object-cover border-2 border-gray-400 mb-4"
        />
        <h1 className="text-xl font-bold uppercase tracking-wide">{data.fullName || "KHALIL RICHARDSON"}</h1>
        <p className="text-xs text-gray-300 uppercase tracking-widest mb-6">{data.jobTitle || "JOURNALIST"}</p>

        <div className="w-full text-left">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 border-b border-gray-500 pb-1 mb-2">About Me</h3>
          <p className="text-xs text-gray-300 leading-relaxed mb-6">{data.about}</p>

          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 border-b border-gray-500 pb-1 mb-2">Skills</h3>
          <ul className="text-xs text-gray-300 space-y-1 mb-6">
            {data.skills?.map((skill, i) => <li key={i}>- {skill}</li>)}
          </ul>

          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 border-b border-gray-500 pb-1 mb-2">Contact</h3>
          <p className="text-xs text-gray-300">{data.phone}</p>
          <p className="text-xs text-gray-300">{data.email}</p>
          <p className="text-xs text-gray-300">{data.location}</p>
        </div>
      </div>

      {/* Right Content */}
      <div className="w-2/3 p-8 text-gray-900">
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest bg-amber-100 text-amber-900 px-2 py-1 mb-3 inline-block">Work Experience</h3>
          {data.experience?.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-xs font-bold">
                <span>{exp.company}</span>
                <span>{exp.period}</span>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-1">{exp.role}</p>
              <p className="text-xs text-gray-500">{exp.tasks}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}