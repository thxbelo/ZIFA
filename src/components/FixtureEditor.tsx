import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Plus, Trash2, Edit3, Loader2, Calendar, Image as ImageIcon } from 'lucide-react';
import { getAuthHeaders, getAuthToken } from '@/store/authStore';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import ExportWatermark from './ExportWatermark';
import { useSocket } from '@/lib/socket';

interface Game {
  id: string;
  teamA: string;
  teamB: string;
  venue: string;
  time: string;
  homeScore?: number;
  awayScore?: number;
  status: 'not_started' | 'in_progress' | 'finished' | 'postponed';
  played: boolean;
  competition_id?: string;
}

interface DateGroup {
  id: string;
  dayLabel: string;   // e.g. "FRIDAY"
  dateLabel: string;  // e.g. "3 APRIL 2026"
  games: Game[];
}

export interface FixtureData {
  id?: string;
  league: string;
  sponsor: string;
  week: string;
  groups: DateGroup[];
}

const blankFixture: FixtureData = {
  league: 'SOUTHERN REGION SOCCER LEAGUE',
  sponsor: 'PACIFIC BREEZE',
  week: 'MATCH WEEK',
  groups: []
};

function genId() { return Math.random().toString(36).slice(2, 9); }

export default function FixtureEditor({ initialData, onClear }: { initialData?: FixtureData | null, onClear?: () => void }) {
  const [mode, setMode] = useState<'drafting' | 'scheduling'>('drafting');
  const [fixture, setFixture] = useState<FixtureData>(initialData || blankFixture);
  const [downloading, setDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFixtures, setSavedFixtures] = useState<any[]>([]);
  const captureRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  // Sync with initialData prop
  useEffect(() => {
    if (initialData) {
      setFixture(initialData);
      setMode('drafting');
    } else {
      setFixture(blankFixture);
    }
  }, [initialData]);

  const fetchSaved = async () => {
    try {
      const data = await apiFetch('/fixtures', { headers: getAuthHeaders() });
      setSavedFixtures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (mode === 'scheduling') {
      fetchSaved();
    }
  }, [mode]);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      if (mode === 'scheduling') {
        fetchSaved();
      }
    };

    socket.on('fixturesUpdate', handleRefresh);

    return () => {
      socket.off('fixturesUpdate', handleRefresh);
    };
  }, [socket, mode]);

  const saveToBackend = async (overwrite: boolean = false) => {
    setIsSaving(true);
    const toastId = toast.loading(overwrite ? 'Updating fixture...' : 'Saving as new...');
    try {
      const saveId = (overwrite && fixture.id) ? fixture.id : genId();
      
      // 1. Save the Fixture (Legacy/JSONB structure for preview)
      await apiFetch('/fixtures', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: saveId, week: fixture.week, data: { ...fixture, id: saveId } }),
      });

      // 2. Sync INDIVIDUAL matches to the new normalized table (For Live Log/Standings)
      // This ensures that current statuses/scores are synchronized immediately.
      for (const group of fixture.groups) {
        for (const game of group.games) {
          if (!game.teamA || !game.teamB) continue;
          await apiFetch('/matches', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: game.id,
              competition_id: 'comp-division-one', // Default
              home_team_id: game.teamA, // In a real app, this would be a UUID, but we use names for now
              away_team_id: game.teamB,
              date: group.dateLabel,
              venue: game.venue,
              time: game.time,
              match_week: fixture.week,
              status: game.status,
              home_score: game.homeScore || 0,
              away_score: game.awayScore || 0,
              played: game.played
            }),
          });
        }
      }
      
      setFixture(prev => ({ ...prev, id: saveId }));
      toast.success(overwrite ? 'Fixture updated!' : 'Fixture saved successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to save fixture:', err);
      toast.error((err as any)?.message || 'Error saving fixture.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const startNew = () => {
    if (window.confirm('Start a blank slate? Any unsaved changes will be lost.')) {
      setFixture(blankFixture);
      if (onClear) onClear();
    }
  };

  /* ── Download ────────────────────────────────────────────── */
  const downloadImage = async () => {
    if (!captureRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        skipFonts: true,
      });
      const link = document.createElement('a');
      link.download = `zifa-${fixture.week.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  /* ── Helpers ─────────────────────────────────────────────── */
  const updateField = (field: keyof FixtureData, value: string) =>
    setFixture(prev => ({ ...prev, [field]: value }));

  const updateGroup = (gid: string, field: keyof DateGroup, value: string) =>
    setFixture(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === gid ? { ...g, [field]: value } : g)
    }));

  const addGroup = () =>
    setFixture(prev => ({
      ...prev,
      groups: [...prev.groups, { id: genId(), dayLabel: 'SUNDAY', dateLabel: '5 APRIL 2026', games: [] }]
    }));

  const removeGroup = (gid: string) =>
    setFixture(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== gid) }));

  const addGame = (gid: string) =>
    setFixture(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === gid
          ? { 
              ...g, 
              games: [...g.games, { 
                id: genId(), 
                teamA: '', 
                teamB: '', 
                venue: '', 
                time: '15:00 HRS', 
                status: 'not_started', 
                played: false 
              }] 
            }
          : g
      )
    }));

  const removeGame = (gid: string, gaid: string) =>
    setFixture(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === gid ? { ...g, games: g.games.filter(ga => ga.id !== gaid) } : g
      )
    }));

  const updateGame = (gid: string, gaid: string, updates: Partial<Game>) =>
    setFixture(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === gid
          ? { ...g, games: g.games.map(ga => ga.id === gaid ? { ...ga, ...updates } : ga) }
          : g
      )
    }));

  return (
    <div className="space-y-6">
      {/* Unified Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden sm:block p-3 bg-green-50 rounded-2xl border border-green-100">
              <Calendar className="w-6 h-6 text-zifa-green" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zifa-green tracking-tight leading-none uppercase">Fixtures & Scheduling</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage match schedules and venues</p>
            </div>
            
            <div className="flex p-1 bg-gray-100 rounded-xl ml-2">
              <button
                onClick={() => setMode('drafting')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-tight",
                  mode === 'drafting' ? "bg-white text-zifa-green shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Drafting
              </button>
              <button
                onClick={() => setMode('scheduling')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-tight",
                  mode === 'scheduling' ? "bg-white text-zifa-green shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Scheduling
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
            {mode === 'drafting' && (
              <>
                <button onClick={startNew} className="text-gray-500 hover:text-gray-900 font-bold px-4 py-2.5 text-xs uppercase tracking-widest transition">
                  Clear
                </button>
                <label className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/20">
                  <ImageIcon className="w-4 h-4" />
                  Load PDF / Word
                  <input type="file" className="hidden" accept=".docx,.pdf" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    const toastId = toast.loading('Analyzing document...');
                    try {
                      const token = getAuthToken();
                      const res = await fetch(`${window.location.hostname === 'localhost' ? 'http://localhost:3001' : ''}/api/fixtures/upload`, {
                        method: 'POST',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                        body: formData
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      if (data.lines?.length) {
                        const validLines = data.lines.filter((l: string) => /\s+v\s+|\s+vs\s+|\s+-\s+/i.test(l));
                        if (validLines.length === 0) {
                          toast.error('Could not find matches (e.g. A vs B) in document.', { id: toastId });
                          return;
                        }
                        const newGames = validLines.slice(0, 30).map((line: string) => {
                          const parts = line.split(/\s+v\s+|\s+vs\s+|\s+-\s+/i);
                          return { id: genId(), teamA: parts[0]?.trim() || line, teamB: parts[1]?.trim() || 'TBA', venue: 'TBA', time: '15:00 HRS', status: 'not_started', played: false };
                        });
                        setFixture(prev => ({ ...prev, groups: [...prev.groups, { id: genId(), dayLabel: 'IMPORTED', dateLabel: 'VARIOUS', games: newGames }] }));
                        toast.success('Imported successfully!', { id: toastId });
                      }
                    } catch (err: any) { toast.error(err.message, { id: toastId }); }
                  }} />
                </label>
                {fixture.id && (
                  <button onClick={() => saveToBackend(true)} disabled={isSaving}
                    className="flex items-center gap-2 border-2 border-zifa-green text-zifa-green px-5 py-2.5 rounded-xl hover:bg-green-50 transition font-black text-xs uppercase tracking-widest disabled:opacity-60">
                    Update
                  </button>
                )}
                <button onClick={() => saveToBackend(false)} disabled={isSaving}
                  className="bg-zifa-yellow text-zifa-green px-5 py-2.5 rounded-xl hover:bg-yellow-500 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/20 disabled:opacity-60">
                  {isSaving ? 'Saving...' : 'Save New'}
                </button>
              </>
            )}
            
            <button onClick={downloadImage} disabled={downloading}
              className="flex items-center gap-2 bg-zifa-green text-white px-5 py-2.5 rounded-xl hover:bg-green-800 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 disabled:opacity-60">
              <Download className="w-4 h-4" />
              {downloading ? 'Exporting…' : 'Download PNG'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── LEFT: Mode-based Controls ── */}
        <div className="space-y-5">
          {mode === 'scheduling' ? (
            /* Scheduling Mode: List of saved fixtures to pick from */
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                 <h3 className="font-black text-gray-700 uppercase tracking-tight">Select Match Week to Schedule</h3>
                 <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded tracking-widest uppercase">{savedFixtures.length} Total</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {savedFixtures.length === 0 ? (
                  <p className="text-center py-10 text-gray-400 text-sm italic">No fixtures saved yet. Create one in Drafting mode.</p>
                ) : (
                  savedFixtures.map(sf => (
                    <button
                      key={sf.id}
                      onClick={() => { setFixture({ ...sf.data, id: sf.id }); setMode('drafting'); }}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-green-50 rounded-xl border border-transparent hover:border-green-200 transition group"
                    >
                      <div className="text-left">
                        <p className="font-black text-zifa-green uppercase text-sm">{sf.week}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sf.data.groups.length} Match Days</p>
                      </div>
                      <Edit3 className="w-4 h-4 text-gray-300 group-hover:text-zifa-green transition" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Drafting Mode: Normal Editor Controls */
            <>
              {/* Header fields */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2 tracking-tight"><Edit3 className="w-4 h-4 text-zifa-green" /> Header Configuration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sponsor / League Title</label>
                    <input value={fixture.sponsor} onChange={e => updateField('sponsor', e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008751] outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Match Week Label</label>
                    <input value={fixture.week} onChange={e => updateField('week', e.target.value)}
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008751] outline-none font-bold" />
                  </div>
                </div>
              </div>

              {/* Date groups */}
              {fixture.groups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 mr-3">
                      <input
                        value={group.dayLabel}
                        onChange={e => updateGroup(group.id, 'dayLabel', e.target.value)}
                        placeholder="DAY (e.g. FRIDAY)"
                        className="w-full sm:w-1/2 border rounded-lg px-3 py-1.5 text-sm font-black uppercase focus:ring-2 focus:ring-[#008751] outline-none"
                      />
                      <input
                        value={group.dateLabel}
                        onChange={e => updateGroup(group.id, 'dateLabel', e.target.value)}
                        placeholder="DATE (e.g. 3 APRIL 2026)"
                        className="w-full sm:w-1/2 border rounded-lg px-3 py-1.5 text-sm font-black uppercase focus:ring-2 focus:ring-[#008751] outline-none"
                      />
                    </div>
                    <button onClick={() => removeGroup(group.id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

              <div className="space-y-3">
                {group.games.map((game) => (
                  <div key={game.id} className="relative group bg-gray-50 rounded-xl p-3 space-y-2 border border-transparent hover:border-green-200 transition">
                    <button onClick={() => removeGame(group.id, game.id)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={game.teamA} onChange={e => updateGame(group.id, game.id, { teamA: e.target.value })}
                        placeholder="Home Team" className="w-full sm:flex-1 border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                      <div className="hidden sm:flex items-center justify-center w-6 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">VS</div>
                      <input value={game.teamB} onChange={e => updateGame(group.id, game.id, { teamB: e.target.value })}
                        placeholder="Away Team" className="w-full sm:flex-1 border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={game.venue} onChange={e => updateGame(group.id, game.id, { venue: e.target.value })}
                        placeholder="Venue" className="w-full sm:flex-[2] border rounded-lg px-2 py-1.5 text-xs uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                      <input value={game.time} onChange={e => updateGame(group.id, game.id, { time: e.target.value })}
                        placeholder="15:00 HRS" className="w-full sm:flex-1 border rounded-lg px-2 py-1.5 text-xs uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                    </div>
                    
                    {/* Scores & Status (New) */}
                    <div className="bg-white/50 rounded-lg p-2 border border-dashed border-gray-200 space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Outcome & Status</span>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={game.played} 
                            onChange={e => updateGame(group.id, game.id, { played: e.target.checked, status: e.target.checked ? 'finished' : game.status })}
                            className="w-3 h-3 accent-[#008751]" 
                          />
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Played</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1">
                          <span className="text-[9px] font-bold text-gray-400">H</span>
                          <input 
                            type="number" 
                            value={game.homeScore || 0} 
                            onChange={e => updateGame(group.id, game.id, { homeScore: parseInt(e.target.value) || 0 })}
                            className="w-full text-xs font-black text-center outline-none" 
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1">
                          <span className="text-[9px] font-bold text-gray-400">A</span>
                          <input 
                            type="number" 
                            value={game.awayScore || 0} 
                            onChange={e => updateGame(group.id, game.id, { awayScore: parseInt(e.target.value) || 0 })}
                            className="w-full text-xs font-black text-center outline-none" 
                          />
                        </div>
                        <select 
                          value={game.status} 
                          onChange={e => updateGame(group.id, game.id, { status: e.target.value as any })}
                          className="bg-white border rounded-lg px-1 py-1 text-[10px] font-bold text-gray-600 outline-none"
                        >
                          <option value="not_started">UPCOMING</option>
                          <option value="in_progress">LIVE</option>
                          <option value="finished">FINISHED</option>
                          <option value="postponed">POSTPONED</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => addGame(group.id)}
                  className="w-full flex items-center justify-center gap-1 text-[#008751] hover:bg-green-50 rounded-xl py-2 text-sm font-semibold border border-dashed border-green-300 transition">
                  <Plus className="w-4 h-4" /> Add Match
                </button>
              </div>
            </div>
          ))}

          <button onClick={addGroup}
            className="w-full flex items-center justify-center gap-2 text-[#008751] bg-white hover:bg-green-50 rounded-xl py-3 font-bold border border-dashed border-green-300 transition">
            <Plus className="w-4 h-4" /> Add Date Group
          </button>
        </>
      )}
    </div>
        <div className="sticky top-24">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">Export Preview (Scaled 60%)</p>
          <div className="bg-gray-200 rounded-3xl p-4 md:p-6 overflow-x-auto overflow-y-hidden w-full flex shadow-inner border border-gray-300 scrollbar-thin scrollbar-thumb-gray-400">
            {/* Scale only for on-screen preview; capture uses the unscaled inner element */}
            <div style={{ transform: 'scale(1)', transformOrigin: 'top left', minWidth: '850px' }} className="mx-auto sm:scale-[0.6] sm:origin-top center">
              <div
                ref={captureRef}
                className="geometric-watermark"
                style={{
                  width: '850px',
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: '#F8F9FA',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  position: 'relative'
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
                  minHeight: '340px'
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
                    backgroundColor: 'rgba(1, 81, 39, 0.88)', // brand-green-dark
                    zIndex: 1
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    inset: '0 0 0 0',
                    background: 'linear-gradient(to top, #015127, transparent)',
                    opacity: 0.6,
                    zIndex: 2
                  }}></div>

                  <div style={{ width: '180px', height: '180px', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo-2.png" alt="Zifa Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  
                  <div style={{ textAlign: 'center', flex: 1, padding: '0 30px', position: 'relative', zIndex: 10 }}>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginBottom: '12px' }}>
                      {fixture.sponsor}
                    </p>
                    <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '64px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: '0.9', textTransform: 'uppercase', color: '#ffffff' }}>
                      SOUTHERN REGION<br />
                      <span style={{ color: '#39FF14' }}>SOCCER LEAGUE</span>
                    </h1>
                  </div>

                  <div style={{ width: '180px', height: '180px', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', padding: '12px', border: '6px solid rgba(57, 255, 20, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src="/logo-1.jpg" alt="SRSL Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                </div>

                {/* Fixture Type Banner */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '20px', padding: '24px 60px', background: '#F8F9FA', position: 'relative', zIndex: 20 }}>
                  <div style={{
                    flex: 1,
                    background: '#015127',
                    color: '#ffffff',
                    padding: '14px 24px',
                    fontWeight: 900,
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '22px',
                    letterSpacing: '0.2em',
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: '3px solid #00A859',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {fixture.week.toUpperCase()}
                  </div>
                  <div style={{
                    background: '#39FF14',
                    color: '#015127',
                    padding: '14px 44px',
                    fontWeight: 900,
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '32px',
                    letterSpacing: '0.1em',
                    fontStyle: 'italic',
                    borderRadius: '12px',
                    boxShadow: '0 10px 20px rgba(57, 255, 20, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    FIXTURE
                  </div>
                </div>

                {/* Main Content Body */}
                <div style={{ padding: '40px 60px 60px', minHeight: '400px' }}>
                  {fixture.groups.map((group, gi) => (
                    <div key={group.id} style={{ marginBottom: gi === fixture.groups.length - 1 ? 0 : '60px' }}>
                      {/* Date Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '3px solid rgba(1, 81, 39, 0.1)', paddingBottom: '16px', marginBottom: '32px' }}>
                         <div style={{ background: '#015127', color: 'white', padding: '8px 16px', borderRadius: '12px', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.7 }}>DAY</p>
                            <p style={{ fontSize: '24px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>{group.dayLabel[0]}</p>
                         </div>
                         <div>
                            <p style={{ color: '#999', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{group.dayLabel}</p>
                            <h3 style={{ color: '#015127', fontSize: '36px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", textTransform: 'uppercase', lineHeight: 1 }}>{group.dateLabel}</h3>
                         </div>
                      </div>

                      {/* Games List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {group.games.map((game) => (
                          <div key={game.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ flex: 1, background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                              <div style={{ flex: 1, textAlign: 'right', textTransform: 'uppercase', fontWeight: 900, fontSize: '20px', color: '#000' }}>{game.teamA}</div>
                              <div style={{ width: '60px', textAlign: 'center', color: '#999', fontWeight: 900, fontSize: '14px', fontStyle: 'italic' }}>VS</div>
                              <div style={{ flex: 1, textAlign: 'left', textTransform: 'uppercase', fontWeight: 900, fontSize: '20px', color: '#000' }}>{game.teamB}</div>
                            </div>
                            
                            {/* Venue & Time Pillars */}
                            <div style={{ display: 'flex', width: '380px', gap: '10px' }}>
                              <div style={{ flex: 1, background: 'white', border: '2px solid rgba(1, 81, 39, 0.1)', padding: '12px', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <p style={{ color: '#015127', fontSize: '10px', fontWeight: 900, opacity: 0.5, letterSpacing: '0.1em' }}>VENUE</p>
                                <p style={{ color: '#000', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{game.venue || 'TBA'}</p>
                              </div>
                              <div style={{ width: '110px', background: '#015127', padding: '12px', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 20px rgba(1, 81, 39, 0.2)' }}>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em' }}>TIME</p>
                                <p style={{ color: '#39FF14', fontSize: '14px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>{game.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Strip */}
                <div style={{ 
                  background: '#015127', 
                  padding: '40px 60px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderTop: '10px solid #39FF14', 
                  position: 'relative' 
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      PACIFIC BREEZE LEAGUE OFFICIAL
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ background: '#39FF14', color: '#015127', padding: '4px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>
                        FIXTURES
                      </span>
                      <p style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em' }}>
                        {fixture.week.toUpperCase()} SCHEDULE
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      background: '#FFD200', 
                      color: '#015127', 
                      fontWeight: 900, 
                      fontSize: '16px', 
                      textTransform: 'uppercase', 
                      padding: '14px 40px', 
                      borderRadius: '16px', 
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
        </div>
      </div>
    </div>
  );
}
