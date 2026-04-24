import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Edit3, Trash2, Calendar, Layout, Loader2, Trophy } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { getAuthHeaders } from '@/store/authStore';
import { toast } from 'sonner';
import { ResultsData } from './ResultsEditor';
import { useSocket } from '@/lib/socket';
import LeagueExportCard from './export/LeagueExportCard';

interface SavedResult {
  id: string;
  week: string;
  division: string;
  data: ResultsData;
}

export default function PreviousResults({ onEdit }: { onEdit: (data: ResultsData) => void }) {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportTarget, setExportTarget] = useState<SavedResult | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
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

  const groupedResults = results.reduce<Record<string, SavedResult[]>>((groups, result) => {
    const week = result.week || 'Unassigned Week';
    groups[week] = groups[week] || [];
    groups[week].push(result);
    return groups;
  }, {});

  const weekGroups = Object.entries(groupedResults).map(([week, items]: [string, SavedResult[]]) => ({
    week,
    items: items.sort((a, b) => (b.id || '').localeCompare(a.id || '')),
  }));

  const downloadArchivedResult = async (result: SavedResult) => {
    setExportingId(result.id);
    setExportTarget(result);
    const toastId = toast.loading('Preparing archived export...');

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!exportRef.current) throw new Error('Archive export preview was not ready.');

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        skipFonts: true,
      });

      const link = document.createElement('a');
      link.download = `zifa-results-${result.week.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Archived export downloaded.', { id: toastId });
    } catch (err: any) {
      console.error('Archive export failed:', err);
      toast.error(err?.message || 'Failed to generate archived export.', { id: toastId });
    } finally {
      setExportingId(null);
      setExportTarget(null);
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
      <div
        aria-hidden="true"
        className="fixed -left-[9999px] top-0 pointer-events-none"
        style={{ width: 900, height: 1269, overflow: 'hidden' }}
      >
        {exportTarget && (
          <LeagueExportCard
            ref={exportRef}
            sponsor="PACIFIC BREEZE"
            league={exportTarget.division}
            division="DIVISION ONE"
            title="MATCH RESULTS"
            week={exportTarget.week}
            groups={exportTarget.data.days}
            variant="results"
          />
        )}
      </div>

      {results.length > 0 ? (
        <div className="space-y-8">
          {weekGroups.map(({ week, items }) => (
            <section key={week} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-brand-green uppercase tracking-tight">{week}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {items.reduce((acc, result) => acc + result.data.days.length, 0)} matchdays archived
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#008751]">
                  {items.length} export{items.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((result) => (
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
                  {result.data.days.length} Matchdays
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Layout className="w-3.5 h-3.5 text-[#008751]" />
                  {result.data.days.reduce((acc, d) => acc + d.matches.length, 0)} Matches Total
                </div>
                <div className="rounded-xl bg-gray-50 p-3 space-y-1">
                  {result.data.days.map((day) => (
                    <div key={day.id} className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase text-gray-500">
                      <span className="truncate">{day.date}</span>
                      <span className="shrink-0 text-[#008751]">{day.matches.length} match{day.matches.length === 1 ? '' : 'es'}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => onEdit({ ...result.data, id: result.id })}
                className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#008751] bg-[#008751] bg-opacity-5 hover:bg-opacity-10 border border-[#008751] border-opacity-10 transition-colors"
              >
                Open in Editor
              </button>
              <button
                onClick={() => downloadArchivedResult(result)}
                disabled={exportingId === result.id}
                className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#008751] hover:bg-green-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {exportingId === result.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing PNG
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Download PNG
                  </>
                )}
              </button>
            </div>
                ))}
              </div>
            </section>
          ))}
        </div>
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
  );
}
