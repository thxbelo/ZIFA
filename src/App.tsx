import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CreditCard,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  Lock,
  Shield,
  Users,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import CalendarSection from './components/CalendarSection';
import PaymentsSection from './components/PaymentsSection';
import FixtureEditor, { FixtureData } from './components/FixtureEditor';
import PreviousFixtures from './components/PreviousFixtures';
import FixtureListSection from './components/FixtureListSection';
import LeagueTableSection from './components/LeagueTableSection';
import MatchWeekResults from './components/MatchWeekResults';
import ResultsEditor, { ResultsData } from './components/ResultsEditor';
import PreviousResults from './components/PreviousResults';
import PlayerManager from './components/PlayerManager';
import PlayerStats from './components/PlayerStats';
import HistorySection from './components/HistorySection';
import Login from './pages/Login';
import LandingPage from './components/LandingPage';

type View = 'public' | 'login' | 'admin';
type AdminTab = 'fixtures' | 'results' | 'players' | 'payments' | 'archive';
type PublicTab = 'home' | 'calendar' | 'fixtures' | 'table' | 'results' | 'stats';


export default function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [view, setView] = useState<View>('public');
  const [activeTab, setActiveTab] = useState<AdminTab>('fixtures');
  const [publicTab, setPublicTab] = useState<PublicTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingFixture, setEditingFixture] = useState<FixtureData | null>(null);
  const [editingResults, setEditingResults] = useState<ResultsData | null>(null);

  // If user is authenticated and on login page, take them to admin
  const currentView: View = isAuthenticated ? 'admin' : view;

  const handleLogout = () => {
    logout();
    setView('public');
  };

  const adminNavItems = [
    { id: 'fixtures', label: 'Fixtures & Scheduling', icon: CalendarIcon },
    { id: 'results', label: 'Match Results & Table', icon: Trophy },
    { id: 'players', label: 'Player Database', icon: Users },
    { id: 'payments', label: 'Payments & Analysis', icon: CreditCard },
    { id: 'archive', label: 'Archive / History', icon: LayoutDashboard },
  ];

  // ── LOGIN PAGE ────────────────────────────────────────────────
  if (currentView === 'login') {
    return <Login />;
  }

  // ── PUBLIC CALENDAR ───────────────────────────────────────────
  if (currentView === 'public') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Public Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full border-2 border-zifa-yellow overflow-hidden">
              <img src="/logo-2.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-black text-zifa-green text-lg leading-none tracking-tight">Southern Region</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Soccer League</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live</span>
            </div>
            <button
              onClick={() => setView('login')}
              className="flex items-center gap-2 bg-zifa-green text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-800 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Login
            </button>
          </div>
        </header>

        {/* Public banner */}
        <div className="bg-zifa-green text-white py-3 px-6 flex items-center justify-center gap-3">
          <Shield className="w-4 h-4 text-zifa-yellow" />
          <p className="text-sm font-bold tracking-wide">
            Pacific Breeze Southern Region Soccer League — Official Fixture Calendar
          </p>
          <Shield className="w-4 h-4 text-zifa-yellow" />
        </div>

        {/* Public Tabs */}
        <div className="bg-white border-b border-gray-100 flex justify-center sticky top-[73px] z-30 overflow-x-auto">
          <div className="flex gap-1 px-4 md:gap-6 md:px-6 min-w-max">
            <button
              onClick={() => setPublicTab('home')}
              className={cn("py-4 text-sm font-bold border-b-2 transition-colors px-2", publicTab === 'home' ? "border-zifa-green text-zifa-green" : "border-transparent text-gray-400 hover:text-gray-900")}
            >
              Home
            </button>
            <button 
              onClick={() => setPublicTab('calendar')}
              className={cn("py-4 text-sm font-bold border-b-2 transition-colors px-2", publicTab === 'calendar' ? "border-zifa-green text-zifa-green" : "border-transparent text-gray-400 hover:text-gray-900")}
            >
              Month Calendar
            </button>
            <button 
              onClick={() => setPublicTab('fixtures')}
              className={cn("py-4 text-sm font-bold border-b-2 transition-colors px-2", publicTab === 'fixtures' ? "border-zifa-green text-zifa-green" : "border-transparent text-gray-400 hover:text-gray-900")}
            >
              All Fixtures
            </button>
            <button 
              onClick={() => setPublicTab('table')}
              className={cn("py-4 text-sm font-bold border-b-2 transition-colors px-2", publicTab === 'table' ? "border-zifa-green text-zifa-green" : "border-transparent text-gray-400 hover:text-gray-900")}
            >
              League Table
            </button>
            <button 
              onClick={() => setPublicTab('results')}
              className={cn("py-4 text-sm font-bold border-b-2 transition-colors px-2", publicTab === 'results' ? "border-zifa-green text-zifa-green" : "border-transparent text-gray-400 hover:text-gray-900")}
            >
              Weekly Results
            </button>
            <button 
              onClick={() => setPublicTab('stats')}
              className={cn("py-4 text-sm font-bold border-b-2 transition-colors px-2", publicTab === 'stats' ? "border-zifa-green text-zifa-green" : "border-transparent text-gray-400 hover:text-gray-900")}
            >
              Players & Stats
            </button>
          </div>
        </div>

        {/* Public Content — Home is full-width; other tabs are constrained */}
        <div className="flex-1">
          {publicTab === 'home' && (
            <LandingPage onNavigate={setPublicTab} />
          )}

          {publicTab !== 'home' && (
            <main className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
              {publicTab === 'calendar' && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-gray-900">Match Fixtures</h2>
                    <p className="text-gray-500 text-sm mt-1">Click any highlighted date to view scheduled matches.</p>
                  </div>
                  <CalendarSection />
                </>
              )}
              {publicTab === 'fixtures' && <FixtureListSection />}
              {publicTab === 'table' && <LeagueTableSection />}
              {publicTab === 'results' && <MatchWeekResults />}
              {publicTab === 'stats' && <PlayerStats />}
            </main>
          )}
        </div>

        <footer className="border-t border-gray-100 py-4 px-6 text-center text-xs text-gray-400 font-medium">
          © 2026 Zimbabwe Football Association — Southern Region. All rights reserved.
        </footer>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Admin Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-zifa-green text-white transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center p-1 border-2 border-zifa-yellow overflow-hidden">
            <img src="/logo-2.png" alt="ZIFA Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter leading-none">ZIFA</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {adminNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as AdminTab); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                activeTab === item.id
                  ? "bg-zifa-yellow text-zifa-green shadow-lg"
                  : "hover:bg-white/10 text-white/80"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="mt-auto border-t border-white/10 bg-zifa-green p-4">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Signed in as</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zifa-yellow flex items-center justify-center font-black text-zifa-green text-sm">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-bold">{user?.username || 'Admin'}</p>
                <p className="text-[10px] opacity-60 capitalize">{user?.role || 'admin'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-white py-2.5 rounded-xl text-sm font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Admin Header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-black text-zifa-green uppercase tracking-tight">
              {adminNavItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </header>

        {/* Admin Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'fixtures' && (
            <FixtureEditor
              initialData={editingFixture}
              onClear={() => setEditingFixture(null)}
            />
          )}
          {activeTab === 'results' && (
            <ResultsEditor
              initialData={editingResults}
              onClear={() => setEditingResults(null)}
            />
          )}
          {activeTab === 'players' && <PlayerManager />}
          {activeTab === 'payments' && <PaymentsSection />}
          {activeTab === 'archive' && (
            <HistorySection 
              onEditFixture={(data) => {
                setEditingFixture(data);
                setActiveTab('fixtures');
              }}
              onEditResults={(data) => {
                setEditingResults(data);
                setActiveTab('results');
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}
