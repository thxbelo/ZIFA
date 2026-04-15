import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/store/authStore';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface Match {
  id: string;
  teamA: string;
  scoreA: string | number;
  teamB: string;
  scoreB: string | number;
  venue: string;
  time: string;
}

interface MatchDay {
  id: string;
  date: string;
  label: 'RESULTS' | 'FIXTURE';
  matches: Match[];
}

export interface ResultsData {
  id?: string;
  week: string;
  division: string;
  days: MatchDay[];
}

const blankResults: ResultsData = {
  week: 'MATCH WEEK 3',
  division: 'DIVISION ONE',
  days: []
};

function genId() { return Math.random().toString(36).slice(2, 9); }

export default function ResultsEditor({ initialData, onClear }: { initialData?: ResultsData | null, onClear?: () => void }) {
  const [results, setResults] = useState<ResultsData>(initialData || blankResults);
  const [downloading, setDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData) {
      setResults(initialData);
    } else {
      setResults(blankResults);
    }
  }, [initialData]);

  const saveToBackend = async (overwrite: boolean = false) => {
    setIsSaving(true);
    const toastId = toast.loading(overwrite ? 'Updating results...' : 'Saving as new...');
    try {
      const saveId = (overwrite && results.id) ? results.id : genId();
      await apiFetch('/results', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: saveId, week: results.week, division: results.division, data: { ...results, id: saveId } }),
      });
      
      setResults(prev => ({ ...prev, id: saveId }));
      toast.success(overwrite ? 'Results updated!' : 'Results saved successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to save results:', err);
      toast.error((err as any)?.message || 'Error saving results.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const startNew = () => {
    if (window.confirm('Start a blank slate? Any unsaved changes will be lost.')) {
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
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-[#008751]">Weekly Results Editor</h2>
          <p className="text-sm text-gray-500">Update results and download as a high-res image.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={startNew} className="text-gray-500 hover:text-gray-700 font-semibold px-2 py-2.5 text-sm">
            Clear Slate
          </button>
          
          {results.id && (
            <button
              onClick={() => saveToBackend(true)}
              disabled={isSaving}
              className="flex items-center gap-2 border border-[#008751] text-[#008751] px-5 py-2.5 rounded-lg hover:bg-green-50 transition font-semibold disabled:opacity-60"
            >
              Update Live
            </button>
          )}

          <button
            onClick={() => saveToBackend(false)}
            disabled={isSaving}
            className="flex items-center gap-2 bg-zifa-yellow text-zifa-green px-5 py-2.5 rounded-lg hover:bg-yellow-500 transition font-semibold disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save as New'}
          </button>
          
          <button
            onClick={downloadImage}
            disabled={downloading}
            className="flex items-center gap-2 bg-[#008751] text-white px-5 py-2.5 rounded-lg hover:bg-green-800 transition font-semibold disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Capturing…' : 'Download PNG'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* LEFT: Editor */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Header Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Division Name</label>
                <input value={results.division} onChange={e => updateField('division', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008751] outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Match Week Title</label>
                <input value={results.week} onChange={e => updateField('week', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008751] outline-none" />
              </div>
            </div>
          </div>

          {results.days.map((day) => (
            <div key={day.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <input
                  value={day.date}
                  onChange={e => updateDay(day.id, 'date', e.target.value)}
                  placeholder="DATE (e.g. FRIDAY 3 APRIL 2026)"
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none"
                />
                <select 
                  value={day.label}
                  onChange={e => updateDay(day.id, 'label', e.target.value as any)}
                  className="border rounded-lg px-2 py-1.5 text-sm font-bold bg-gray-50 outline-none"
                >
                  <option value="RESULTS">RESULTS</option>
                  <option value="FIXTURE">FIXTURE</option>
                </select>
                <button onClick={() => removeDay(day.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {day.matches.map((match) => (
                  <div key={match.id} className="relative group bg-gray-50 rounded-xl p-4 space-y-3 border border-transparent hover:border-green-200 transition">
                    <button onClick={() => removeMatch(day.id, match.id)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <input value={match.teamA} onChange={e => updateMatch(day.id, match.id, 'teamA', e.target.value)}
                        placeholder="Home Team" className="col-span-4 border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                      <input value={match.scoreA} onChange={e => updateMatch(day.id, match.id, 'scoreA', e.target.value)}
                        placeholder="0" className="col-span-1 border rounded-lg px-2 py-1.5 text-xs text-center font-black focus:ring-2 focus:ring-[#008751] outline-none" />
                      <div className="col-span-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">VS</div>
                      <input value={match.scoreB} onChange={e => updateMatch(day.id, match.id, 'scoreB', e.target.value)}
                        placeholder="0" className="col-span-1 border rounded-lg px-2 py-1.5 text-xs text-center font-black focus:ring-2 focus:ring-[#008751] outline-none" />
                      <input value={match.teamB} onChange={e => updateMatch(day.id, match.id, 'teamB', e.target.value)}
                        placeholder="Away Team" className="col-span-4 border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input value={match.venue} onChange={e => updateMatch(day.id, match.id, 'venue', e.target.value)}
                        placeholder="Venue" className="col-span-2 border rounded-lg px-2 py-1.5 text-xs uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                      <input value={match.time} onChange={e => updateMatch(day.id, match.id, 'time', e.target.value)}
                        placeholder="15:00 HRS" className="border rounded-lg px-2 py-1.5 text-xs uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                    </div>
                  </div>
                ))}
                <button onClick={() => addMatch(day.id)}
                  className="w-full flex items-center justify-center gap-1 text-[#008751] hover:bg-green-50 rounded-xl py-2 text-sm font-semibold border border-dashed border-green-300 transition">
                  <Plus className="w-4 h-4" /> Add Match Result
                </button>
              </div>
            </div>
          ))}

          <button onClick={addDay}
            className="w-full flex items-center justify-center gap-2 text-[#008751] bg-white hover:bg-green-50 rounded-xl py-3 font-bold border border-dashed border-green-300 transition">
            <Plus className="w-4 h-4" /> Add Match Day
          </button>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="sticky top-24">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">Export Preview (Scaled 55%)</p>
          <div className="bg-gray-200 rounded-3xl p-8 overflow-hidden flex justify-center shadow-inner border border-gray-300">
            <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', width: '850px' }}>
              <div 
                ref={captureRef} 
                className="geometric-watermark"
                style={{ 
                  width: '850px', 
                  backgroundColor: '#F8F9FA', 
                  boxShadow: '0 40px 100px rgba(0,0,0,0.3)', 
                  fontFamily: "'Inter', sans-serif",
                  overflow: 'hidden'
                }}
              >
                
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
                      PACIFIC BREEZE
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

                {/* Division Tag */}
                <div style={{ background: '#00A859', padding: '12px', textAlign: 'center', position: 'relative', zIndex: 20 }}>
                  <span style={{ color: 'white', fontSize: '26px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'italic' }}>
                    {results.division}
                  </span>
                </div>

                {/* Week Header */}
                <div style={{ background: '#015127', padding: '20px', textAlign: 'center', borderTop: '5px solid white', position: 'relative', zIndex: 10 }}>
                  <h2 style={{ color: 'white', fontSize: '48px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                    {results.week}
                  </h2>
                </div>

                {/* Main Results Grid */}
                <div style={{ padding: '60px', minHeight: '400px' }}>
                  {results.days.map((day, dIdx) => (
                    <div key={day.id} style={{ marginBottom: dIdx === results.days.length - 1 ? 0 : '60px' }}>
                      {/* Day Heading */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', borderBottom: '3px solid rgba(1, 81, 39, 0.1)', paddingBottom: '16px', marginBottom: '32px' }}>
                        <div style={{ background: '#015127', color: 'white', padding: '8px 16px', borderRadius: '12px', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.7 }}>DAY</p>
                            <p style={{ fontSize: '24px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>{day.date.split(' ')[0][0]}</p>
                        </div>
                        <div>
                          <p style={{ color: '#999', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{day.date.split(' ')[0]}</p>
                          <h3 style={{ color: '#015127', fontSize: '36px', fontWeight: 900, fontFamily: "'Barlow', sans-serif", textTransform: 'uppercase', lineHeight: 1 }}>{day.date.split(' ').slice(1).join(' ')}</h3>
                        </div>
                        <div style={{ marginLeft: 'auto', background: day.label === 'RESULTS' ? '#015127' : '#39FF14', padding: '8px 24px', borderRadius: '30px', color: day.label === 'RESULTS' ? 'white' : '#015127' }}>
                          <span style={{ fontWeight: 900, fontSize: '20px', fontFamily: "'Barlow', sans-serif", letterSpacing: '0.1em' }}>{day.label}</span>
                        </div>
                      </div>

                      {/* Match Rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {day.matches.map((match) => (
                          <div key={match.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ flex: 1, background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                              <div style={{ flex: 1, textAlign: 'right', textTransform: 'uppercase', fontWeight: 900, fontSize: '20px', color: '#000' }}>{match.teamA}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F9FA', padding: '8px 20px', borderRadius: '15px', border: '1px solid #eee' }}>
                                <span style={{ color: '#015127', fontSize: '36px', fontWeight: 900, width: '45px', textAlign: 'center' }}>{match.scoreA}</span>
                                <span style={{ color: '#DDD', fontSize: '14px', fontWeight: 900 }}>VS</span>
                                <span style={{ color: '#015127', fontSize: '36px', fontWeight: 900, width: '45px', textAlign: 'center' }}>{match.scoreB}</span>
                              </div>
                              <div style={{ flex: 1, textAlign: 'left', textTransform: 'uppercase', fontWeight: 900, fontSize: '20px', color: '#000' }}>{match.teamB}</div>
                            </div>
                            
                            {/* Venue & Time Pillars */}
                            <div style={{ display: 'flex', width: '380px', gap: '10px' }}>
                              <div style={{ flex: 1, background: 'white', border: '2px solid rgba(1, 81, 39, 0.1)', padding: '12px', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <p style={{ color: '#015127', fontSize: '10px', fontWeight: 900, opacity: 0.5, letterSpacing: '0.1em' }}>VENUE</p>
                                <p style={{ color: '#000', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{match.venue}</p>
                              </div>
                              <div style={{ width: '110px', background: '#015127', padding: '12px', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 20px rgba(1, 81, 39, 0.2)' }}>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em' }}>TIME</p>
                                <p style={{ color: '#39FF14', fontSize: '14px', fontWeight: 900, fontFamily: "'Barlow', sans-serif" }}>{match.time}</p>
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
                        RESULTS
                      </span>
                      <p style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em' }}>
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
    </div>
  );
}
