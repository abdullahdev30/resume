'use client';
import { useRouter } from 'next/navigation';

interface SavedResume {
  id: string;
  title: string;
  template: string;
  updatedAt: string;
}

const savedResumes: SavedResume[] = [
  { id: 'res-1', title: 'Software Engineer Resume', template: 'Professional Modern', updatedAt: '2026-06-12' },
  { id: 'res-2', title: 'AI Developer CV', template: 'Minimalist Clean', updatedAt: '2026-06-10' },
];

export default function DashboardPage() {
  const router = useRouter();

  const handleEdit = (id: string): void => {
    router.push(`/editor/1?resumeId=${id}`);
  };

  const handleDownload = (id: string): void => {
    alert(`Downloading resume ID: ${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Saved Resumes</h1>
          <p className="text-gray-600">Manage, edit, or download your previously saved resumes.</p>
        </div>
        <button 
          onClick={() => router.push('/templates')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          + Create New Resume
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedResumes.map((res) => (
          <div key={res.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{res.template}</span>
              <h3 className="text-xl font-bold text-gray-800 mt-3 mb-1">{res.title}</h3>
              <p className="text-sm text-gray-500">Last updated: {res.updatedAt}</p>
            </div>
            
            <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => handleEdit(res.id)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium text-sm transition text-center"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDownload(res.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition text-center"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}