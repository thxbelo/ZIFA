import React, { forwardRef } from 'react';
import { Facebook, Twitter, Instagram, Music2 } from 'lucide-react';

type ExportMatch = {
  id?: string;
  teamA: string;
  teamB: string;
  venue?: string;
  time?: string;
  scoreA?: string | number;
  scoreB?: string | number;
  homeScore?: string | number;
  awayScore?: string | number;
  played?: boolean;
};

type ExportGroup = {
  id?: string;
  dayLabel?: string;
  dateLabel?: string;
  date?: string;
  matches?: ExportMatch[];
  games?: ExportMatch[];
};

type LeagueExportCardProps = {
  sponsor?: string;
  league?: string;
  division?: string;
  title: string;
  week?: string;
  groups: ExportGroup[];
  variant: 'fixture' | 'results';
};

const green = '#007a37';
const deepGreen = '#006426';
const brightGreen = '#05c807';
const pale = '#f7f8f7';
const darkText = '#101010';

function splitDate(group: ExportGroup) {
  if (group.dayLabel || group.dateLabel) {
    return {
      day: group.dayLabel || '',
      date: group.dateLabel || '',
    };
  }

  const value = group.date || '';
  const parts = value.trim().split(/\s+/);
  return {
    day: parts[0] || '',
    date: parts.slice(1).join(' ') || value,
  };
}

function getScore(match: ExportMatch, side: 'home' | 'away', variant: LeagueExportCardProps['variant']) {
  const value = side === 'home' ? match.scoreA ?? match.homeScore : match.scoreB ?? match.awayScore;
  if (value !== undefined && value !== null && value !== '') return value;
  return variant === 'fixture' && !match.played ? '' : '0';
}

function formatTitle(title: string) {
  return title.toUpperCase();
}

const LeagueExportCard = forwardRef<HTMLDivElement, LeagueExportCardProps>(function LeagueExportCard(
  { sponsor = 'PACIFIC BREEZE', league = 'SOUTHERN REGION SOCCER LEAGUE', division = 'DIVISION ONE', title, week, groups, variant },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        width: 900,
        minHeight: 1269,
        background: pale,
        color: darkText,
        fontFamily: "'Barlow', 'Inter', Arial, sans-serif",
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 40px 100px rgba(0,0,0,0.28)',
      }}
    >
      <div style={{ position: 'relative', height: 450, overflow: 'hidden', background: green }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("/Header Picture.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(0.9)',
            opacity: 0.42,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 122, 55, 0.78)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,82,34,0.5))' }} />

        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr 170px', width: '100%', alignItems: 'start', padding: '0 54px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img src="/logo-2.png" alt="ZIFA logo" style={{ width: 132, height: 186, objectFit: 'contain' }} />
            </div>

            <div style={{ textAlign: 'center', paddingTop: 12 }}>
              <div style={{ color: 'white', fontSize: 28, fontWeight: 300, letterSpacing: 8, lineHeight: 1, marginBottom: 12, textTransform: 'uppercase' }}>
                {sponsor}
              </div>
              <div style={{ color: 'white', fontSize: 60, fontWeight: 900, letterSpacing: -1, lineHeight: 0.9, textTransform: 'uppercase', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ display: 'block', whiteSpace: 'nowrap' }}>SOUTHERN REGION</span>
                <span style={{ display: 'block', whiteSpace: 'nowrap' }}>SOCCER LEAGUE</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 22 }}>
              <div style={{ width: 112, height: 112, borderRadius: 999, background: '#fff', border: '4px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/logo-1.jpg" alt="League logo" style={{ width: 102, height: 102, objectFit: 'cover', borderRadius: 999 }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, marginBottom: -10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ width: 380, height: 48, background: brightGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <span style={{ color: 'white', fontSize: 28, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase' }}>{division}</span>
            </div>
            <div style={{ width: 620, height: 82, background: deepGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: 'white', fontSize: 42, fontWeight: 900, letterSpacing: 10, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{formatTitle(title)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', background: '#f4f5f4', minHeight: 750, paddingTop: 12 }}>

        <div style={{ padding: '0 42px 26px' }}>
          {groups.length === 0 ? (
            <div style={{ minHeight: 550, display: 'flex', alignItems: 'center', justifyContent: 'center', color: deepGreen, fontSize: 28, fontWeight: 800, textTransform: 'uppercase' }}>
              No matches published
            </div>
          ) : groups.map((group, groupIndex) => {
            const { day, date } = splitDate(group);
            const matches = group.matches || group.games || [];
            return (
              <div key={group.id || `${date}-${groupIndex}`} style={{ display: 'grid', gridTemplateColumns: '228px 1fr', columnGap: 18, alignItems: 'start', marginBottom: 24, paddingBottom: 24, borderBottom: groupIndex === groups.length - 1 ? 'none' : `1px dotted ${green}` }}>
                <div style={{ paddingTop: 0, minHeight: 54 }}>
                  <div style={{ color: deepGreen, fontSize: 17, fontWeight: 400, letterSpacing: 1.3, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{day}</div>
                  <div style={{ color: deepGreen, fontSize: 26, fontWeight: 900, lineHeight: 1, textTransform: 'uppercase', marginTop: 4, whiteSpace: 'nowrap' }}>{date}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, paddingTop: 0 }}>
                  {matches.map((match, matchIndex) => {
                    const home = getScore(match, 'home', variant);
                    const away = getScore(match, 'away', variant);
                    return (
                      <div key={match.id || `${match.teamA}-${match.teamB}-${matchIndex}`} style={{ display: 'grid', gridTemplateColumns: '1fr 226px', gap: 16, alignItems: 'end', minHeight: 54 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px 1fr', alignItems: 'center', columnGap: 9 }}>
                          <div style={{ textAlign: 'right', fontSize: 17, fontWeight: 900, lineHeight: 0.96, textTransform: 'uppercase' }}>{match.teamA || 'TBA'}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 18px 1fr', alignItems: 'center', justifyItems: 'center' }}>
                            <span style={{ color: green, fontSize: 30, fontWeight: 900 }}>{home}</span>
                            <span style={{ color: '#222', fontSize: 16, fontWeight: 700 }}>-</span>
                            <span style={{ color: green, fontSize: 30, fontWeight: 900 }}>{away}</span>
                          </div>
                          <div style={{ textAlign: 'left', fontSize: 17, fontWeight: 900, lineHeight: 0.96, textTransform: 'uppercase' }}>{match.teamB || 'TBA'}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px', gap: 0 }}>
                          <div>
                            <div style={{ color: deepGreen, fontSize: 14, fontWeight: 500, textTransform: 'uppercase', marginBottom: 4 }}>VENUE</div>
                            <div style={{ height: 26, background: '#00a810', color: 'white', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {match.venue || 'TBA'}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: deepGreen, fontSize: 14, fontWeight: 500, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>TIME</div>
                            <div style={{ height: 26, background: green, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                              {match.time || '15:00 HRS'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ minHeight: 64, background: deepGreen, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 54px', color: 'white' }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', paddingRight: 20 }}>
          PACIFIC BREEZE SOUTHERN REGION SOCCER LEAGUE - {week || 'MATCH WEEK'} - UPDATE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <div style={{ background: '#145bff', color: 'white', height: 42, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, whiteSpace: 'nowrap' }}>Follow Us!</div>
          <div style={{ height: 42, width: 180, background: '#e9e9e9', display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', padding: '0 10px' }}>
            {[
              { icon: Facebook, color: '#1877f2' },
              { icon: Twitter, color: '#000000' },
              { icon: Instagram, color: '#e4405f' },
              { icon: Music2, color: '#000000' }
            ].map((social, idx) => (
              <div key={idx} style={{ width: 26, height: 26, borderRadius: 999, background: social.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                <social.icon size={14} strokeWidth={3} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default LeagueExportCard;
