import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Calendar, Layout, Loader2, Trophy } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { getAuthHeaders } from '@/store/authStore';
import { toast } from 'sonner';
import { ResultsData } from './ResultsEditor';
import { useSocket } from '@/lib/socket';

interface SavedResult {
  id: string;
  week: string;
  division: string;
  data: ResultsData;
}

export default function PreviousResults({ onEdit }: { onEdit: (data: ResultsData) => void }) {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => {
      fetchResults();
    };
    socket.on('resultsUpdate', handleRefresh);
    socket.on('matchUpdate', handleRefresh);
    return () => {
      socket.off('resultsUpdate', handleRefresh);
      socket.off('matchUpdate', handleRefresh);
    };
  }, [socket]);

  const fetchResults = async () => {
    try {
      const data = await apiFetch('/results');
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      toast.error('Could not load results history.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResult = async (id: string) => {
    if (!window.confirm('Delete this match week from history?')) return;
    
    const toastId = toast.loading('Deleting...');
    try {
      await apiFetch(`/results/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setResults(prev => prev.filter(r => r.id !== id));
      toast.success('Results removed.', { id: toastId });
    } catch (err) {
      toast.error('Failed to delete.', { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
        <Loader2 className="w-8 h-8 text-[#008751] animate-spin" />
        <p className="text-gray-500 mt-4 font-medium animate-pulse">Loading results history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#008751] transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 flex gap-1 transform translate-x-full group-hover:translate-x-0 transition-transform">
                <button onClick={() => onEdit({ ...result.data, id: result.id })} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 shadow-sm border border-blue-100">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteResult(result.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shadow-sm border border-red-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#008751] bg-opacity-10 rounded-xl flex items-center justify-center text-[#008751]">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 leading-none">{result.week}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{result.division}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#008751]" />
                  {result.data.days.length} Match Days
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Layout className="w-3.5 h-3.5 text-[#008751]" />
                  {result.data.days.reduce((acc, d) => acc + d.matches.length, 0)} Matches Total
                </div>
              </div>
              
              <button 
                onClick={() => onEdit({ ...result.data, id: result.id })}
                className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#008751] bg-[#008751] bg-opacity-5 hover:bg-opacity-10 border border-[#008751] border-opacity-10 transition-colors"
              >
                Open in Editor
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Trophy className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">No results history</h3>
            <p className="text-gray-400 text-sm">Save your first match week update to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
