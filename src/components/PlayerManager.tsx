import React, { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus, AlertTriangle, Shield, Search, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { getAuthHeaders } from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  yellow_cards: number;
  red_cards: number;
}

export default function PlayerManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // New Player Form
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    team: '',
    position: 'Forward'
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await apiFetch('/players');
      setPlayers(data);
    } catch (err) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name || !newPlayer.team) return;

    const id = Math.random().toString(36).slice(2, 9);
    try {
      await apiFetch('/players', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newPlayer, id, yellow_cards: 0, red_cards: 0 }),
      });
      toast.success('Player added successfully');
      setNewPlayer({ name: '', team: '', position: 'Forward' });
      setIsAdding(false);
      fetchPlayers();
    } catch (err) {
      toast.error('Failed to add player');
    }
  };

  const updateCards = async (id: string, yellow: number, red: number) => {
    try {
      await apiFetch(`/players/${id}/cards`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ yellow_cards: Math.max(0, yellow), red_cards: Math.max(0, red) }),
      });
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, yellow_cards: Math.max(0, yellow), red_cards: Math.max(0, red) } : p));
    } catch (err) {
      toast.error('Failed to update cards');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      await apiFetch(`/players/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      toast.success('Player deleted');
      fetchPlayers();
    } catch (err) {
      toast.error('Failed to delete player');
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.team.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Search & Add */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-brand-green flex items-center gap-2">
            <Shield className="w-6 h-6" /> Player Database Management
          </h2>
          <p className="text-sm text-gray-500 font-medium">Maintain player records and disciplinary card stats (Yellow/Red).</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search players or teams..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-green outline-none"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-900 transition shadow-lg shadow-green-900/10"
          >
            {isAdding ? <Plus className="w-4 h-4 rotate-45" /> : <UserPlus className="w-4 h-4" />}
            {isAdding ? 'Close' : 'Add Player'}
          </button>
        </div>
      </div>

      {/* Add Player Form */}
      {isAdding && (
        <form onSubmit={handleAddPlayer} className="bg-white p-6 rounded-2xl border-2 border-brand-green/10 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Full Name</label>
              <input 
                required
                value={newPlayer.name}
                onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="e.g. Tendai Musona"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Current Team</label>
              <input 
                required
                value={newPlayer.team}
                onChange={e => setNewPlayer(p => ({ ...p, team: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="e.g. BULAWAYO CITY"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Position</label>
              <select 
                value={newPlayer.position}
                onChange={e => setNewPlayer(p => ({ ...p, position: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green font-bold"
              >
                <option>Goalkeeper</option>
                <option>Defender</option>
                <option>Midfielder</option>
                <option>Forward</option>
              </select>
            </div>
            <button type="submit" className="bg-brand-green text-white font-black py-2.5 rounded-xl hover:bg-green-900 transition">
              Create Record
            </button>
          </div>
        </form>
      )}

      {/* Players List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-4">Syncing Database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Player Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Yellow Cards</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Red Cards</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPlayers.map(player => (
                  <tr key={player.id} className="hover:bg-brand-bg transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 uppercase tracking-tight">{player.name}</p>
                      <p className="text-[10px] font-black text-brand-green uppercase opacity-70 tracking-widest">{player.team}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{player.position}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => updateCards(player.id, player.yellow_cards - 1, player.red_cards)}
                          className="w-6 h-6 rounded bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
                        >-</button>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-50 border border-yellow-200">
                          <div className="w-3 h-4 bg-yellow-400 rounded-sm shadow-sm" />
                          <span className="font-black text-yellow-700">{player.yellow_cards}</span>
                        </div>
                        <button 
                          onClick={() => updateCards(player.id, player.yellow_cards + 1, player.red_cards)}
                          className="w-6 h-6 rounded bg-yellow-100 text-yellow-600 hover:bg-yellow-200 flex items-center justify-center text-xs font-bold"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => updateCards(player.id, player.yellow_cards, player.red_cards - 1)}
                          className="w-6 h-6 rounded bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
                        >-</button>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 border border-red-200">
                          <div className="w-3 h-4 bg-red-600 rounded-sm shadow-sm" />
                          <span className="font-black text-red-700">{player.red_cards}</span>
                        </div>
                        <button 
                          onClick={() => updateCards(player.id, player.yellow_cards, player.red_cards + 1)}
                          className="w-6 h-6 rounded bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xs font-bold"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(player.id)}
                        className="p-2 text-gray-300 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPlayers.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <p className="text-sm font-bold uppercase tracking-widest">No matching player records found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
