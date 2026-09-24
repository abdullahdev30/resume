'use client';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  category: string;
  image: string;
}

const templates: Template[] = [
  { id: '1', name: 'Professional Modern', category: 'ATS Friendly', image: '/images/t1.png' },
  { id: '2', name: 'Creative Designer', category: 'Creative', image: '/images/t2.png' },
  { id: '3', name: 'Minimalist Clean', category: 'Simple', image: '/images/t3.png' },
  { id: '4', name: 'Executive Corporate', category: 'Classic', image: '/images/t4.png' },
];

export default function TemplatesPage() {
  const router = useRouter();

  const handleSelectTemplate = (id: string): void => {
    router.push(`/editor/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Select a Resume Template</h1>
      <p className="text-gray-600 mb-8">Choose a design to start building your professional resume.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition flex flex-col">
            <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400 font-medium">
              [Preview: {tpl.name}]
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{tpl.category}</span>
              <h3 className="text-lg font-bold text-gray-800 mb-4">{tpl.name}</h3>
              <button 
                onClick={() => handleSelectTemplate(tpl.id)}
                className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}