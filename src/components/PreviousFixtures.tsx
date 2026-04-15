import React, { useState, useEffect } from 'react';
import { Download, Edit3, Trash2, Calendar, Eye } from 'lucide-react';
import { FixtureData } from './FixtureEditor';
import { cn } from '@/lib/utils';
import { getAuthHeaders } from '@/store/authStore';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';
interface SavedFixture {
  id: string;
  week: string;
  data: FixtureData;
  timestamp?: string; // We can add this to the DB if we want, but week is primary for now
}

export default function PreviousFixtures({ onEdit }: { onEdit: (data: FixtureData) => void }) {
  const [fixtures, setFixtures] = useState<SavedFixture[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFixtures = async () => {
    try {
      const data = await apiFetch('/fixtures', { headers: getAuthHeaders() });
      setFixtures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch fixtures:', err);
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fixture? This action cannot be undone.')) return;

    const toastId = toast.loading('Deleting historical fixture...');
    try {
      await apiFetch(`/fixtures/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setFixtures(prev => prev.filter(f => f.id !== id));
      toast.success('Fixture deleted.', { id: toastId });
    } catch (err) {
      console.error('Failed to delete fixture:', err);
      toast.error('Error connecting to server.', { id: toastId });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your history...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fixtures.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">No fixtures saved yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">Create your first match schedule in the Fixture Generator tab.</p>
          </div>
        ) : (
          fixtures.map((fixture) => (
            <div key={fixture.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
               {/* Small Preview Mockup */}
               <div className="h-32 bg-zifa-green/5 flex items-center justify-center relative border-b border-gray-50 overflow-hidden">
                  <div className="transform scale-[0.2] origin-center opacity-40 group-hover:opacity-60 transition-opacity">
                    <div className="bg-white p-4 rounded shadow-2xl" style={{ width: '794px' }}>
                      <div className="flex justify-between items-center mb-4">
                        <img src="/logo-2.png" className="w-20 h-20" alt="" />
                        <h2 className="text-4xl font-black text-zifa-green">SOUTHERN REGION</h2>
                        <img src="/logo-1.jpg" className="w-20 h-20" alt="" />
                      </div>
                      <div className="h-10 bg-zifa-yellow rounded mb-4" />
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-100 rounded w-full" />)}
                      </div>
                    </div>
                  </div>
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                    <button 
                      onClick={() => onEdit(fixture.data)}
                      className="bg-white text-zifa-green px-4 py-2 rounded-lg font-bold text-xs shadow-lg flex items-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" /> Edit / View
                    </button>
                 </div>
               </div>

               <div className="p-5">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h4 className="font-bold text-gray-900 leading-tight">{fixture.week}</h4>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                       {fixture.data.groups.length} Date Groups
                     </p>
                   </div>
                   <button 
                     onClick={() => handleDelete(fixture.id)}
                     className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>

                 <div className="flex items-center justify-between gap-3">
                   <div className="flex -space-x-2">
                      {/* Fake avatars for visual flair */}
                      {[1, 2].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100" />
                      ))}
                   </div>
                   <button 
                    onClick={() => onEdit(fixture.data)}
                    className="text-xs font-bold text-zifa-green hover:underline flex items-center gap-1"
                   >
                     Open in Generator
                   </button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
