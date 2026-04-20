import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { Loader2, Search, Trophy, Filter, RefreshCw, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/lib/socket';
import LiveDataState from './LiveDataState';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  yellow_cards: number;
  red_cards: number;
}

export default function PlayerStats() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('All Teams');
  const { socket } = useSocket();

  const fetchPlayers = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await apiFetch('/players');
      setPlayers(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to load players', err);
      setPlayers([]);
      setLoadError('Player disciplinary data could not be synced from the database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlayers('initial');
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchPlayers('refresh');
    };

    socket.on('playersUpdate', handleRefresh);

    return () => {
      socket.off('playersUpdate', handleRefresh);
    };
  }, [socket]);

  const teams = ['All Teams', ...Array.from(new Set(players.map((player) => player.team)))].sort();

  const filteredPlayers = players
    .filter((player) => teamFilter === 'All Teams' || player.team === teamFilter)
    .filter((player) => player.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.red_cards * 10 + b.yellow_cards - (a.red_cards * 10 + a.yellow_cards));

  if (loading) {
    return (
      <LiveDataState
        icon={RefreshCw}
        title="Loading disciplinary leaderboard"
        description="We are pulling the latest player card totals from the live database."
        loading
      />
    );
  }

  if (loadError && players.length === 0) {
    return (
      <LiveDataState
        icon={ShieldAlert}
        title="Disciplinary data unavailable"
        description={loadError}
        actionLabel="Retry sync"
        onAction={() => fetchPlayers('initial')}
        tone="warning"
      />
    );
  }

  return (
    <div className="animate-in space-y-6 fade-in duration-700">
      <div className="relative overflow-hidden rounded-2xl bg-brand-green p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10 geometric-watermark" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-barlow text-4xl font-black uppercase leading-none tracking-tighter md:text-5xl">
              Disciplinary <br /> <span className="text-brand-highlight">Leaderboard</span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest">
              <p className="flex items-center gap-2 text-white/70">
                <Trophy className="h-3 w-3 text-brand-highlight" /> Official Season 2025/26 Standings
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-brand-highlight" />}
                {refreshing ? 'Refreshing' : 'Live database'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Player..."
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-highlight md:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/20 bg-white/10 py-2 pl-10 pr-8 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-highlight"
              >
                {teams.map((team) => (
                  <option key={team} value={team} className="text-black">
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        {players.length === 0 ? (
          <div className="p-6">
            <LiveDataState
              icon={ShieldAlert}
              title="No disciplinary records yet"
              description="Once players are added and cards are logged, the leaderboard will populate automatically."
              actionLabel="Refresh leaderboard"
              onAction={() => fetchPlayers('initial')}
              tone="muted"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Rank</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Player</th>
                  <th className="hidden px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 md:table-cell">Position</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Yellow Cards</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Red Cards</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Total Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPlayers.map((player, idx) => (
                  <tr key={player.id} className="group transition-colors hover:bg-brand-bg">
                    <td className="px-6 py-4 font-barlow text-2xl font-black text-gray-200 group-hover:text-brand-green/20">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-green/10 bg-brand-green/5 text-xs font-black uppercase text-brand-green">
                          {player.name
                            .split(' ')
                            .map((name) => name[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="mb-1 leading-none font-bold uppercase tracking-tight text-gray-900">{player.name}</p>
                          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-green/70">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-green/20" /> {player.team}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <span className="rounded-full border border-gray-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-4 py-1.5 text-lg font-black transition-all',
                            player.yellow_cards > 0
                              ? 'scale-110 border-yellow-200 bg-yellow-50 text-yellow-700'
                              : 'border-gray-100 bg-gray-50 text-gray-400 opacity-30'
                          )}
                        >
                          <div className={cn('h-4 w-3 rounded-sm shadow-sm', player.yellow_cards > 0 ? 'bg-yellow-400' : 'bg-gray-300')} />
                          {player.yellow_cards}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <div
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-4 py-1.5 text-lg font-black transition-all',
                            player.red_cards > 0
                              ? 'scale-110 border-red-200 bg-red-50 text-red-700'
                              : 'border-gray-100 bg-gray-50 text-gray-400 opacity-30'
                          )}
                        >
                          <div className={cn('h-4 w-3 rounded-sm shadow-sm', player.red_cards > 0 ? 'bg-red-600' : 'bg-gray-300')} />
                          {player.red_cards}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-barlow text-xl font-black tracking-tight text-brand-green">
                        {player.red_cards * 10 + player.yellow_cards} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg text-brand-green">
                  <Search className="h-6 w-6" />
                </div>
                <p className="font-bold uppercase tracking-tight text-gray-900">No players match this filter</p>
                <p className="mt-2 max-w-[220px] text-xs font-medium text-gray-400">
                  Try a different team or player name to see live disciplinary data.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
