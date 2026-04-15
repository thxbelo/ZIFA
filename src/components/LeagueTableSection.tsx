import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy data for League Table
const dummyTable = [
  { rank: 1, team: 'Highlanders', p: 5, w: 4, d: 1, l: 0, gf: 10, ga: 2, gd: 8, pts: 13 },
  { rank: 2, team: 'Dynamos', p: 5, w: 3, d: 2, l: 0, gf: 8, ga: 3, gd: 5, pts: 11 },
  { rank: 3, team: 'Bulawayo City', p: 5, w: 3, d: 0, l: 2, gf: 6, ga: 5, gd: 1, pts: 9 },
  { rank: 4, team: 'Zim Saints FC', p: 5, w: 2, d: 2, l: 1, gf: 5, ga: 4, gd: 1, pts: 8 },
  { rank: 5, team: 'Nkayi Utd', p: 5, w: 2, d: 1, l: 2, gf: 4, ga: 6, gd: -2, pts: 7 },
  { rank: 6, team: 'Indlovu FC', p: 5, w: 1, d: 2, l: 2, gf: 3, ga: 5, gd: -2, pts: 5 },
  { rank: 7, team: 'Njube Spurs', p: 5, w: 0, d: 2, l: 3, gf: 3, ga: 8, gd: -5, pts: 2 },
  { rank: 8, team: 'Aqua Stars FC', p: 5, w: 0, d: 0, l: 5, gf: 1, ga: 7, gd: -6, pts: 0 },
];

export default function LeagueTableSection() {
  return (
    <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-zifa-green rounded-xl flex items-center justify-center text-zifa-yellow">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">League Standings</h3>
          <p className="text-sm text-gray-500">2026 Season - Southern Region</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-3 rounded-tl-xl">Pos</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3 text-center">Played</th>
              <th className="px-4 py-3 text-center">Won</th>
              <th className="px-4 py-3 text-center">Drawn</th>
              <th className="px-4 py-3 text-center">Lost</th>
              <th className="px-4 py-3 text-center">GF</th>
              <th className="px-4 py-3 text-center">GA</th>
              <th className="px-4 py-3 text-center">GD</th>
              <th className="px-4 py-3 text-center text-zifa-green rounded-tr-xl">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {dummyTable.map((row) => (
              <tr 
                key={row.team} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                    row.rank === 1 ? "bg-zifa-yellow text-zifa-green" : "text-gray-500"
                  )}>
                    {row.rank}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">{row.team}</td>
                <td className="px-4 py-3 text-center text-gray-500">{row.p}</td>
                <td className="px-4 py-3 text-center text-gray-500">{row.w}</td>
                <td className="px-4 py-3 text-center text-gray-500">{row.d}</td>
                <td className="px-4 py-3 text-center text-gray-500">{row.l}</td>
                <td className="px-4 py-3 text-center text-gray-500">{row.gf}</td>
                <td className="px-4 py-3 text-center text-gray-500">{row.ga}</td>
                <td className="px-4 py-3 text-center text-gray-500">{row.gd}</td>
                <td className="px-4 py-3 text-center font-black text-zifa-green text-base">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
