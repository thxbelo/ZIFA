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
    // HARDCODED STANDINGS FOR PRESENTATION
    const officialStandings: StandingRow[] = [
      { team_id: '1',  team_name: 'HWANGE FC',           mp: 5, w: 3, d: 2, l: 0, gf: 11, ga: 2, gd: 9, pts: 11 },
      { team_id: '2',  team_name: 'TALEN VISION FC',     mp: 5, w: 3, d: 2, l: 0, gf: 9,  ga: 3, gd: 6, pts: 11 },
      { team_id: '3',  team_name: 'BLACKROCK FC',        mp: 5, w: 3, d: 1, l: 1, gf: 7,  ga: 3, gd: 4, pts: 10 },
      { team_id: '4',  team_name: 'JORDAN FC',           mp: 5, w: 2, d: 3, l: 0, gf: 7,  ga: 4, gd: 3, pts: 9 },
      { team_id: '5',  team_name: 'NKAYI UNITED FC',     mp: 5, w: 2, d: 3, l: 0, gf: 5,  ga: 3, gd: 2, pts: 9 },
      { team_id: '6',  team_name: 'MEGAWATT FC',         mp: 5, w: 2, d: 2, l: 1, gf: 4,  ga: 2, gd: 2, pts: 8 },
      { team_id: '7',  team_name: 'BULAWAYO WARRIORS',   mp: 5, w: 2, d: 2, l: 1, gf: 7,  ga: 6, gd: 1, pts: 8 },
      { team_id: '8',  team_name: 'MOSI ROVERS FC',      mp: 5, w: 2, d: 2, l: 1, gf: 5,  ga: 5, gd: 0, pts: 8 },
      { team_id: '9',  team_name: 'CASMYN FC',           mp: 5, w: 2, d: 2, l: 1, gf: 2,  ga: 5, gd: -3, pts: 8 },
      { team_id: '10', team_name: 'VIC FALLS HERENTALS', mp: 5, w: 1, d: 3, l: 1, gf: 6,  ga: 7, gd: -1, pts: 6 },
      { team_id: '11', team_name: 'ZIM SAINTS FC',       mp: 5, w: 1, d: 2, l: 2, gf: 3,  ga: 3, gd: 0, pts: 5 },
      { team_id: '12', team_name: 'BULAWAYO CITY',       mp: 5, w: 1, d: 2, l: 2, gf: 4,  ga: 5, gd: -1, pts: 5 },
      { team_id: '13', team_name: 'NJUBE SPURS FC',      mp: 5, w: 1, d: 2, l: 2, gf: 3,  ga: 5, gd: -2, pts: 5 },
      { team_id: '14', team_name: 'KHAMI UNITED FC',     mp: 5, w: 1, d: 2, l: 2, gf: 4,  ga: 7, gd: -3, pts: 5 },
      { team_id: '15', team_name: 'IMBIZO FC',           mp: 5, w: 1, d: 2, l: 2, gf: 2,  ga: 6, gd: -4, pts: 5 },
      { team_id: '16', team_name: 'AQUA STARS FC',       mp: 5, w: 1, d: 1, l: 3, gf: 2,  ga: 5, gd: -3, pts: 4 },
      { team_id: '17', team_name: 'ZEBRA REVOLUTION FC', mp: 5, w: 0, d: 1, l: 4, gf: 0,  ga: 4, gd: -4, pts: 1 },
      { team_id: '18', team_name: 'BOSSO 90 FC',         mp: 5, w: 0, d: 0, l: 5, gf: 3,  ga: 9, gd: -6, pts: 0 },
    ];
    setStandings(officialStandings);
    setLoading(false);
    setRefreshing(false);
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

      {/* Hidden Export Template */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1, left: 0, top: 0 }}>
        <div
          ref={tableRef}
          className="geometric-watermark"
          style={{
            width: '1100px',
            backgroundColor: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <ExportWatermark />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header Pitch Backdrop */}
            <div style={{ 
              padding: '40px 60px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              color: '#ffffff', 
              position: 'relative', 
              overflow: 'hidden',
              minHeight: '280px'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url("/Header Picture.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0
              }}></div>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(1, 81, 39, 0.88)', 
                zIndex: 1
              }}></div>
              <div style={{
                position: 'absolute',
                inset: '0 0 0 0',
                background: 'linear-gradient(to top, #015127, transparent)',
                opacity: 0.6,
                zIndex: 2
              }}></div>

              <div style={{ width: '160px', height: '160px', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo-2.png" alt="Zifa Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              
              <div style={{ textAlign: 'center', flex: 1, padding: '0 30px', position: 'relative', zIndex: 10 }}>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '18px', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>
                  PACIFIC BREEZE
                </p>
                <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '56px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: '0.9', textTransform: 'uppercase', color: '#ffffff' }}>
                  SOUTHERN REGION<br />
                  <span style={{ color: '#39FF14' }}>SOCCER LEAGUE</span>
                </h1>
              </div>

              <div style={{ width: '160px', height: '160px', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', padding: '12px', border: '5px solid rgba(57, 255, 20, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src="/logo-1.jpg" alt="SRSL Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            </div>

            {/* Title Bar */}
            <div style={{ background: '#00A859', padding: '14px', textAlign: 'center', position: 'relative', zIndex: 20 }}>
              <span style={{ color: 'white', fontSize: '26px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'italic' }}>
                Week 5 Log Standing as at 19 April 2026
              </span>
            </div>

            {/* Table Area */}
            <div style={{ padding: '40px 60px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter', sans-serif" }}>
                <thead>
                  <tr style={{ background: '#015127', color: 'white' }}>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>POS</th>
                    <th style={{ padding: '18px', textAlign: 'left', fontWeight: 900, fontSize: '18px' }}>TEAM</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>P</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>W</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>D</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>L</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>F</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>A</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>GD</th>
                    <th style={{ padding: '18px', textAlign: 'center', fontWeight: 900, fontSize: '18px', background: '#FFD200', color: '#015127' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, idx) => {
                    const isQualification = idx === 0;
                    const isRelegation = idx >= standings.length - 4;
                    const bgColor = idx % 2 === 0 ? '#f9fafb' : '#ffffff';
                    
                    return (
                      <tr key={row.team_id} style={{ background: bgColor, borderBottom: '2px solid #f1f5f9' }}>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 900, fontSize: '18px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                            background: isQualification ? '#FFD200' : isRelegation ? '#ef4444' : '#e2e8f0',
                            color: isQualification ? '#015127' : isRelegation ? 'white' : '#475569'
                          }}>
                            {idx + 1}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 900, fontSize: '20px', textTransform: 'uppercase', color: isRelegation ? '#ef4444' : '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {row.logo_url && <img src={row.logo_url} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />}
                            {row.team_name}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '18px', color: '#475569' }}>{row.mp}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{row.w}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '18px', color: '#475569' }}>{row.d}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '18px', color: '#475569' }}>{row.l}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '18px', color: '#475569' }}>{row.gf}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '18px', color: '#475569' }}>{row.ga}</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 900, fontSize: '18px', color: row.gd > 0 ? '#00A859' : row.gd < 0 ? '#ef4444' : '#475569' }}>
                          {row.gd > 0 ? `+${row.gd}` : row.gd}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 900, fontSize: '24px', background: '#FFD200', color: '#015127' }}>{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: '24px', display: 'flex', gap: '30px', fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#FFD200' }}></div>
                  PSL Qualification
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444' }}></div>
                  Relegation Zone
                </div>
              </div>
            </div>

            {/* Footer Strip */}
            <div style={{ background: '#015127', padding: '25px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '8px solid #39FF14' }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  PACIFIC BREEZE LEAGUE OFFICIAL
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ background: '#39FF14', color: '#015127', padding: '4px 14px', borderRadius: '6px', fontSize: '16px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>
                    STANDINGS
                  </span>
                  <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em' }}>
                    UPDATED: {new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  background: '#FFD200', 
                  color: '#015127', 
                  fontWeight: 900, 
                  fontSize: '18px', 
                  textTransform: 'uppercase', 
                  padding: '16px 48px', 
                  borderRadius: '20px', 
                  boxShadow: '0 10px 30px rgba(255, 210, 0, 0.25)',
                  fontFamily: "'Barlow', sans-serif",
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}>
                  Follow Us!
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
