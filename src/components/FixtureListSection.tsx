import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, Loader2, MapPin, RefreshCw, Shield, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/apiClient';
import { useSocket } from '@/lib/socket';
import LiveDataState from './LiveDataState';

interface FixtureMatch {
  id: string;
  teamA: string;
  teamB: string;
  venue: string;
  time: string;
  category: string;
  teamA_logo?: string;
  teamB_logo?: string;
}

interface FixtureGroup {
  week: string;
  date: string;
  matches: FixtureMatch[];
}

export default function FixtureListSection() {
  const [fixtures, setFixtures] = useState<FixtureGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchFixtures = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await apiFetch('/matches?unplayed=true');
      setLoadError(null);
      if (!Array.isArray(data) || data.length === 0) {
        setFixtures([]);
        return;
      }

      const grouped = data.reduce((acc: Record<string, FixtureGroup>, match: any) => {
        const key = match.match_week || match.date || 'Upcoming Fixtures';
        if (!acc[key]) {
          acc[key] = {
            week: match.match_week || 'Upcoming Fixtures',
            date: match.date || 'Date TBA',
            matches: [],
          };
        }

        acc[key].matches.push({
          id: match.id,
          teamA: match.teamA || match.home_team_name || match.teamA_name || match.home_team_id,
          teamB: match.teamB || match.away_team_name || match.teamB_name || match.away_team_id,
          venue: match.venue || 'TBA',
          time: match.time || '15:00',
          category: match.category || 'League',
          teamA_logo: match.teamA_logo,
          teamB_logo: match.teamB_logo,
        });

        return acc;
      }, {});

      setFixtures(Object.values(grouped));
    } catch (err) {
      console.error('Failed to load fixtures:', err);
      setFixtures([]);
      setLoadError('Live fixtures could not be loaded right now. Check the server connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFixtures('initial');
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchFixtures('refresh');
    };

    socket.on('matchUpdate', handleRefresh);
    socket.on('fixturesUpdate', handleRefresh);

    return () => {
      socket.off('matchUpdate', handleRefresh);
      socket.off('fixturesUpdate', handleRefresh);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-10 h-10 bg-zifa-yellow rounded-xl flex items-center justify-center text-zifa-green">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">All Fixtures</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
            <p className="text-gray-500">Upcoming matches across all competitions</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-zifa-green/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-zifa-green">
              {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-current" />}
              {isRefreshing ? 'Refreshing' : 'Live feed'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {isLoading ? (
          <div className="grid gap-6">
            {[0, 1].map((card) => (
              <div key={card} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="space-y-4 p-6">
                  {[0, 1].map((row) => (
                    <div key={row} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 md:w-1/4" />
                      <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 md:w-1/2" />
                      <div className="h-10 w-full animate-pulse rounded-xl bg-gray-100 md:w-1/4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <LiveDataState
            icon={RefreshCw}
            title="Fixture feed unavailable"
            description={loadError}
            actionLabel="Try again"
            onAction={() => fetchFixtures('initial')}
            tone="warning"
          />
        ) : fixtures.length === 0 ? (
          <LiveDataState
            icon={CalendarDays}
            title="No upcoming fixtures yet"
            description="As soon as new matches are saved to the database, they will appear here automatically."
            actionLabel="Refresh fixtures"
            onAction={() => fetchFixtures('initial')}
            tone="muted"
          />
        ) : fixtures.map((matchday, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="font-black text-gray-900">{matchday.week}</h4>
              <span className="text-sm font-bold text-gray-500">{matchday.date}</span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {matchday.matches.map(match => (
                <div key={match.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Category tag & Time */}
                  <div className="flex items-center gap-4 md:w-1/4">
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1",
                      match.category === 'Cup'
                        ? "bg-zifa-green text-white"
                        : "bg-zifa-yellow text-zifa-black"
                    )}>
                      {match.category === 'Cup' ? <Trophy className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {match.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                      <Clock className="w-4 h-4" />{match.time}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-center gap-2 md:gap-4 md:w-1/2">
                    <div className="flex-1 flex items-center justify-end gap-2">
                      {match.teamA_logo && (
                        <img 
                          src={match.teamA_logo} 
                          alt={match.teamA} 
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="font-black text-gray-900 text-sm md:text-base">{match.teamA}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">VS</div>
                    <div className="flex-1 flex items-center justify-start gap-2">
                      <div className="font-black text-gray-900 text-sm md:text-base">{match.teamB}</div>
                      {match.teamB_logo && (
                        <img 
                          src={match.teamB_logo} 
                          alt={match.teamB} 
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center md:justify-end gap-1.5 text-gray-500 text-xs font-medium md:w-1/4">
                    <MapPin className="w-4 h-4 text-zifa-green flex-shrink-0" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
