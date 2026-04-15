import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { Loader2, Search, Trophy, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('All Teams');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await apiFetch('/players');
      setPlayers(data);
    } catch (err) {
      console.error('Failed to load players', err);
    } finally {
      setLoading(false);
    }
  };

  const teams = ['All Teams', ...Array.from(new Set(players.map(p => p.team)))].sort();

  const filteredPlayers = players
    .filter(p => (teamFilter === 'All Teams' || p.team === teamFilter))
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.red_cards * 10 + b.yellow_cards) - (a.red_cards * 10 + a.yellow_cards)); // Score by severity

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-sm border border-gray-100 geometric-watermark">
        <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
        <p className="text-gray-400 mt-4 font-black tracking-widest uppercase text-xs">Loading League Stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="bg-brand-green p-8 rounded-2xl text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 geometric-watermark" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-barlow tracking-tighter uppercase leading-none">
              Disciplinary <br /> <span className="text-brand-highlight">Leaderboard</span>
            </h1>
            <p className="mt-3 text-white/70 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Trophy className="w-3 h-3 text-brand-highlight" /> Official Season 2025/26 Standings
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Player..."
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-highlight outline-none w-full md:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select 
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="pl-10 pr-8 py-2 bg-white/10 border border-white/20 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-highlight outline-none w-full font-bold"
              >
                {teams.map(t => <option key={t} value={t} className="text-black">{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Table (PL Style) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Rank</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Player</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">Position</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Yellow Cards</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Red Cards</th>
                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Total Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPlayers.map((player, idx) => (
                <tr key={player.id} className="group hover:bg-brand-bg transition-colors">
                  <td className="px-6 py-4 font-barlow text-2xl font-black text-gray-200 group-hover:text-brand-green/20">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar Placeholder */}
                      <div className="w-10 h-10 rounded-full bg-brand-green/5 border border-brand-green/10 flex items-center justify-center font-black text-brand-green uppercase text-xs">
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-tight leading-none mb-1">{player.name}</p>
                        <p className="text-[10px] font-black text-brand-green/70 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-brand-green/20 rounded-full" /> {player.team}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 py-1 px-3 border border-gray-100 rounded-full bg-white">
                      {player.position}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg border font-black text-lg transition-all",
                        player.yellow_cards > 0 ? "bg-yellow-50 border-yellow-200 text-yellow-700 scale-110" : "bg-gray-50 border-gray-100 text-gray-400 opacity-30"
                      )}>
                        <div className={cn("w-3 h-4 rounded-sm shadow-sm", player.yellow_cards > 0 ? "bg-yellow-400" : "bg-gray-300")} />
                        {player.yellow_cards}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <div className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg border font-black text-lg transition-all",
                        player.red_cards > 0 ? "bg-red-50 border-red-200 text-red-700 scale-110" : "bg-gray-50 border-gray-100 text-gray-400 opacity-30"
                      )}>
                        <div className={cn("w-3 h-4 rounded-sm shadow-sm", player.red_cards > 0 ? "bg-red-600" : "bg-gray-300")} />
                        {player.red_cards}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xl font-black font-barlow text-brand-green tracking-tight">
                      {(player.red_cards * 10) + player.yellow_cards} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPlayers.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center text-brand-green mb-4">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-gray-900 font-bold uppercase tracking-tight">No Players Found</p>
              <p className="text-gray-400 text-xs font-medium max-w-[200px] mt-2">Adjust your search or filters to see league disciplinary data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
