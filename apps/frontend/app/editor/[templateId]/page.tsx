'use client';
import { useState, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';

interface ResumeData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  summary: string;
  primaryColor: string;
}

export default function EditorPage() {
  const params = useParams();
  const templateId = params.templateId as string;

  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: 'Abdullah Shafique',
    title: 'AI & Full Stack Developer',
    email: 'abdullah@example.com',
    phone: '+92 300 1234567',
    summary: 'Passionate developer building intelligent web applications...',
    primaryColor: '#2563eb',
  });

  const handleInputChange = (field: keyof ResumeData, value: string) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadPDF = (): void => {
    window.print();
  };

  const handleSaveToDatabase = async (): Promise<void> => {
    // Yahan API call aayegi backend ke liye
    alert('Resume saved successfully to database!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Toolbar */}
      <header className="bg-white border-b border-gray-300 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-gray-700">Resume Editor (Template #{templateId})</span>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Theme Color:</span>
            <input 
              type="color" 
              value={resumeData.primaryColor}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('primaryColor', e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={handleSaveToDatabase}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Save to Dashboard
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Download PDF
          </button>
        </div>
      </header>

      {/* Main Canvas / Live Preview Area */}
      <main className="flex-grow flex justify-center p-8 overflow-y-auto">
        <div 
          className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-12 text-gray-800 flex flex-col justify-between"
          style={{ '--primary': resumeData.primaryColor } as React.CSSProperties}
        >
          <div>
            <input 
              type="text" 
              value={resumeData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="text-3xl font-bold w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none pb-1"
              style={{ color: resumeData.primaryColor }}
            />
            <input 
              type="text" 
              value={resumeData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="text-lg font-medium text-gray-600 w-full border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none mt-1"
            />
            <div className="flex space-x-4 text-sm text-gray-500 mt-2">
              <span>{resumeData.email}</span>
              <span>•</span>
              <span>{resumeData.phone}</span>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-bold uppercase tracking-wider pb-1 border-b-2 mb-2" style={{ borderColor: resumeData.primaryColor, color: resumeData.primaryColor }}>
              Professional Summary
            </h4>
            <textarea 
              value={resumeData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              className="w-full text-gray-700 resize-none border border-transparent hover:border-gray-200 focus:border-blue-500 outline-none p-1 rounded"
              rows={4}
            />
          </div>

          <div className="mt-auto text-xs text-center text-gray-400 pt-8 border-t">
            Created with Resume Builder App
          </div>
        </div>
      </main>
    </div>
  );
}