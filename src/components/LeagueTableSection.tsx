import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Download, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { toPng } from 'html-to-image';
import { apiFetch } from '@/lib/apiClient';
import { useSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ExportWatermark from './ExportWatermark';
import LiveDataState from './LiveDataState';

interface StandingRow {
  team_id: string;
  team_name: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  logo_url?: string;
}

export default function LeagueTableSection() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { socket } = useSocket();
  const tableRef = useRef<HTMLDivElement>(null);

  const COMP_ID = 'comp-division-one';

  const fetchStandings = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await apiFetch(`/standings/${COMP_ID}`);
      setStandings(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to fetch standings:', err);
      setStandings([]);
      setLoadError('The league table could not be loaded from the live standings service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStandings('initial');
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = (data?: { competitionId?: string }) => {
      if (!data?.competitionId || data.competitionId === COMP_ID) {
        fetchStandings('refresh');
      }
    };

    socket.on('standingsUpdate', handleRefresh);

    return () => {
      socket.off('standingsUpdate', handleRefresh);
    };
  }, [socket]);

  const downloadTableImage = async () => {
    if (!tableRef.current || standings.length === 0) return;

    setExporting(true);
    const toastId = toast.loading('Generating standings image...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(tableRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement && node.tagName.toLowerCase() === 'img') {
            if ((node as HTMLImageElement).src.includes('dicebear')) return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `zifa-standings-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Standings image downloaded!', { id: toastId });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to generate image', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <LiveDataState
        icon={RefreshCw}
        title="Loading live table"
        description="We are pulling the latest standings and goal totals from the database."
        loading
      />
    );
  }

  if (loadError) {
    return (
      <LiveDataState
        icon={RefreshCw}
        title="League table unavailable"
        description={loadError}
        actionLabel="Retry table sync"
        onAction={() => fetchStandings('initial')}
        tone="warning"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zifa-green text-zifa-yellow shadow-inner">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">RESULTS & STANDINGS</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">Update scores and monitor the table</p>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <button className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50">
            RESULT ENTRY
          </button>
          <button className="px-4 py-2 rounded-lg bg-zifa-green text-white text-xs font-bold">
            LOG TABLE
          </button>
        </div>
      </div>

      {/* League Standings Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zifa-green text-zifa-yellow">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">League Standings</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Southern Region Division One - 2026 Season</p>
          </div>
          <button
            onClick={downloadTableImage}
            disabled={exporting || standings.length === 0}
            className="ml-auto flex items-center gap-2 rounded-xl bg-zifa-green px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-green-800 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </button>
        </div>

        {standings.length === 0 ? (
          <LiveDataState
            icon={Trophy}
            title="No standings published yet"
            description="Standings will appear here after results are saved against played matches in this competition."
            actionLabel="Refresh standings"
            onAction={() => fetchStandings('initial')}
            tone="muted"
          />
        ) : (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Compact Table - Responsive */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zifa-green text-white">
                    <th className="px-4 py-3 text-left font-black text-xs w-12">Pos</th>
                    <th className="px-4 py-3 text-left font-black text-xs">Team</th>
                    <th className="px-4 py-3 text-center font-black text-xs">P</th>
                    <th className="px-4 py-3 text-center font-black text-xs">W</th>
                    <th className="px-4 py-3 text-center font-black text-xs">D</th>
                    <th className="px-4 py-3 text-center font-black text-xs">L</th>
                    <th className="px-4 py-3 text-center font-black text-xs">F</th>
                    <th className="px-4 py-3 text-center font-black text-xs">A</th>
                    <th className="px-4 py-3 text-center font-black text-xs">GD</th>
                    <th className="px-4 py-3 text-center font-black text-xs bg-zifa-yellow text-zifa-green w-12">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, idx) => {
                    const isQualification = idx === 0;
                    const isRelegation = idx >= standings.length - 4;
                    const bgColor = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
                    
                    return (
                      <tr key={row.team_id} style={{ background: bgColor }} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-black text-center">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mx-auto",
                            isQualification ? "bg-zifa-yellow text-zifa-green" : 
                            isRelegation ? "bg-red-500 text-white" : 
                            "bg-gray-200 text-gray-600"
                          )}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-black text-gray-900">
                          <div className="flex items-center gap-2">
                            {row.logo_url && (
                              <img 
                                src={row.logo_url} 
                                alt={row.team_name}
                                className="w-5 h-5 object-contain flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                            <span className={isRelegation ? "text-red-600 font-black" : ""}>{row.team_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{row.mp}</td>
                        <td className="px-4 py-3 text-center text-gray-600 font-semibold">{row.w}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{row.d}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{row.l}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{row.gf}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{row.ga}</td>
                        <td className={cn(
                          "px-4 py-3 text-center font-black",
                          row.gd > 0 ? "text-zifa-green" : row.gd < 0 ? "text-red-600" : "text-gray-600"
                        )}>
                          {row.gd > 0 ? `+${row.gd}` : row.gd}
                        </td>
                        <td className="px-4 py-3 text-center font-black bg-zifa-yellow text-zifa-green">{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex gap-6 text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zifa-yellow"></div>
                <span>PSL Qualification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Relegation Zone</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
