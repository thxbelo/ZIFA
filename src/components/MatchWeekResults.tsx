import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { Loader2, Facebook, Instagram, Twitter, Shield, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocket } from '@/lib/socket';
import LiveDataState from './LiveDataState';

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

const blankResults: ResultsData = {
  week: 'LATEST RESULTS',
  division: 'SOUTHERN REGION SOCCER LEAGUE',
  days: [],
};

export default function MatchWeekResults() {
  const [results, setResults] = useState<ResultsData>(blankResults);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await apiFetch('/results');
      setLoadError(null);
      if (Array.isArray(data) && data.length > 0) {
        setResults(data[0].data);
      } else {
        setResults(blankResults);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setResults(blankResults);
      setLoadError('The latest results could not be synced from the database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchResults('refresh');
    };

    socket.on('resultsUpdate', handleRefresh);
    socket.on('matchUpdate', handleRefresh);

    return () => {
      socket.off('resultsUpdate', handleRefresh);
      socket.off('matchUpdate', handleRefresh);
    };
  }, [socket]);

  if (isLoading) {
    return (
      <LiveDataState
        icon={RefreshCw}
        title="Syncing league results"
        description="Pulling the latest published match recap from the live database."
        loading
      />
    );
  }

  if (loadError) {
    return (
      <LiveDataState
        icon={RefreshCw}
        title="Results feed unavailable"
        description={loadError}
        actionLabel="Retry sync"
        onAction={() => fetchResults('initial')}
        tone="warning"
      />
    );
  }

  return (
    <div className="bg-brand-bg max-w-5xl mx-auto shadow-2xl border border-gray-200 overflow-hidden font-sans geometric-watermark animate-in fade-in duration-700">
      {/* Top Header Section */}
      <div className="relative min-h-[340px] flex flex-col items-center justify-between py-10 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
          style={{ backgroundImage: 'url("/Header Picture.png")' }}
        ></div>
        <div className="absolute inset-0 bg-brand-green/80 backdrop-blur-[2px]"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-green to-transparent opacity-50"></div>

        <div className="relative z-10 w-full flex items-start justify-between px-8 md:px-16">
          <div className="w-24 h-24 md:w-36 md:h-36 drop-shadow-2xl">
            <img src="/logo-2.png" alt="Zifa Logo" className="w-full h-full object-contain" />
          </div>

          <div className="flex-1 text-center px-6 pt-4">
            <p className="font-barlow font-light text-xl md:text-2xl tracking-[0.4em] text-white uppercase mb-3">PACIFIC BREEZE</p>
            <h1 className="font-barlow font-black text-4xl md:text-7xl tracking-tighter text-white uppercase leading-[0.85] drop-shadow-xl">
              <span className="block whitespace-nowrap">SOUTHERN REGION</span>
              <span className="block whitespace-nowrap">SOCCER LEAGUE</span>
            </h1>
          </div>

          <div className="w-24 h-24 md:w-36 md:h-36 drop-shadow-2xl flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-full p-2 border-4 border-white/20 overflow-hidden flex items-center justify-center shadow-2xl">
              <img src="/logo-1.jpg" alt="SRSL Logo" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-0 mt-6 w-full mb-[-12px]">
           <div className="bg-accent-green px-12 py-3 shadow-lg w-[320px] md:w-[440px] text-center border-b border-white/5">
             <span className="text-white text-lg md:text-2xl font-black font-barlow tracking-widest uppercase">
               {results.division}
             </span>
           </div>
           <div className="bg-brand-green px-16 py-6 shadow-2xl w-[420px] md:w-[640px] text-center border-t border-white/10">
             <h2 className="text-white text-2xl md:text-5xl font-black font-barlow tracking-[0.2em] uppercase leading-none">
               MATCH RESULTS
             </h2>
           </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-4 md:p-12 space-y-16">
        {results.days.length === 0 ? (
          <LiveDataState
            icon={Shield}
            title="No published results yet"
            description="Once a weekly recap is saved, the latest matchday card will appear here automatically."
            actionLabel="Check again"
            onAction={() => fetchResults('initial')}
            tone="muted"
          />
        ) : results.days.map((day, dIdx) => (
          <div key={dIdx} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 delay-100">
            {/* Day Header with Large Date */}
            <div className="border-b-2 border-brand-green/10 pb-4 text-center">
              <h3 className="text-brand-green text-3xl md:text-4xl font-black font-barlow uppercase leading-none tracking-tighter">
                {day.date}
              </h3>
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

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Footer Social Strip */}
      <div className="bg-brand-green min-h-[80px] px-8 flex items-center justify-between gap-6 border-t-8 border-brand-highlight/10 overflow-hidden">
        <div className="whitespace-nowrap overflow-hidden pr-6">
           <p className="text-white text-xs md:text-[13px] font-black uppercase tracking-widest">
             PACIFIC BREEZE SOUTHERN REGION SOCCER LEAGUE - {results.week} - UPDATE
           </p>
        </div>
        
        <div className="flex items-center gap-0 shrink-0">
          <div className="bg-brand-blue text-white font-black text-sm uppercase px-8 py-3 h-12 flex items-center shadow-xl whitespace-nowrap">
             Follow Us!
          </div>
          
          <div className="flex gap-3 bg-gray-100/95 h-12 px-6 items-center shadow-inner">
            {[
              { icon: Facebook, color: 'bg-[#1877f2]' },
              { icon: Twitter, color: 'bg-black' },
              { icon: Instagram, color: 'bg-[#e4405f]' },
              { icon: Music2, color: 'bg-black' }
            ].map((social, sIdx) => (
              <div key={sIdx} className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform cursor-pointer", social.color)}>
                  <social.icon className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
