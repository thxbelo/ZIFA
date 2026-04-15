import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/store/authStore';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';

interface Game {
  id: string;
  teamA: string;
  teamB: string;
  venue: string;
  time: string;
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
  const [fixture, setFixture] = useState<FixtureData>(initialData || blankFixture);
  const [downloading, setDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // Sync with initialData prop (important for 'Edit' from history)
  useEffect(() => {
    if (initialData) {
      setFixture(initialData);
    } else {
      setFixture(blankFixture);
    }
  }, [initialData]);

  const saveToBackend = async (overwrite: boolean = false) => {
    setIsSaving(true);
    const toastId = toast.loading(overwrite ? 'Updating fixture...' : 'Saving as new...');
    try {
      const saveId = (overwrite && fixture.id) ? fixture.id : genId();
      await apiFetch('/fixtures', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: saveId, week: fixture.week, data: { ...fixture, id: saveId } }),
      });
      
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
        // Workaround for some browsers returning undefined fontFamily during webfont embedding (crashes inside html-to-image).
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
          ? { ...g, games: [...g.games, { id: genId(), teamA: '', teamB: '', venue: '', time: '15:00 HRS' }] }
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

  const updateGame = (gid: string, gaid: string, field: keyof Game, value: string) =>
    setFixture(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === gid
          ? { ...g, games: g.games.map(ga => ga.id === gaid ? { ...ga, [field]: value } : ga) }
          : g
      )
    }));

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-[#008751]">Fixture Generator</h2>
          <p className="text-sm text-gray-500">Edit below — live preview updates instantly.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startNew}
            className="text-gray-500 hover:text-gray-700 font-semibold px-2 py-2.5 text-sm"
          >
            Clear Slate
          </button>
          
          {fixture.id && (
            <button
              onClick={() => saveToBackend(true)}
              disabled={isSaving}
              className="flex items-center gap-2 border border-[#008751] text-[#008751] px-5 py-2.5 rounded-lg hover:bg-green-50 transition font-semibold disabled:opacity-60"
            >
              Update Original
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
            {downloading ? 'Generating…' : 'Download PNG'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── LEFT: Editor Controls ── */}
        <div className="space-y-5">
          {/* Header fields */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Header</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sponsor / Title Line</label>
                <input value={fixture.sponsor} onChange={e => updateField('sponsor', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008751] outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Match Week</label>
                <input value={fixture.week} onChange={e => updateField('week', e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#008751] outline-none" />
              </div>
            </div>
          </div>

          {/* Date groups */}
          {fixture.groups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 gap-3 flex-1 mr-3">
                  <input
                    value={group.dayLabel}
                    onChange={e => updateGroup(group.id, 'dayLabel', e.target.value)}
                    placeholder="DAY (e.g. FRIDAY)"
                    className="border rounded-lg px-3 py-1.5 text-sm font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none"
                  />
                  <input
                    value={group.dateLabel}
                    onChange={e => updateGroup(group.id, 'dateLabel', e.target.value)}
                    placeholder="DATE (e.g. 3 APRIL 2026)"
                    className="border rounded-lg px-3 py-1.5 text-sm font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none"
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
                    <div className="grid grid-cols-2 gap-2">
                      <input value={game.teamA} onChange={e => updateGame(group.id, game.id, 'teamA', e.target.value)}
                        placeholder="Home Team" className="border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                      <input value={game.teamB} onChange={e => updateGame(group.id, game.id, 'teamB', e.target.value)}
                        placeholder="Away Team" className="border rounded-lg px-2 py-1.5 text-xs font-bold uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={game.venue} onChange={e => updateGame(group.id, game.id, 'venue', e.target.value)}
                        placeholder="Venue" className="col-span-2 border rounded-lg px-2 py-1.5 text-xs uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
                      <input value={game.time} onChange={e => updateGame(group.id, game.id, 'time', e.target.value)}
                        placeholder="15:00 HRS" className="border rounded-lg px-2 py-1.5 text-xs uppercase focus:ring-2 focus:ring-[#008751] outline-none" />
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
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div className="sticky top-24">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 text-center">Export Preview (Scaled 60%)</p>
          <div className="bg-gray-200 rounded-3xl p-6 overflow-hidden flex justify-center shadow-inner border border-gray-300">
            {/* Scale only for on-screen preview; capture uses the unscaled inner element */}
            <div style={{ transform: 'scale(0.6)', transformOrigin: 'top center', width: '850px' }}>
              <div
                ref={captureRef}
                className="geometric-watermark"
                style={{
                  width: '850px',
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: '#F8F9FA',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.3)',
                  overflow: 'hidden'
                }}
              >
                {/* Header Pitch Backdrop */}
                <div style={{ 
                  padding: '50px 60px', 
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
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(1, 81, 39, 0.85)', // brand-green-dark
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    inset: '0 0 0 0',
                    background: 'linear-gradient(to top, #015127, transparent)',
                    opacity: 0.5
                  }}></div>

                  <div style={{ width: '130px', height: '130px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
                    <img src="/logo-2.png" alt="Zifa Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ textAlign: 'center', flex: 1, padding: '0 30px', position: 'relative', zIndex: 10 }}>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.9, marginBottom: '8px' }}>{fixture.sponsor}</p>
                    <h1 style={{ fontFamily: "'Barlow', sans-serif", fontSize: '64px', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: '0.8', textTransform: 'uppercase', color: '#ffffff' }}>
                      SOUTHERN REGION<br />
                      <span style={{ color: '#39FF14' }}>SOCCER LEAGUE</span>
                    </h1>
                  </div>
                  <div style={{ width: '130px', height: '130px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
                    <img src="/logo-1.jpg" alt="SRSL Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%', background: 'white', padding: '6px', border: '5px solid rgba(57, 255, 20, 0.2)' }} />
                  </div>
                </div>

                {/* Fixture Type Banner */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '15px', padding: '20px 60px', background: '#F8F9FA', position: 'relative', zIndex: 20 }}>
                  <div style={{
                    flex: 1,
                    background: '#015127',
                    color: '#ffffff',
                    padding: '12px 24px',
                    fontWeight: 900,
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '24px',
                    letterSpacing: '0.3em',
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: '3px solid #00A859',
                  }}>
                    {fixture.week.toUpperCase()}
                  </div>
                  <div style={{
                    background: '#39FF14',
                    color: '#015127',
                    padding: '12px 36px',
                    fontWeight: 900,
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '32px',
                    letterSpacing: '0.1em',
                    fontStyle: 'italic',
                    borderRadius: '12px',
                    boxShadow: '0 10px 20px rgba(57, 255, 20, 0.2)'
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
                <div style={{ background: '#015127', padding: '30px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '8px solid rgba(57, 255, 20, 0.2)', position: 'relative' }}>
                  <div>
                    <p style={{ color: '#fff', fontSize: '11px', fontWeight: 900, letterSpacing: '0.4em', opacity: 0.8, marginBottom: '5px' }}>
                      PACIFIC BREEZE LEAGUE OFFICIAL FIXTURE
                    </p>
                    <p style={{ color: '#39FF14', fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', borderLeft: '2px solid #39FF14', paddingLeft: '12px' }}>
                      {fixture.week.toUpperCase()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: '#2E5BFF', color: 'white', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', padding: '12px 30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(46, 91, 255, 0.3)' }}>
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
