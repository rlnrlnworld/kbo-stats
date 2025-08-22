import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as cheerio from 'cheerio';
import { BattingStats, TEAM_MAPPING } from '@/types/team';

async function scrapeBattingStats(): Promise<BattingStats[] | null> {
  const url = 'https://www.koreabaseball.com/Record/Team/Hitter/Basic1.aspx';
  
  try {
    console.log('🏏 KBO 팀 타자 기록 크롤링 시작...');
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const battingStats: BattingStats[] = [];
    const tableRows = $('table.tData tbody tr');

    if (tableRows.length === 0) {
      console.log('⚠️ 타자 기록 데이터가 없습니다');
      return null;
    }

    const maxTeams = Math.min(tableRows.length, 10);
    
    for (let index = 0; index < maxTeams; index++) {
      const row = tableRows.eq(index);
      const cells = row.find('td');
      
      if (cells.length >= 15) {
        try {
          const teamName = cells.eq(1).text().trim();
          const avgText = cells.eq(2).text().trim();
          const gamesText = cells.eq(3).text().trim();
          const paText = cells.eq(4).text().trim();
          const abText = cells.eq(5).text().trim();
          const runsText = cells.eq(6).text().trim();
          const hitsText = cells.eq(7).text().trim();
          const doublesText = cells.eq(8).text().trim();
          const triplesText = cells.eq(9).text().trim();
          const homeRunsText = cells.eq(10).text().trim();
          const totalBasesText = cells.eq(11).text().trim();
          const rbisText = cells.eq(12).text().trim();
          const sacText = cells.eq(13).text().trim();
          const sfText = cells.eq(14).text().trim();

          const avg = parseFloat(avgText);
          const gp = parseInt(gamesText);
          const ab = parseInt(abText);
          const r = parseInt(runsText);
          const h = parseInt(hitsText);
          const doubles = parseInt(doublesText);
          const triples = parseInt(triplesText);
          const hr = parseInt(homeRunsText);
          const tb = parseInt(totalBasesText);
          const rbi = parseInt(rbisText);
          const sac = parseInt(sacText);
          const sf = parseInt(sfText);

          if (isNaN(avg) || isNaN(gp) || isNaN(ab) || 
              isNaN(r) || isNaN(h) || isNaN(hr)) {
            console.log(`⚠️ ${index + 1}번째 행 데이터 무효 - 건너뛰기: ${teamName}`);
            continue;
          }

          const teamId = TEAM_MAPPING[teamName];
          if (!teamId) {
            console.log(`⚠️ 알 수 없는 팀명: ${teamName} - 건너뛰기`);
            continue;
          }

          battingStats.push({
            teamId,
            teamName,
            avg: Math.round(avg * 1000) / 1000,
            gp,
            ab,
            r,
            h,
            doubles: isNaN(doubles) ? 0 : doubles,
            triples: isNaN(triples) ? 0 : triples,
            hr,
            tb: isNaN(tb) ? 0 : tb,
            rbi: isNaN(rbi) ? 0 : rbi,
            sac: isNaN(sac) ? 0 : sac,
            sf: isNaN(sf) ? 0 : sf
          });

          console.log(`✅ ${teamName}(${teamId}): 타율${avg} ${gp}경기 ${h}안타 ${hr}홈런`);

        } catch (error) {
          console.error(`⚠️ ${index + 1}번째 행 파싱 실패:`, error);
          continue;
        }
      }
    }

    console.log(`🎉 타자 기록 크롤링 완료: ${battingStats.length}개 팀`);
    
    if (battingStats.length < 10) {
      console.log(`⚠️ 예상보다 적은 팀 데이터: ${battingStats.length}개 (정상적으로는 10개)`);
    }
    
    return battingStats;

  } catch (error) {
    console.error('❌ 타자 기록 크롤링 실패:', error);
    throw error;
  }
}

async function saveBattingStats(stats: BattingStats[]): Promise<void> {
  try {
    console.log(`💾 타자 기록 데이터 저장 시작... (${stats.length}개 팀)`);

    for (const stat of stats) {
      if (isNaN(stat.avg) || isNaN(stat.gp) || isNaN(stat.h)) {
        console.error(`⚠️ 유효하지 않은 데이터 발견, 건너뛰기:`, stat);
        continue;
      }

      await sql`
        INSERT INTO batting_stats 
        (
          team_id, team_name, avg, gp, ab, r, h, 
          doubles, triples, hr, tb, rbi, sac, sf
        )
        VALUES (
          ${stat.teamId}, 
          ${stat.teamName}, 
          ${stat.avg}, 
          ${stat.gp}, 
          ${stat.ab}, 
          ${stat.r}, 
          ${stat.h}, 
          ${stat.doubles}, 
          ${stat.triples}, 
          ${stat.hr}, 
          ${stat.tb}, 
          ${stat.rbi}, 
          ${stat.sac}, 
          ${stat.sf}
        )
        ON CONFLICT (team_id) 
        DO UPDATE SET 
          team_name = EXCLUDED.team_name,
          avg = EXCLUDED.avg,
          gp = EXCLUDED.gp,
          ab = EXCLUDED.ab,
          r = EXCLUDED.r,
          h = EXCLUDED.h,
          doubles = EXCLUDED.doubles,
          triples = EXCLUDED.triples,
          hr = EXCLUDED.hr,
          tb = EXCLUDED.tb,
          rbi = EXCLUDED.rbi,
          sac = EXCLUDED.sac,
          sf = EXCLUDED.sf,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }

    console.log(`✅ 타자 기록 데이터 저장 완료`);

  } catch (error) {
    console.error('❌ 타자 기록 데이터베이스 저장 실패:', error);
    throw error;
  }
}

export async function POST() {
  try {
    console.log('=== 일일 KBO 타자 기록 크롤링 크론잡 시작 ===');
    console.log('시간:', new Date().toISOString());

    const battingStats = await scrapeBattingStats();
    
    if (!battingStats || battingStats.length === 0) {
      console.log('⚠️ 크롤링된 타자 기록 데이터가 없습니다');
      return NextResponse.json({
        success: true,
        message: '타자 기록 데이터 없음',
        timestamp: new Date().toISOString(),
        teamsCount: 0
      });
    }

    await saveBattingStats(battingStats);

    const verificationResult = await sql`
      SELECT COUNT(*) as count
      FROM batting_stats;
    `;

    const savedCount = parseInt(verificationResult.rows[0].count);

    console.log('=== 타자 기록 크론잡 완료 ===');

    return NextResponse.json({
      success: true,
      message: '타자 기록 크롤링 및 저장 완료',
      scrapedTeams: battingStats.length,
      savedTeams: savedCount,
      topTeamByAvg: battingStats[0]?.teamName || 'Unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 타자 기록 크론잡 실행 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '타자 기록 크롤링 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🧪 수동 타자 기록 크롤링 테스트 실행');
  return POST();
}