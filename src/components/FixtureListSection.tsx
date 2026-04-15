import React from 'react';
import { CalendarDays, Clock, MapPin, Shield, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy data for Fixtures list
const dummyFixtures = [
  {
    week: 'Matchday 5 - Upcoming',
    date: 'Saturday, 11 April 2026',
    matches: [
      { id: '1', teamA: 'Highlanders', teamB: 'Dynamos', venue: 'Barbourfields Stadium', time: '15:00', category: 'League' },
      { id: '2', teamA: 'Bulawayo City', teamB: 'Nkayi Utd', venue: 'Luveve Stadium', time: '13:00', category: 'League' },
    ]
  },
  {
    week: 'Matchday 6 - Upcoming',
    date: 'Sunday, 12 April 2026',
    matches: [
      { id: '3', teamA: 'Zim Saints FC', teamB: 'Njube Spurs', venue: 'White City Stadium', time: '15:00', category: 'League' },
      { id: '4', teamA: 'Indlovu FC', teamB: 'Aqua Stars FC', venue: 'Llewellin Stadium', time: '15:00', category: 'Cup' },
    ]
  }
];

export default function FixtureListSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-10 h-10 bg-zifa-yellow rounded-xl flex items-center justify-center text-zifa-green">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">All Fixtures</h3>
          <p className="text-sm text-gray-500">Upcoming matches across all competitions</p>
        </div>
      </div>

      <div className="space-y-8">
        {dummyFixtures.map((matchday, idx) => (
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
                      "text-[10px] font-black px-2.5 py-1 rounded-md uppercase flex items-center gap-1",
                      match.category === 'Cup'
                        ? "bg-zifa-green text-white"
                        : "bg-zifa-yellow text-zifa-black"
                    )}>
                      {match.category === 'Cup' ? <Trophy className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {match.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm font-bold">
                      <Clock className="w-4 h-4" />{match.time}
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-center gap-4 md:w-1/2">
                    <div className="flex-1 text-right font-black text-gray-900 md:text-lg">{match.teamA}</div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400">VS</div>
                    <div className="flex-1 text-left font-black text-gray-900 md:text-lg">{match.teamB}</div>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center md:justify-end gap-1.5 text-gray-500 text-sm font-medium md:w-1/4">
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
