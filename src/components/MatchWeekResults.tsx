import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { Loader2, Facebook, Instagram, Twitter, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Match {
  teamA: string;
  scoreA: number | string;
  teamB: string;
  scoreB: number | string;
  venue: string;
  time: string;
}

interface MatchDay {
  date: string;
  label: 'RESULTS' | 'FIXTURE';
  matches: Match[];
}

export interface ResultsData {
  week: string;
  division: string;
  days: MatchDay[];
}

const matchWeekData: ResultsData = {
  week: "MATCH WEEK 3",
  division: "DIVISION ONE",
  days: [
    {
      date: "FRIDAY 3 APRIL 2026",
      label: "RESULTS",
      matches: [
        { teamA: "NKAYI UTD", scoreA: 1, teamB: "BULAWAYO CITY", scoreB: 0, venue: "WHITE CITY STADIUM", time: "15:00 HRS" },
        { teamA: "IMBIZO FC", scoreA: 0, teamB: "ZIM SAINTS FC", scoreB: 0, venue: "LLEWELLIN STADIUM", time: "15:00 HRS" },
        { teamA: "MEGAWATT FC", scoreA: 1, teamB: "ZEBRA REVOLUTION", scoreB: 0, venue: "CHAKONA STADIUM", time: "15:00 HRS" },
        { teamA: "CASMYN FC", scoreA: 0, teamB: "TALEN VISION", scoreB: 0, venue: "TURK MINE STADIUM", time: "15:00 HRS" },
        { teamA: "BOSSO 90", scoreA: 0, teamB: "HWANGE FC", scoreB: 1, venue: "WHITE CITY B ARENA", time: "15:00 HRS" },
      ]
    },
    {
      date: "SATURDAY 4 APRIL 2026",
      label: "FIXTURE",
      matches: [
        { teamA: "NJUBE SPURS", scoreA: 0, teamB: "AQUA STARS FC", scoreB: 1, venue: "WHITE CITY STADIUM", time: "15:00 HRS" },
        { teamA: "MOSI ROVERS", scoreA: 2, teamB: "KHAMI UTD", scoreB: 1, venue: "CHINOTIMBA STADIUM", time: "15:00 HRS" },
        { teamA: "BLACK ROCK", scoreA: 3, teamB: "BYO WARRIORS", scoreB: 0, venue: "CHAKONA STADIUM", time: "15:00 HRS" },
        { teamA: "JORDAN FC", scoreA: 1, teamB: "VIC FALLS HERENTALS", scoreB: 1, venue: "FILABUSI STADIUM", time: "15:00 HRS" },
      ]
    }
  ]
};

export default function MatchWeekResults() {
  const [results, setResults] = useState<ResultsData>(matchWeekData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const data = await apiFetch('/results');
      if (Array.isArray(data) && data.length > 0) {
        setResults(data[0].data);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-sm border border-gray-100 geometric-watermark">
        <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
        <p className="text-gray-400 mt-4 font-black tracking-widest uppercase text-xs">Syncing League Results...</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg max-w-5xl mx-auto shadow-2xl border border-gray-200 overflow-hidden font-sans geometric-watermark animate-in fade-in duration-700">
      {/* Top Header Section */}
      <div className="relative min-h-[280px] flex items-center justify-between px-8 md:px-16 overflow-hidden">
        {/* Pitch Backdrop with Blur & Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
          style={{ backgroundImage: 'url("/Header Picture.png")' }}
        ></div>
        <div className="absolute inset-0 bg-brand-green/80 backdrop-blur-[2px]"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-green to-transparent opacity-50"></div>

        {/* Left Logo - Zifa Crest */}
        <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl hover:scale-105 transition-transform">
          <img src="/logo-2.png" alt="Zifa Logo" className="w-full h-full object-contain" />
        </div>

        {/* Center Title */}
        <div className="relative z-10 flex-1 text-center px-6">
          <p className="font-barlow font-bold text-lg md:text-xl tracking-[0.3em] text-white opacity-90 mb-2 uppercase drop-shadow-sm">PACIFIC BREEZE</p>
          <h1 className="font-barlow font-black text-4xl md:text-7xl tracking-tighter text-white uppercase leading-[0.8] drop-shadow-xl">
            SOUTHERN REGION<br />
            <span className="text-brand-highlight">SOCCER LEAGUE</span>
          </h1>
        </div>

        {/* Right Logo - Victoria Falls/Regional */}
        <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl hover:scale-105 transition-transform">
          <img src="/logo-1.jpg" alt="SRSL Logo" className="w-full h-full object-contain rounded-full bg-white p-2 border-4 border-brand-highlight/20" />
        </div>
      </div>

      {/* Division Pill Tag */}
      <div className="bg-accent-green py-2.5 text-center relative z-20 shadow-lg">
        <span className="text-white text-xl md:text-2xl font-black font-barlow tracking-[0.2em] uppercase italic drop-shadow-sm">
          {results.division}
        </span>
      </div>

      {/* Week Header Bar */}
      <div className="bg-brand-green py-5 text-center relative z-10 border-t-4 border-white shadow-inner">
        <h2 className="text-white text-3xl md:text-5xl font-black font-barlow tracking-[0.4em] uppercase drop-shadow-md">
          {results.week}
        </h2>
      </div>

      {/* Main Content Body */}
      <div className="p-4 md:p-12 space-y-16">
        {results.days.map((day, dIdx) => (
          <div key={dIdx} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 delay-100">
            {/* Day Header with Large Date */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-brand-green/10 pb-4">
              <div className="flex items-center gap-6">
                 <div className="text-center bg-brand-green text-white px-4 py-2 rounded-xl shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">DAY</p>
                    <p className="text-2xl font-black font-barlow leading-none">{day.date.split(' ')[0][0]}</p>
                 </div>
                 <div>
                    <p className="text-gray-400 font-black text-xs uppercase tracking-[0.2em] mb-1">{day.date.split(' ')[0]}</p>
                    <h3 className="text-brand-green text-3xl md:text-4xl font-black font-barlow uppercase leading-none tracking-tighter">
                      {day.date.split(' ').slice(1).join(' ')}
                    </h3>
                 </div>
              </div>
              
              {/* Type Tag (Results/Fixture) */}
              <div className={cn(
                "px-6 py-2 rounded-full font-black font-barlow text-xl tracking-widest shadow-md",
                day.label === 'RESULTS' ? "bg-brand-green text-white" : "bg-brand-highlight text-brand-green"
              )}>
                {day.label}
              </div>
            </div>

            {/* Matches List - The Stats Style View */}
            <div className="grid grid-cols-1 gap-4">
              {day.matches.map((match, mIdx) => (
                <div key={mIdx} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 group">
                  {/* Team vs Team Container */}
                  <div className="flex-1 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex items-center justify-between gap-4 group-hover:border-brand-green/20 transition-all duration-300">
                    <div className="flex-1 text-right font-black text-sm md:text-xl text-black uppercase tracking-tight group-hover:text-brand-green transition-colors">
                      {match.teamA}
                    </div>

                    <div className="flex items-center gap-2 bg-brand-bg px-5 py-2 rounded-xl border border-gray-100 italic shadow-inner">
                      <span className="text-brand-green text-2xl md:text-4xl font-black w-8 md:w-12 text-center drop-shadow-sm">{match.scoreA}</span>
                      <span className="text-gray-300 text-xs md:text-sm font-black not-italic opacity-50 px-2 tracking-tighter">VS</span>
                      <span className="text-brand-green text-2xl md:text-4xl font-black w-8 md:w-12 text-center drop-shadow-sm">{match.scoreB}</span>
                    </div>

                    <div className="flex-1 text-left font-black text-sm md:text-xl text-black uppercase tracking-tight group-hover:text-brand-green transition-colors">
                      {match.teamB}
                    </div>
                  </div>

                  {/* Pillar Containers for Venue & Time */}
                  <div className="flex items-stretch gap-2 md:w-96">
                    <div className="flex-1 bg-white border-2 border-brand-green/20 rounded-2xl p-4 flex flex-col justify-center text-center shadow-sm">
                      <p className="text-[10px] text-brand-green/50 font-black uppercase tracking-widest mb-1">VENUE</p>
                      <p className="text-black text-xs font-black uppercase leading-tight truncate px-2">
                        {match.venue}
                      </p>
                    </div>
                    <div className="w-28 bg-brand-green rounded-2xl p-4 flex flex-col justify-center text-center shadow-lg shadow-brand-green/10">
                      <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">TIME</p>
                      <p className="text-brand-highlight text-sm font-black uppercase leading-none font-barlow">
                        {match.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Footer Social Strip */}
      <div className="bg-brand-green p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-t-8 border-brand-highlight/20 relative">
        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-[-20deg] pointer-events-none" />
        
        <div>
           <p className="text-white text-xs font-black uppercase tracking-[0.4em] opacity-80 mb-2">PACIFIC BREEZE LEAGUE UPDATE</p>
           <p className="text-brand-highlight text-[10px] font-black uppercase tracking-widest border-l-2 border-brand-highlight pl-4">
             {results.week} OFFICIAL RECAP
           </p>
        </div>
        
        <div className="flex items-center gap-8">
          <button className="bg-brand-blue text-white font-black text-sm uppercase px-8 py-3 rounded-xl shadow-xl hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 group flex items-center gap-3">
             <Shield className="w-4 h-4 text-brand-highlight" />
             Follow Us!
          </button>
          
          <div className="flex gap-4">
            {[
              { icon: Facebook, label: 'FB' },
              { icon: Instagram, label: 'IG' },
              { icon: Twitter, label: 'X' }
            ].map((social, sIdx) => (
              <div key={sIdx} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-brand-highlight hover:text-brand-green transition-all duration-300 cursor-pointer shadow-lg group">
                  <social.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
