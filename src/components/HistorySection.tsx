import React, { useState } from 'react';
import { Calendar, Trophy, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import PreviousFixtures from './PreviousFixtures';
import PreviousResults from './PreviousResults';
import { FixtureData } from './FixtureEditor';
import { ResultsData } from './ResultsEditor';

interface HistorySectionProps {
  onEditFixture: (data: FixtureData) => void;
  onEditResults: (data: ResultsData) => void;
}

export default function HistorySection({ onEditFixture, onEditResults }: HistorySectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'fixtures' | 'results'>('fixtures');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-brand-green flex items-center gap-2">
              <History className="w-6 h-6" /> Archive & History
            </h2>
            <p className="text-sm text-gray-500 font-medium">Access and manage all historical fixtures and results from previous weeks.</p>
          </div>
          
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveSubTab('fixtures')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'fixtures' ? "bg-white text-brand-green shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Calendar className="w-4 h-4" /> Fixtures
            </button>
            <button
              onClick={() => setActiveSubTab('results')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === 'results' ? "bg-white text-brand-green shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Trophy className="w-4 h-4" /> Results
            </button>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeSubTab === 'fixtures' ? (
          <PreviousFixtures onEdit={onEditFixture} />
        ) : (
          <PreviousResults onEdit={onEditResults} />
        )}
      </div>
    </div>
  );
}
