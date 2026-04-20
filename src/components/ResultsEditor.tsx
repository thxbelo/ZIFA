import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Trophy, LayoutDashboard, Plus, Trash2, Edit3, Loader2, Save } from 'lucide-react';
import LeagueTableSection from './LeagueTableSection';
import { getAuthHeaders } from '@/store/authStore';
import { apiFetch } from '@/lib/apiClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ExportWatermark from './ExportWatermark';

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: string;
  scoreB: string;
  venue: string;
  time: string;
}

export interface MatchDay {
  id: string;
  date: string;
  label: 'RESULTS' | 'FIXTURE';
  matches: Match[];
}

export interface ResultsData {
  id?: string;
  division: string;
  week: string;
  days: MatchDay[];
}

export const blankResults: ResultsData = {
  division: 'SOUTHERN REGION SOCCER LEAGUE',
  week: 'MATCH WEEK',
  days: []
};

function genId() { return Math.random().toString(36).slice(2, 9); }

export default function ResultsEditor({ initialData, onClear }: { initialData?: ResultsData | null, onClear?: () => void }) {
  const [mode, setMode] = useState<'results' | 'table'>('results');
  const [results, setResults] = useState<ResultsData>(initialData || blankResults);
  const [unplayedMatches, setUnplayedMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // Dynamic layout flag
  const totalMatches = results.days.reduce((acc, d) => acc + d.matches.length, 0);
  const isDense = totalMatches > 6;
  const containerWidth = isDense ? '1700px' : '1100px';

  useEffect(() => {
    if (initialData) {
      setResults(initialData);
      setMode('results');
    } else {
      setResults(blankResults);
    }
  }, [initialData]);

  const fetchUnplayed = async () => {
    try {
      const data = await apiFetch('/matches?unplayed=true', { headers: getAuthHeaders() });
      setUnplayedMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await apiFetch('/teams', { headers: getAuthHeaders() });
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (mode === 'results') {
      fetchUnplayed();
    }
  }, [mode]);

  const saveToBackend = async (overwrite: boolean = false) => {
    setIsSaving(true);
    const toastId = toast.loading(overwrite ? 'Updating recap...' : 'Saving recap...');
    try {
      const saveId = (overwrite && results.id) ? results.id : genId();
      await apiFetch('/results', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: saveId, week: results.week, division: results.division, data: { ...results, id: saveId } }),
      });
      
      // Sync matches to the actual backend table so the League Table updates automatically
      for (const day of results.days) {
        if (day.label !== 'RESULTS') continue; // Only log actual played results
        for (const match of day.matches) {
          if (!match.teamA || !match.teamB) continue; // Skip empty rows
          await apiFetch('/matches', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: match.id,
              competition_id: 'comp-division-one', 
              home_team_id: match.teamA,
              away_team_id: match.teamB,
              date: day.date,
              venue: match.venue || 'TBA',
              time: match.time || '15:00 HRS',
              match_week: results.week,
              status: 'finished',
              home_score: parseInt(match.scoreA) || 0,
              away_score: parseInt(match.scoreB) || 0,
              played: true
            }),
          });
        }
      }
      
      setResults(prev => ({ ...prev, id: saveId }));
      toast.success(overwrite ? 'Result recap updated!' : 'Result recap saved!', { id: toastId });
    } catch (err) {
      console.error('Failed to save results:', err);
      toast.error((err as any)?.message || 'Error saving results.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllQuickScores = async () => {
    const toUpdate = unplayedMatches.filter(m => {
      const h = (document.getElementById(`h-${m.id}`) as HTMLInputElement)?.value;
      const a = (document.getElementById(`a-${m.id}`) as HTMLInputElement)?.value;
      return h !== '' && a !== '';
    });

    if (toUpdate.length === 0) {
      toast.error('No scores entered to save.');
      return;
    }

    const toastId = toast.loading(`Saving ${toUpdate.length} scores...`);
    setIsSaving(true);
    try {
      for (const m of toUpdate) {
        const h = (document.getElementById(`h-${m.id}`) as HTMLInputElement)?.value;
        const a = (document.getElementById(`a-${m.id}`) as HTMLInputElement)?.value;
        await apiFetch(`/matches/${m.id}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            home_score: parseInt(h) || 0,
            away_score: parseInt(a) || 0,
            played: true,
            status: 'finished'
          }),
        });
      }
      toast.success('All scores saved successfully!', { id: toastId });
      fetchUnplayed();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const updateMatchScore = async (matchId: string, hScore: number, aScore: number) => {
    const toastId = toast.loading('Calculating standings...');
    try {
      await apiFetch(`/matches/${matchId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          home_score: hScore,
          away_score: aScore,
          played: true,
          status: 'finished'
        }),
      });
      toast.success('Standings updated!', { id: toastId });
      fetchUnplayed();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const startNew = () => {
    if (window.confirm('Start a blank recap? Any unsaved changes will be lost.')) {
      setResults(blankResults);
      if (onClear) onClear();
    }
  };

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
      link.download = `zifa-results-${results.week.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate image');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Helpers ─────────────────────────────────────────────── */
  const updateField = (field: keyof ResultsData, value: string) =>
    setResults(prev => ({ ...prev, [field]: value }));

  const updateDay = (did: string, field: keyof MatchDay, value: string) =>
    setResults(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === did ? { ...d, [field]: value } : d)
    }));

  const addDay = () =>
    setResults(prev => ({
      ...prev,
      days: [...prev.days, { id: genId(), date: 'FRIDAY 3 APRIL 2026', label: 'RESULTS', matches: [] }]
    }));

  const removeDay = (did: string) =>
    setResults(prev => ({ ...prev, days: prev.days.filter(d => d.id !== did) }));

  const addMatch = (did: string) =>
    setResults(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === did
          ? { ...d, matches: [...d.matches, { id: genId(), teamA: '', scoreA: '0', teamB: '', scoreB: '0', venue: '', time: '15:00 HRS' }] }
          : d
      )
    }));

  const removeMatch = (did: string, mid: string) =>
    setResults(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === did ? { ...d, matches: d.matches.filter(m => m.id !== mid) } : d
      )
    }));

  const updateMatch = (did: string, mid: string, field: keyof Match, value: string) =>
    setResults(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === did
          ? { ...d, matches: d.matches.map(m => m.id === mid ? { ...m, [field]: value } : m) }
          : d
      )
    }));

  return (
    <div className="space-y-6">
      {/* Unified Results Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden sm:block p-3 bg-zifa-yellow/10 rounded-2xl border border-zifa-yellow/20">
              <Trophy className="w-6 h-6 text-zifa-green" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zifa-green tracking-tight leading-none uppercase">Results & Standings</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Update scores and monitor the table</p>
            </div>
            
            <div className="flex p-1 bg-gray-100 rounded-xl ml-2">
              <button
                onClick={() => setMode('results')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-tight",
                  mode === 'results' ? "bg-white text-zifa-green shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Result Entry
              </button>
              <button
                onClick={() => setMode('table')}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-tight",
                  mode === 'table' ? "bg-white text-zifa-green shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Log Table
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 w-full xl:w-auto">
            {mode === 'results' && (
              <>
                <button onClick={startNew} className="text-gray-500 hover:text-gray-900 font-bold px-4 py-2.5 text-xs uppercase tracking-widest transition">
                  Clear Recap
                </button>
                {results.id && (
                  <button onClick={() => saveToBackend(true)} disabled={isSaving}
                    className="flex items-center gap-2 border-2 border-zifa-green text-zifa-green px-5 py-2.5 rounded-xl hover:bg-green-50 transition font-black text-xs uppercase tracking-widest disabled:opacity-60">
                    Update Recap
                  </button>
                )}
                <button onClick={() => saveToBackend(false)} disabled={isSaving}
                  className="bg-zifa-yellow text-zifa-green px-5 py-2.5 rounded-xl hover:bg-yellow-500 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/20 disabled:opacity-60">
                  {isSaving ? 'Saving...' : 'Save Recap'}
                </button>
                <button onClick={downloadImage} disabled={downloading}
                  className="flex items-center gap-2 bg-zifa-green text-white px-5 py-2.5 rounded-xl hover:bg-green-800 transition font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 disabled:opacity-60">
                  <Download className="w-4 h-4" />
                  {downloading ? 'Exporting…' : 'Export Recap'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── LEFT: Mode-based Hub ── */}
        <div className="space-y-6">
          {mode === 'table' ? (
            <div className="col-span-full animate-in fade-in slide-in-from-bottom-4 duration-500">
               <LeagueTableSection />
            </div>
          ) : (
            <>
              {/* Quick Score Entry */}
              {unplayedMatches.length > 0 && (
                <div className="bg-white rounded-2xl border border-zifa-yellow/30 shadow-lg shadow-yellow-500/5 p-6 animate-in slide-in-from-left-4 duration-500">
                  <div className="flex items-center justify-between border-b pb-4 mb-5">
                    <div>
                      <h3 className="font-black text-zifa-green uppercase tracking-tight flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-zifa-yellow" /> Quick Score Entry
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Enter goals for scheduled matches</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="bg-zifa-yellow/10 text-zifa-green text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-center">
                        {unplayedMatches.length} Pending
                      </span>
                      <button 
                        onClick={saveAllQuickScores}
                        disabled={isSaving}
                        className="bg-zifa-green text-white text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest hover:bg-green-800 transition shadow-sm disabled:opacity-50"
                      >
                        {isSaving ? 'Saving All...' : 'Save All Entered'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {unplayedMatches.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-transparent hover:border-zifa-yellow/20 transition group">
                        <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                          <div className="w-full sm:w-[40%] text-center sm:text-right text-xs font-black text-gray-700 uppercase leading-none">{m.teamA || m.home_team_name || m.teamA_name || m.home_team_id}</div>
                          
                          <div className="flex items-center gap-2 shrink-0 my-1 sm:my-0">
                            <input 
                              type="number" 
                              id={`h-${m.id}`}
                              placeholder="0"
                              className="w-12 h-10 bg-white border-2 border-gray-100 rounded-lg text-center font-black text-zifa-green focus:border-zifa-yellow outline-none transition"
                            />
                            <span className="text-[10px] font-black text-gray-300">VS</span>
                            <input 
                              type="number" 
                              id={`a-${m.id}`}
                              placeholder="0"
                              className="w-12 h-10 bg-white border-2 border-gray-100 rounded-lg text-center font-black text-zifa-green focus:border-zifa-yellow outline-none transition"
                            />
                          </div>

                          <div className="w-full sm:w-[40%] text-center sm:text-left text-xs font-black text-gray-700 uppercase leading-none">{m.teamB || m.away_team_name || m.teamB_name || m.away_team_id}</div>
                        </div>

                        <button
                          onClick={() => {
                            const h = (document.getElementById(`h-${m.id}`) as HTMLInputElement)?.value;
                            const a = (document.getElementById(`a-${m.id}`) as HTMLInputElement)?.value;
                            updateMatchScore(m.id, parseInt(h) || 0, parseInt(a) || 0);
                          }}
                          className="p-2.5 bg-zifa-green text-white rounded-lg hover:bg-green-800 transition shadow-md shadow-green-900/10"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Header Details */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-black text-gray-700 uppercase tracking-tight flex items-center gap-2"><Edit3 className="w-4 h-4 text-zifa-green" /> Recap Configuration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Division Name</label>
                    <input value={results.division} onChange={e => updateField('division', e.target.value)}
                      className="mt-1 w-full border-2 border-gray-50 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-zifa-green outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Match Week Title</label>
                    <input value={results.week} onChange={e => updateField('week', e.target.value)}
                      className="mt-1 w-full border-2 border-gray-50 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-zifa-green outline-none" />
                  </div>
                </div>
              </div>

              {/* Day Editor */}
              {results.days.map((day) => (
                <div key={day.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <input
                      value={day.date}
                      onChange={e => updateDay(day.id, 'date', e.target.value)}
                      placeholder="DATE (e.g. FRIDAY 3 APRIL 2026)"
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm font-black uppercase focus:ring-2 focus:ring-zifa-green outline-none"
                    />
                    <select 
                      value={day.label}
                      onChange={e => updateDay(day.id, 'label', e.target.value as any)}
                      className="border rounded-lg px-2 py-1.5 text-xs font-black bg-gray-50 outline-none uppercase"
                    >
                      <option value="RESULTS">RESULTS</option>
                      <option value="FIXTURE">FIXTURE</option>
                    </select>
                    <button onClick={() => removeDay(day.id)} className="text-gray-300 hover:text-red-500 p-1 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {day.matches.map((match) => (
                      <div key={match.id} className="relative group bg-gray-50 rounded-xl p-4 space-y-3 border border-transparent hover:border-zifa-green/10 transition">
                        <button onClick={() => removeMatch(day.id, match.id)}
                          className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <select value={match.teamA} onChange={e => updateMatch(day.id, match.id, 'teamA', e.target.value)}
                            className="w-full sm:flex-1 border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-zifa-green outline-none">
                            <option value="">Home Team</option>
                            {match.teamA && !teams.find(t => t.name.toUpperCase() === match.teamA.toUpperCase()) && (
                              <option value={match.teamA}>{match.teamA}</option>
                            )}
                            {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                            <input value={match.scoreA} onChange={e => updateMatch(day.id, match.id, 'scoreA', e.target.value)}
                              placeholder="0" className="w-12 border rounded-lg px-2 py-1.5 text-xs text-center font-black focus:ring-2 focus:ring-zifa-green outline-none" />
                            <div className="w-6 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">VS</div>
                            <input value={match.scoreB} onChange={e => updateMatch(day.id, match.id, 'scoreB', e.target.value)}
                              placeholder="0" className="w-12 border rounded-lg px-2 py-1.5 text-xs text-center font-black focus:ring-2 focus:ring-zifa-green outline-none" />
                          </div>
                          <select value={match.teamB} onChange={e => updateMatch(day.id, match.id, 'teamB', e.target.value)}
                            className="w-full sm:flex-1 border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-zifa-green outline-none">
                            <option value="">Away Team</option>
                            {match.teamB && !teams.find(t => t.name.toUpperCase() === match.teamB.toUpperCase()) && (
                              <option value={match.teamB}>{match.teamB}</option>
                            )}
                            {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addMatch(day.id)}
                      className="w-full flex items-center justify-center gap-1 text-zifa-green hover:bg-green-50 rounded-xl py-2 text-xs font-black uppercase border-2 border-dashed border-zifa-green/20 transition">
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={addDay}
                className="w-full flex items-center justify-center gap-2 text-zifa-green bg-white hover:bg-green-50 rounded-xl py-4 font-black uppercase text-sm border-2 border-dashed border-zifa-green/30 transition">
                <Plus className="w-4 h-4" /> Add Match Day
              </button>
            </>
          )}
        </div>

        {/* ── RIGHT: Preview ── */}
        {mode === 'results' && (
          <div className="sticky top-24 animate-in fade-in slide-in-from-right-4 duration-500">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">Export Preview (Scaled 55%)</p>
            <div className="bg-gray-200 rounded-3xl p-4 md:p-8 overflow-x-auto overflow-y-hidden w-full flex shadow-inner border border-gray-300 scrollbar-thin scrollbar-thumb-gray-400">
              <div style={{ transform: 'scale(1)', transformOrigin: 'top left', minWidth: '1100px' }} className="mx-auto sm:scale-[0.5] sm:origin-top center">
                <div 
                  ref={captureRef} 
                  className="geometric-watermark"
                  style={{ 
                    width: containerWidth, 
                    backgroundColor: '#F8F9FA', 
                    boxShadow: '0 40px 100px rgba(0,0,0,0.3)', 
                    fontFamily: "'Inter', sans-serif",
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <ExportWatermark />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                  
                  {/* Header Pitch Backdrop */}
                  <div style={{ 
                    padding: '25px 60px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    color: '#ffffff', 
                    position: 'relative', 
                    overflow: 'hidden',
                    minHeight: '220px'
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

                    <div style={{ width: '120px', height: '120px', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src="/logo-2.png" alt="Zifa Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    
                    <div style={{ textAlign: 'center', flex: 1, padding: '0 30px', position: 'relative', zIndex: 10 }}>
                      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '14px', fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>
                        PACIFIC BREEZE
                      </p>
                      <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '44px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: '0.9', textTransform: 'uppercase', color: '#ffffff' }}>
                        SOUTHERN REGION<br />
                        <span style={{ color: '#39FF14' }}>SOCCER LEAGUE</span>
                      </h1>
                    </div>

                    <div style={{ width: '120px', height: '120px', flexShrink: 0, position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', padding: '10px', border: '4px solid rgba(57, 255, 20, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src="/logo-1.jpg" alt="SRSL Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    </div>
                  </div>

                  {/* Division Tag */}
                  <div style={{ background: '#00A859', padding: '8px', textAlign: 'center', position: 'relative', zIndex: 20 }}>
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'italic' }}>
                      {results.division}
                    </span>
                  </div>

                  {/* Week Header */}
                  <div style={{ background: '#015127', padding: '15px', textAlign: 'center', borderTop: '4px solid white', position: 'relative', zIndex: 10 }}>
                    <h2 style={{ color: 'white', fontSize: '32px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                      {results.week}
                    </h2>
                  </div>

                  {/* Main Results Grid */}
                  <div style={{ padding: '40px 60px', minHeight: '300px' }}>
                    {results.days.map((day, dIdx) => (
                      <div key={day.id} style={{ marginBottom: dIdx === results.days.length - 1 ? 0 : '40px' }}>
                        {/* Day Heading */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '2px solid rgba(1, 81, 39, 0.1)', paddingBottom: '12px', marginBottom: '24px' }}>
                          <div style={{ background: '#015127', color: 'white', padding: '6px 12px', borderRadius: '10px', textAlign: 'center' }}>
                              <p style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.7 }}>DAY</p>
                              <p style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>{day.date.split(' ')[0][0]}</p>
                          </div>
                          <div>
                            <p style={{ color: '#999', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{day.date.split(' ')[0]}</p>
                            <h3 style={{ color: '#015127', fontSize: '28px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", textTransform: 'uppercase', lineHeight: 1 }}>{day.date.split(' ').slice(1).join(' ')}</h3>
                          </div>
                          <div style={{ marginLeft: 'auto', background: day.label === 'RESULTS' ? '#015127' : '#39FF14', padding: '6px 20px', borderRadius: '30px', color: day.label === 'RESULTS' ? 'white' : '#015127' }}>
                            <span style={{ fontWeight: 900, fontSize: '16px', fontFamily: "'Barlow', sans-serif", letterSpacing: '0.1em' }}>{day.label}</span>
                          </div>
                        </div>

                        {/* Match Rows */}
                        <div style={{ display: 'grid', gridTemplateColumns: isDense ? 'repeat(2, 1fr)' : '1fr', gap: isDense ? '12px 24px' : '12px' }}>
                          {day.matches.map((match) => (
                            <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: isDense ? '10px' : '14px' }}>
                              <div style={{ flex: 1, background: 'white', padding: isDense ? '12px 16px' : '16px 24px', borderRadius: '15px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                                <div style={{ flex: 1, textAlign: 'right', textTransform: 'uppercase', fontWeight: 900, fontSize: isDense ? '14px' : '16px', color: '#000' }}>{match.teamA}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F9FA', padding: isDense ? '4px 12px' : '6px 16px', borderRadius: '12px', border: '1px solid #eee' }}>
                                  <span style={{ color: '#015127', fontSize: isDense ? '20px' : '24px', fontWeight: 900, width: isDense ? '30px' : '35px', textAlign: 'center' }}>{match.scoreA}</span>
                                  <span style={{ color: '#DDD', fontSize: '11px', fontWeight: 900 }}>VS</span>
                                  <span style={{ color: '#015127', fontSize: isDense ? '20px' : '24px', fontWeight: 900, width: isDense ? '30px' : '35px', textAlign: 'center' }}>{match.scoreB}</span>
                                </div>
                                <div style={{ flex: 1, textAlign: 'left', textTransform: 'uppercase', fontWeight: 900, fontSize: isDense ? '14px' : '16px', color: '#000' }}>{match.teamB}</div>
                              </div>
                              
                              {/* Venue & Time Pillars */}
                              <div style={{ display: 'flex', width: isDense ? '220px' : '300px', gap: '8px' }}>
                                <div style={{ flex: 1, background: 'white', border: '1.5px solid rgba(1, 81, 39, 0.1)', padding: isDense ? '6px' : '10px', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <p style={{ color: '#015127', fontSize: '8px', fontWeight: 900, opacity: 0.5, letterSpacing: '0.1em' }}>VENUE</p>
                                  <p style={{ color: '#000', fontSize: isDense ? '9px' : '10px', fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{match.venue}</p>
                                </div>
                                <div style={{ width: isDense ? '75px' : '90px', background: '#015127', padding: isDense ? '6px' : '10px', borderRadius: '15px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 20px rgba(1, 81, 39, 0.2)' }}>
                                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em' }}>TIME</p>
                                  <p style={{ color: '#39FF14', fontSize: isDense ? '11px' : '12px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>{match.time}</p>
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
                    padding: '25px 60px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderTop: '8px solid #39FF14', 
                    position: 'relative' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '4px' }}>
                        PACIFIC BREEZE LEAGUE OFFICIAL
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#39FF14', color: '#015127', padding: '3px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>
                          RESULTS
                        </span>
                        <p style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>
                          {results.week.toUpperCase()} OFFICIAL RECAP
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
        )}
      </div>
    </div>
  );
}
