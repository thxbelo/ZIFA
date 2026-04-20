import dotenv from 'dotenv';
import { getNeonPool } from '../server/db/neon';

dotenv.config();

const teamMap: Record<string, string> = {
  "AQUA STARS FC": "team-aqua-stars-fc",
  "BLACKROCK FC": "team-blackrock-fc",
  "BOSSO 90 FC": "team-bosso-90-fc",
  "BULAWAYO CITY": "team-bulawayo-city",
  "BULAWAYO CITY FC": "team-bulawayo-city",
  "BULAWAYO WARRIORS": "team-bulawayo-warriors",
  "CASMYN FC": "team-casmyn-fc",
  "HWANGE FC": "team-hwange-fc",
  "IMBIZO FC": "team-imbizo-fc",
  "JORDAN FC": "team-jordan-fc",
  "KHAMI UNITED FC": "team-khami-united-fc",
  "MEGAWATT FC": "team-megawatt-fc",
  "MOSI ROVERS FC": "team-mosi-rovers-fc",
  "MOSI ROVERS": "team-mosi-rovers-fc",
  "NJUBE SPURS FC": "team-njube-spurs-fc",
  "NJUBE UNITED FC": "team-njube-spurs-fc", // Treating as Njube Spurs FC
  "NKAYI UNITED FC": "team-u4vuf0ba",
  "TALEN VISION FC": "team-talen-vision-fc",
  "VIC FALLS HERENTALS": "team-vic-falls-herentals",
  "ZEBRA REVOLUTION FC": "team-zebra-revolution-fc",
  "ZIM SAINTS FC": "team-zim-saints-fc"
};

const matchesToEnsure = [
  // Week 1
  { week: 'MATCH WEEK 1', home: 'BULAWAYO CITY', away: 'HWANGE FC', home_score: 0, away_score: 3, played: true, date: '2026-03-20', time: '15:00 HRS' },
  { week: 'MATCH WEEK 1', home: 'NKAYI UNITED FC', away: 'TALEN VISION FC', home_score: 2, away_score: 2, played: true, date: '2026-03-20', time: '15:00 HRS' },
  { week: 'MATCH WEEK 1', home: 'CASMYN FC', away: 'ZEBRA REVOLUTION FC', home_score: 1, away_score: 0, played: true, date: '2026-03-20', time: '15:00 HRS' },
  { week: 'MATCH WEEK 1', home: 'JORDAN FC', away: 'KHAMI UNITED FC', home_score: 1, away_score: 1, played: true, date: '2026-03-20', time: '15:00 HRS' },
  { week: 'MATCH WEEK 1', home: 'MEGAWATT FC', away: 'AQUA STARS FC', home_score: 2, away_score: 0, played: true, date: '2026-03-20', time: '15:00 HRS' },
  { week: 'MATCH WEEK 1', home: 'BOSSO 90 FC', away: 'VIC FALLS HERENTALS', home_score: 2, away_score: 3, played: true, date: '2026-03-22', time: '15:00 HRS' },

  // Week 2
  { week: 'MATCH WEEK 2', home: 'TALEN VISION FC', away: 'BOSSO 90 FC', home_score: 1, away_score: 0, played: true, date: '2026-03-27', time: '15:00 HRS' },
  { week: 'MATCH WEEK 2', home: 'IMBIZO FC', away: 'MEGAWATT FC', home_score: 1, away_score: 0, played: true, date: '2026-03-27', time: '15:00 HRS' },
  { week: 'MATCH WEEK 2', home: 'ZEBRA REVOLUTION FC', away: 'BLACKROCK FC', home_score: 0, away_score: 1, played: true, date: '2026-03-27', time: '15:00 HRS' },
  { week: 'MATCH WEEK 2', home: 'AQUA STARS FC', away: 'CASMYN FC', home_score: 0, away_score: 0, played: true, date: '2026-03-27', time: '15:00 HRS' },
  { week: 'MATCH WEEK 2', home: 'HWANGE FC', away: 'BULAWAYO WARRIORS', home_score: 1, away_score: 1, played: true, date: '2026-03-27', time: '15:00 HRS' },
  { week: 'MATCH WEEK 2', home: 'VIC FALLS HERENTALS', away: 'MOSI ROVERS FC', home_score: 0, away_score: 2, played: true, date: '2026-03-27', time: '15:00 HRS' },
  { week: 'MATCH WEEK 2', home: 'KHAMI UNITED FC', away: 'BULAWAYO CITY', home_score: 3, away_score: 0, played: true, note: 'WO', date: '2026-03-27', time: '15:00 HRS' },

  // Week 3
  // Friday 3 April 2026
  { week: 'MATCH WEEK 3', home: 'NKAYI UNITED FC', away: 'BULAWAYO CITY', home_score: 1, away_score: 0, played: true, date: '2026-04-03', time: '15:00 HRS' },
  { week: 'MATCH WEEK 3', home: 'IMBIZO FC', away: 'ZIM SAINTS FC', home_score: 0, away_score: 0, played: true, date: '2026-04-03', time: '15:00 HRS' },
  { week: 'MATCH WEEK 3', home: 'MEGAWATT FC', away: 'ZEBRA REVOLUTION FC', home_score: 1, away_score: 0, played: true, date: '2026-04-03', time: '15:00 HRS' },
  { week: 'MATCH WEEK 3', home: 'CASMYN FC', away: 'TALEN VISION FC', home_score: 0, away_score: 0, played: true, date: '2026-04-03', time: '15:00 HRS' },
  { week: 'MATCH WEEK 3', home: 'BOSSO 90 FC', away: 'HWANGE FC', home_score: 0, away_score: 1, played: true, date: '2026-04-03', time: '15:00 HRS' },
  // Saturday 4 April 2026
  { week: 'MATCH WEEK 3', home: 'NJUBE SPURS FC', away: 'AQUA STARS FC', home_score: 0, away_score: 1, played: true, date: '2026-04-04', time: '15:00 HRS' },
  { week: 'MATCH WEEK 3', home: 'MOSI ROVERS FC', away: 'KHAMI UNITED FC', home_score: 2, away_score: 1, played: true, date: '2026-04-04', time: '15:00 HRS' },
  { week: 'MATCH WEEK 3', home: 'BLACKROCK FC', away: 'BULAWAYO WARRIORS', home_score: 3, away_score: 0, played: true, date: '2026-04-04', time: '15:00 HRS' },
  { week: 'MATCH WEEK 3', home: 'JORDAN FC', away: 'VIC FALLS HERENTALS', home_score: 1, away_score: 1, played: true, date: '2026-04-04', time: '15:00 HRS' },

  // Week 4
  // Wednesday 8 April 2026
  { week: 'MATCH WEEK 4', home: 'BULAWAYO WARRIORS', away: 'NJUBE UNITED FC', home_score: 2, away_score: 0, played: true, date: '2026-04-08', time: '15:00 HRS' },
  // Friday 10 April 2026
  { week: 'MATCH WEEK 4', home: 'TALEN VISION FC', away: 'MOSI ROVERS FC', home_score: 4, away_score: 1, played: true, date: '2026-04-10', time: '15:00 HRS' },
  // Saturday 11 April 2026
  { week: 'MATCH WEEK 4', home: 'BULAWAYO CITY', away: 'IMBIZO FC', home_score: 1, away_score: 1, played: true, date: '2026-04-11', time: '15:00 HRS' },
  { week: 'MATCH WEEK 4', home: 'ZEBRA REVOLUTION FC', away: 'NKAYI UNITED FC', home_score: 0, away_score: 0, played: true, date: '2026-04-11', time: '15:00 HRS' },
  { week: 'MATCH WEEK 4', home: 'AQUA STARS FC', away: 'JORDAN FC', home_score: 1, away_score: 2, played: true, date: '2026-04-11', time: '15:00 HRS' },
  { week: 'MATCH WEEK 4', home: 'HWANGE FC', away: 'CASMYN FC', home_score: 5, away_score: 0, played: true, date: '2026-04-11', time: '15:00 HRS' },
  { week: 'MATCH WEEK 4', home: 'VIC FALLS HERENTALS', away: 'MEGAWATT FC', home_score: 1, away_score: 1, played: true, date: '2026-04-11', time: '15:00 HRS' },
  // Sunday 12 April 2026
  { week: 'MATCH WEEK 4', home: 'BULAWAYO WARRIORS', away: 'BOSSO 90 FC', home_score: 3, away_score: 1, played: true, date: '2026-04-12', time: '15:00 HRS' },
  { week: 'MATCH WEEK 4', home: 'ZIM SAINTS FC', away: 'BLACKROCK FC', home_score: 3, away_score: 0, played: true, date: '2026-04-12', time: '15:00 HRS' },
  { week: 'MATCH WEEK 4', home: 'KHAMI UNITED FC', away: 'NJUBE UNITED FC', home_score: 1, away_score: 1, played: true, date: '2026-04-12', time: '15:00 HRS' }
];

async function main() {
  const pool = getNeonPool();
  try {
    for (const match of matchesToEnsure) {
      const homeId = teamMap[match.home];
      const awayId = teamMap[match.away];
      
      if (!homeId || !awayId) {
        console.error("Unknown team:", match.home, homeId, "or", match.away, awayId);
        continue;
      }

      // Find match
      const existing = await pool.query(
        'SELECT * FROM public.matches WHERE match_week = $1 AND ((home_team_id = $2 AND away_team_id = $3) OR (home_team_id = $3 AND away_team_id = $2))',
        [match.week, homeId, awayId]
      );

      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        // Update if it's currently home vs away
        if (existing.rows[0].home_team_id === homeId) {
          await pool.query(
            'UPDATE public.matches SET home_score = $1, away_score = $2, played = $3, status = $4, date = $5, "teamA" = $6, "teamB" = $7 WHERE id = $8',
            [match.home_score, match.away_score, true, 'finished', match.date, match.home, match.away, id]
          );
        } else {
          // It was stored as away vs home, flip scores
          await pool.query(
            'UPDATE public.matches SET home_score = $1, away_score = $2, played = $3, status = $4, date = $5, "teamA" = $6, "teamB" = $7 WHERE id = $8',
            [match.away_score, match.home_score, true, 'finished', match.date, match.away, match.home, id]
          );
        }
        console.log(`Updated ${match.week}: ${match.home} vs ${match.away}`);
      } else {
        // Insert
        const id = Math.random().toString(36).substring(2, 9);
        await pool.query(
            `INSERT INTO public.matches (
                id, date, "teamA", "teamB", venue, time, category, 
                competition_id, home_team_id, away_team_id, match_week, 
                status, home_score, away_score, played
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                id, match.date, match.home, match.away, 'TBA', match.time, 'League',
                'comp-division-one', homeId, awayId, match.week,
                'finished', match.home_score, match.away_score, true
            ]
        );
        console.log(`Inserted ${match.week}: ${match.home} vs ${match.away}`);
      }
    }
    
    // Also the user mentioned fixtures JSON. Wait, is there a 'fixtures' table?
    // Let's check fixtures table.
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
