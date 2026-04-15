import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, MapPin, Clock, Plus, X, Trophy, Shield, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, getAuthHeaders } from '@/store/authStore';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/apiClient';

const matchSchema = z.object({
  teamA: z.string().min(2, 'Home team Name is too short'),
  teamB: z.string().min(2, 'Away team Name is too short'),
  venue: z.string().min(3, 'Venue Name is too short'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  category: z.enum(['League', 'Cup']),
});

type MatchForm = z.infer<typeof matchSchema>;

interface Match {
  id: string;
  date: string;
  teamA: string;
  teamB: string;
  venue: string;
  time: string;
  category: 'League' | 'Cup';
}

export default function CalendarSection() {
  const { isAuthenticated } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 3));
  const [matches, setMatches] = useState<Match[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
    defaultValues: { teamA: '', teamB: '', venue: '', time: '15:00', category: 'League' }
  });
  
  const selectedCategory = watch('category');

  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    try {
      const data = await apiFetch('/matches');
      if (!Array.isArray(data)) throw new Error('Invalid matches payload');
      setMatches(data);
    } catch {
      setMatches([
        { id: '1', date: '2026-04-03', teamA: 'Nkayi Utd', teamB: 'Bulawayo City', venue: 'White City Stadium', time: '15:00', category: 'League' },
        { id: '2', date: '2026-04-03', teamA: 'Indlovu FC', teamB: 'Zim Saints FC', venue: 'Llewellin Stadium', time: '15:00', category: 'Cup' },
        { id: '3', date: '2026-04-04', teamA: 'Njube Spurs', teamB: 'Aqua Stars FC', venue: 'White City Stadium', time: '15:00', category: 'League' },
        { id: '4', date: '2026-04-10', teamA: 'Highlanders', teamB: 'Dynamos', venue: 'Barbourfields', time: '15:00', category: 'League' },
      ]);
    }
  };

  const addMatch = async (values: MatchForm) => {
    setIsSubmitting(true);
    const toastId = toast.loading('Adding match to schedule...');
    
    const match: Match = {
      id: crypto.randomUUID(),
      date: format(selectedDate, 'yyyy-MM-dd'),
      ...values,
    };
    
    try {
      await apiFetch('/matches', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(match) });
      setMatches(prev => [...prev, match]);
      toast.success(`${match.teamA} vs ${match.teamB} added!`, { id: toastId });
      reset();
      setShowAddForm(false);
    } catch {
      toast.error('Network error. Could not reach server.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMatch = async (id: string) => {
    if (!window.confirm('Delete this match?')) return;
    
    const toastId = toast.loading('Deleting match...');
    try { 
      await apiFetch(`/matches/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setMatches(prev => prev.filter(m => m.id !== id));
      toast.success('Match removed.', { id: toastId });
    } catch { 
      toast.error('Error connecting to server.', { id: toastId });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const matchesOnSelectedDate = matches.filter(m => { try { return isSameDay(parseISO(m.date), selectedDate); } catch { return false; } });
  const hasMatchOnDay = (day: Date) => matches.some(m => { try { return isSameDay(parseISO(m.date), day); } catch { return false; } });
  const getCategoryOnDay = (day: Date) => {
    const dayMatches = matches.filter(m => { try { return isSameDay(parseISO(m.date), day); } catch { return false; } });
    const hasCup = dayMatches.some(m => m.category === 'Cup');
    const hasLeague = dayMatches.some(m => m.category === 'League');
    return { hasCup, hasLeague };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-zifa-green">{format(currentMonth, 'MMMM yyyy')}</h3>
            {!isAuthenticated && (
              <p className="text-xs text-gray-400 mt-0.5">View-only mode — login to add or edit matches</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 bg-zifa-yellow rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">League</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 bg-zifa-green rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cup</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">{day}</div>
          ))}
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const { hasCup, hasLeague } = getCategoryOnDay(day);
            return (
              <button key={day.toString()} onClick={() => setSelectedDate(day)}
                className={cn("bg-white p-3 h-20 relative hover:bg-gray-50 transition-all flex flex-col items-start",
                  !isSameMonth(day, currentMonth) && "text-gray-300",
                  isSelected && "ring-2 ring-zifa-green ring-inset z-10"
                )}
              >
                <span className={cn("text-sm font-bold", isSelected && "text-zifa-green")}>{format(day, 'd')}</span>
                {(hasLeague || hasCup) && (
                  <div className="mt-auto w-full flex flex-col gap-0.5">
                    {hasLeague && <div className="h-1.5 w-full bg-zifa-yellow rounded-full" />}
                    {hasCup && <div className="h-1.5 w-full bg-zifa-green rounded-full" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Match Details Sidebar */}
      <div className="space-y-6">
        <div className="bg-zifa-green p-6 rounded-2xl text-white shadow-lg">
          <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Schedule for</h4>
          <h3 className="text-2xl font-black">{format(selectedDate, 'EEEE, d MMMM')}</h3>
        </div>

        {/* Only show Add Match button to admins */}
        {isAuthenticated && (
          <button onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-zifa-green text-white py-3 rounded-xl font-semibold hover:bg-green-800 transition">
            <Plus className="w-4 h-4" /> Add Match
          </button>
        )}

        {showAddForm && isAuthenticated && (
          <form onSubmit={handleSubmit(addMatch)} className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm">New Match on {format(selectedDate, 'MMM d')}</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-1">
              <input {...register('teamA')} placeholder="Home Team"
                className={cn("w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none", errors.teamA && "border-red-500")} />
              {errors.teamA && <p className="text-[10px] text-red-500 font-bold">{errors.teamA.message}</p>}
            </div>

            <div className="space-y-1">
              <input {...register('teamB')} placeholder="Away Team"
                className={cn("w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none", errors.teamB && "border-red-500")} />
              {errors.teamB && <p className="text-[10px] text-red-500 font-bold">{errors.teamB.message}</p>}
            </div>

            <div className="space-y-1">
              <input {...register('venue')} placeholder="Venue"
                className={cn("w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none", errors.venue && "border-red-500")} />
              {errors.venue && <p className="text-[10px] text-red-500 font-bold">{errors.venue.message}</p>}
            </div>

            <div className="space-y-1">
              <input {...register('time')} placeholder="Time (e.g. 15:00)"
                className={cn("w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zifa-green outline-none", errors.time && "border-red-500")} />
              {errors.time && <p className="text-[10px] text-red-500 font-bold">{errors.time.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fixture Type</label>
              <div className="flex gap-3 mt-2">
                {(['League', 'Cup'] as const).map(cat => (
                  <button type="button" key={cat} onClick={() => setValue('category', cat)}
                    className={cn("flex-1 py-2 rounded-lg text-sm font-bold border-2 transition",
                      selectedCategory === cat
                        ? "border-zifa-green bg-zifa-green text-white"
                        : "border-gray-200 text-gray-500 hover:border-zifa-green"
                    )}>
                    {cat === 'Cup' ? <Trophy className="w-3 h-3 inline mr-1" /> : <Shield className="w-3 h-3 inline mr-1" />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zifa-green text-white py-2.5 rounded-lg font-semibold hover:bg-green-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Match'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {matchesOnSelectedDate.length > 0 ? (
            matchesOnSelectedDate.map(match => (
              <div key={match.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:border-zifa-green transition-colors group relative">
                {isAuthenticated && (
                  <button onClick={() => deleteMatch(match.id)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1",
                    match.category === 'Cup'
                      ? "bg-zifa-green text-white"
                      : "bg-zifa-yellow text-zifa-black"
                  )}>
                    {match.category === 'Cup' ? <Trophy className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                    {match.category}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                    <Clock className="w-3 h-3" />{match.time}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center font-bold text-sm">{match.teamA}</div>
                  <div className="text-zifa-green font-black italic text-xs">VS</div>
                  <div className="flex-1 text-center font-bold text-sm">{match.teamB}</div>
                </div>
                <div className="pt-3 border-t border-gray-50 flex items-center gap-2 text-gray-500 text-xs">
                  <MapPin className="w-3 h-3 text-zifa-green" />{match.venue}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm font-medium">No matches scheduled for this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
