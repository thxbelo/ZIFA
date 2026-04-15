import React from 'react';
import { Trophy, Target, Eye, Star, Users, Shield, Zap, Globe, ChevronDown, Flag } from 'lucide-react';

type PublicTab = 'home' | 'calendar' | 'fixtures' | 'table' | 'results' | 'stats';

interface LandingPageProps {
  onNavigate: (tab: PublicTab) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="w-full">

      {/* ══════════════════════════════════════════════════════════
          HERO — Neural Synapse Simulation
      ══════════════════════════════════════════════════════════ */}
      <section className="relative h-screen overflow-hidden">
        {/* The live neural simulation runs inside the iframe */}
        <iframe
          src="/neural-simulation.html"
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
          title="Neural Synapse Simulation — Pacific Breeze Football"
        />

        {/* Dark ambient overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0, 6, 2, 0.30)', zIndex: 5 }}
        />

        {/* Bottom fade into page background */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '260px',
            background: 'linear-gradient(to bottom, transparent, #F8F9FA)',
            zIndex: 10,
          }}
        />

        {/* ── Hero Text ────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <div className="text-center">
            {/* Season badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: '#FFD200', animation: 'pulse 2s infinite', boxShadow: '0 0 8px #FFD200' }}
              />
              <span
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                2026 Season · Live
              </span>
            </div>

            {/* Main headline */}
            <h2
              className="font-black leading-none mb-4"
              style={{
                fontSize: 'clamp(2.8rem, 8vw, 6rem)',
                color: '#FFFFFF',
                textShadow: '0 4px 40px rgba(0,0,0,0.6)',
                letterSpacing: '-0.02em',
              }}
            >
              The Beautiful
              <br />
              <span style={{ color: '#FFD200', textShadow: '0 0 40px rgba(255,210,0,0.45)' }}>
                Game
              </span>
            </h2>

            {/* Sub-headline */}
            <p
              className="text-xl md:text-2xl font-black mb-6 uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              Pacific Breeze Southern Region
            </p>

            <p
              className="text-base md:text-lg max-w-xl mx-auto leading-relaxed font-medium"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Where passion meets competition and communities unite around Zimbabwe's most celebrated sport.
            </p>

            {/* Hint text */}
            <p
              className="mt-8 text-xs uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Click the simulation · trigger a neural signal
            </p>
          </div>
        </div>

        {/* Scroll chevron */}
        <div
          className="absolute left-1/2 pointer-events-none"
          style={{ bottom: '80px', transform: 'translateX(-50%)', zIndex: 20, animation: 'bounce 2s infinite' }}
        >
          <ChevronDown className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ABOUT THE LEAGUE
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#00A859' }}>
              Who We Are
            </span>
            <h3
              className="text-4xl md:text-5xl font-black mt-2 mb-5"
              style={{ color: '#015127', letterSpacing: '-0.02em' }}
            >
              About the League
            </h3>
            <div className="w-16 h-1 mx-auto rounded-full" style={{ background: '#FFD200' }} />
          </div>

          {/* Content + stats grid */}
          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Text side */}
            <div>
              <p className="text-gray-600 text-lg leading-relaxed mb-5">
                The{' '}
                <strong style={{ color: '#008751' }}>
                  Pacific Breeze Southern Region Soccer League
                </strong>{' '}
                is Zimbabwe's premier grassroots football competition, uniting clubs from across the Southern
                Region in a structured, professionally managed, and passionately contested format.
              </p>
              <p className="text-gray-600 leading-relaxed mb-5">
                Founded to promote football development at a regional level, the league provides a platform for
                talented players to showcase their abilities, clubs to build lasting legacies, and communities to
                rally behind a shared love of the game.
              </p>
              <p className="text-gray-600 leading-relaxed">
                With an unwavering commitment to transparency, fair play, and player welfare, the Pacific Breeze
                League stands as a beacon of sporting excellence in Zimbabwe's Southern Region — and a launchpad
                for the nation's next generation of football heroes.
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Active Clubs',         value: '16+',  Icon: Shield, color: '#008751' },
                { label: 'Registered Players',   value: '400+', Icon: Users,  color: '#00A859' },
                { label: 'Matches Per Season',   value: '120+', Icon: Trophy, color: '#FFD200' },
                { label: 'Competition Weeks',    value: '30',   Icon: Star,   color: '#015127' },
              ].map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-6 text-center border border-gray-100"
                  style={{ transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                    (e.currentTarget as HTMLDivElement).style.transform = '';
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: color + '18' }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="text-3xl font-black" style={{ color }}>
                    {value}
                  </div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MISSION & VISION
      ══════════════════════════════════════════════════════════ */}
      <section
        className="py-24 px-6"
        style={{ background: 'linear-gradient(135deg, #012a16 0%, #015127 45%, #008751 100%)' }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#FFD200' }}>
              Our Purpose
            </span>
            <h3
              className="text-4xl md:text-5xl font-black mt-2 text-white"
              style={{ letterSpacing: '-0.02em' }}
            >
              Mission & Vision
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div
              className="rounded-3xl p-10"
              style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'background 0.3s',
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.12)')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)')
              }
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: '#FFD200' }}
              >
                <Target className="w-7 h-7" style={{ color: '#015127' }} />
              </div>
              <h4 className="text-2xl font-black text-white mb-5">Our Mission</h4>
              <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                To promote and develop football at all levels within the Southern Region of Zimbabwe —
                fostering talent, discipline, sportsmanship, and an enduring love for the beautiful game
                in every community we serve. We are committed to creating a league that operates with
                professional standards while remaining deeply rooted in local culture and values.
              </p>
            </div>

            {/* Vision */}
            <div
              className="rounded-3xl p-10"
              style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'background 0.3s',
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.12)')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)')
              }
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: '#FFD200' }}
              >
                <Eye className="w-7 h-7" style={{ color: '#015127' }} />
              </div>
              <h4 className="text-2xl font-black text-white mb-5">Our Vision</h4>
              <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                To be the leading regional football league in Zimbabwe, recognized for excellence in
                player development, competitive integrity, and meaningful community impact. We envision
                a league that serves as a true gateway — where Southern Region talent is nurtured and
                earns its place on the national and international stage.
              </p>
            </div>
          </div>

          {/* Strategic pillars */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Grassroots\nDevelopment', icon: '🌱' },
              { label: 'Competitive\nIntegrity',   icon: '⚖️' },
              { label: 'Player\nPathways',         icon: '🚀' },
              { label: 'Community\nImpact',        icon: '🤝' },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="text-center rounded-2xl py-6 px-4"
                style={{ background: 'rgba(255,210,0,0.08)', border: '1px solid rgba(255,210,0,0.15)' }}
              >
                <div className="text-3xl mb-3">{icon}</div>
                <p
                  className="text-xs font-black uppercase tracking-wide whitespace-pre-line"
                  style={{ color: '#FFD200' }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHY FOOTBALL MATTERS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#00A859' }}>
              The Beautiful Game
            </span>
            <h3
              className="text-4xl md:text-5xl font-black mt-2 mb-5"
              style={{ color: '#015127', letterSpacing: '-0.02em' }}
            >
              Why Football Matters
            </h3>
            <div className="w-16 h-1 mx-auto rounded-full" style={{ background: '#FFD200' }} />
            <p className="text-gray-500 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
              Football is more than a sport — it is a universal language that unites people, builds character,
              and transforms communities. Here is why we believe in its power.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                Icon: Globe,
                title: 'Community Unity',
                desc: 'Football transcends cultural, social, and economic boundaries. On match day, every supporter — young or old, rich or poor — becomes part of something far greater than themselves. The stadium becomes a community.',
                color: '#008751',
                emoji: '🏟️',
              },
              {
                Icon: Star,
                title: 'Talent Development',
                desc: "Our league is the cradle for Zimbabwe's next generation of football champions. By providing structured competition, coaching support, and player exposure, we create clear pathways from grassroots to the national team.",
                color: '#00A859',
                emoji: '⭐',
              },
              {
                Icon: Zap,
                title: 'Health & Discipline',
                desc: 'Playing football builds physical fitness, mental resilience, and character — qualities that extend far beyond the pitch. We believe sport is one of the most powerful tools available for holistic youth development.',
                color: '#015127',
                emoji: '💪',
              },
            ].map(({ Icon, title, desc, color, emoji }) => (
              <div
                key={title}
                className="rounded-3xl p-8 border border-gray-100"
                style={{ background: '#F8F9FA', transition: 'box-shadow 0.25s, transform 0.25s' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.10)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                  (e.currentTarget as HTMLDivElement).style.transform = '';
                }}
              >
                <div className="text-4xl mb-5">{emoji}</div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: color + '15' }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h4 className="text-xl font-black text-gray-900 mb-4">{title}</h4>
                <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CORE VALUES
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#00A859' }}>
              What We Stand For
            </span>
            <h3
              className="text-4xl md:text-5xl font-black mt-2 mb-5"
              style={{ color: '#015127', letterSpacing: '-0.02em' }}
            >
              Core Values
            </h3>
            <div className="w-16 h-1 mx-auto rounded-full" style={{ background: '#FFD200' }} />
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            {[
              {
                value: 'Integrity',
                desc: 'We uphold the highest standards of honesty and fairness across every decision, every result, and every interaction — on and off the pitch.',
              },
              {
                value: 'Excellence',
                desc: 'We relentlessly pursue the best in every match played, every player developed, and every administrative decision taken by this league.',
              },
              {
                value: 'Community',
                desc: 'We exist to serve the communities whose energy, support, and passion breathe life into every club that competes in this league.',
              },
              {
                value: 'Fair Play',
                desc: 'We honour the spirit of football — competing hard, respecting opponents, and letting results speak on the pitch rather than off it.',
              },
              {
                value: 'Development',
                desc: 'We invest in the continuous growth of every player, every coach, and every match official who is part of the Pacific Breeze family.',
              },
              {
                value: 'Passion',
                desc: 'Football is not just a sport — it is our shared heartbeat. Every fixture, every goal, and every season is driven by genuine passion for the game.',
              },
            ].map(({ value, desc }) => (
              <div
                key={value}
                className="bg-white rounded-2xl p-6 border border-gray-100"
                style={{ maxWidth: '300px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#008751';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(0,135,81,0.10)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: '#FFD200' }}
                  />
                  <h5 className="font-black text-lg" style={{ color: '#015127' }}>
                    {value}
                  </h5>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CALL TO ACTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: '#015127' }}>
        <div className="max-w-3xl mx-auto text-center">
          <Trophy className="w-16 h-16 mx-auto mb-6" style={{ color: '#FFD200' }} />
          <h3
            className="text-4xl md:text-5xl font-black text-white mb-5"
            style={{ letterSpacing: '-0.02em' }}
          >
            Follow the Action
          </h3>
          <p
            className="text-lg mb-10 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            The 2026 season is in full swing. Stay up to date with match fixtures, weekly results,
            and the live league table — every kick of the ball matters.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => onNavigate('fixtures')}
              className="font-black px-8 py-3.5 rounded-2xl text-sm uppercase tracking-wide transition-all"
              style={{
                background: '#FFD200',
                color: '#015127',
              }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#ffe033')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLButtonElement).style.background = '#FFD200')
              }
            >
              View All Fixtures →
            </button>
            <button
              onClick={() => onNavigate('table')}
              className="font-bold px-8 py-3.5 rounded-2xl text-sm uppercase tracking-wide transition-all"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.20)',
                color: 'rgba(255,255,255,0.85)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)';
              }}
            >
              League Table
            </button>
            <button
              onClick={() => onNavigate('results')}
              className="font-bold px-8 py-3.5 rounded-2xl text-sm uppercase tracking-wide transition-all"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.20)',
                color: 'rgba(255,255,255,0.85)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)';
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)';
              }}
            >
              Weekly Results
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
