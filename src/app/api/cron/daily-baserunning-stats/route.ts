import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as cheerio from 'cheerio';
import { BaserunningStats, TEAM_MAPPING } from '@/types/team';

async function scrapeBaserunningStats(): Promise<BaserunningStats[] | null> {
  const url = 'https://www.koreabaseball.com/Record/Team/Runner/Basic.aspx';
  
  try {
    console.log('🏃 KBO 팀 주루 기록 크롤링 시작...');
    
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

    const baserunningStats: BaserunningStats[] = [];
    const tableRows = $('table.tData tbody tr');

    if (tableRows.length === 0) {
      console.log('⚠️ 주루 기록 데이터가 없습니다');
      return null;
    }

    const maxTeams = Math.min(tableRows.length, 10);
    
    for (let index = 0; index < maxTeams; index++) {
      const row = tableRows.eq(index);
      const cells = row.find('td');
      
      if (cells.length >= 9) {
        try {
          const teamName = cells.eq(1).text().trim();
          const gText = cells.eq(2).text().trim();
          const sbaText = cells.eq(3).text().trim();  // 도루시도
          const sbText = cells.eq(4).text().trim();   // 도루성공
          const csText = cells.eq(5).text().trim();   // 도루실패
          const sbPctText = cells.eq(6).text().trim(); // 도루성공률
          const oobText = cells.eq(7).text().trim();  // 주루사 (OOB)
          const pkoText = cells.eq(8).text().trim();  // 견제사 (PKO)

          const g = parseInt(gText);
          const sba = parseInt(sbaText);
          const sb = parseInt(sbText);
          const cs = parseInt(csText);
          const sbPct = parseFloat(sbPctText);
          const oob = parseInt(oobText);
          const pko = parseInt(pkoText);

          if (isNaN(g) || isNaN(sba) || isNaN(sb) || isNaN(cs) || isNaN(sbPct)) {
            console.log(`⚠️ ${index + 1}번째 행 데이터 무효 - 건너뛰기: ${teamName}`);
            continue;
          }

          const teamId = TEAM_MAPPING[teamName];
          if (!teamId) {
            console.log(`⚠️ 알 수 없는 팀명: ${teamName} - 건너뛰기`);
            continue;
          }

          baserunningStats.push({
            teamId,
            teamName,
            g,
            sba,
            sb,
            cs,
            sbPct: Math.round(sbPct * 10) / 10, // 소수점 1자리 (74.7%)
            oob: isNaN(oob) ? 0 : oob,
            pko: isNaN(pko) ? 0 : pko
          });

          console.log(`✅ ${teamName}(${teamId}): ${g}경기 도루${sb}/${sba} 성공률${sbPct}% 주루사${oob}`);

        } catch (error) {
          console.error(`⚠️ ${index + 1}번째 행 파싱 실패:`, error);
          continue;
        }
      }
    }

    console.log(`🎉 주루 기록 크롤링 완료: ${baserunningStats.length}개 팀`);
    
    if (baserunningStats.length < 10) {
      console.log(`⚠️ 예상보다 적은 팀 데이터: ${baserunningStats.length}개 (정상적으로는 10개)`);
    }
    
    return baserunningStats;

  } catch (error) {
    console.error('❌ 주루 기록 크롤링 실패:', error);
    throw error;
  }
}

async function saveBaserunningStats(stats: BaserunningStats[]): Promise<void> {
  try {
    console.log(`💾 주루 기록 데이터 저장 시작... (${stats.length}개 팀)`);

    for (const stat of stats) {
      if (isNaN(stat.g) || isNaN(stat.sba) || isNaN(stat.sb) || isNaN(stat.sbPct)) {
        console.error(`⚠️ 유효하지 않은 데이터 발견, 건너뛰기:`, stat);
        continue;
      }

      await sql`
        INSERT INTO baserunning_stats 
        (
          team_id, team_name, g, sba, sb, cs, sb_pct, ob, bp, ko
        )
        VALUES (
          ${stat.teamId}, 
          ${stat.teamName}, 
          ${stat.g}, 
          ${stat.sba}, 
          ${stat.sb}, 
          ${stat.cs}, 
          ${stat.sbPct}, 
          ${stat.oob},   -- HTML의 OOB(주루사)를 ob 컬럼으로
          ${stat.pko},   -- HTML의 PKO(견제사)를 bp 컬럼으로  
          0              -- ko(삼진)는 HTML에 없어서 0으로 설정
        )
        ON CONFLICT (team_id) 
        DO UPDATE SET 
          team_name = EXCLUDED.team_name,
          g = EXCLUDED.g,
          sba = EXCLUDED.sba,
          sb = EXCLUDED.sb,
          cs = EXCLUDED.cs,
          sb_pct = EXCLUDED.sb_pct,
          ob = EXCLUDED.ob,
          bp = EXCLUDED.bp,
          ko = EXCLUDED.ko,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }

    console.log(`✅ 주루 기록 데이터 저장 완료`);

  } catch (error) {
    console.error('❌ 주루 기록 데이터베이스 저장 실패:', error);
    throw error;
  }
}

export async function POST() {
  try {
    console.log('=== 일일 KBO 주루 기록 크롤링 크론잡 시작 ===');
    console.log('시간:', new Date().toISOString());

    const baserunningStats = await scrapeBaserunningStats();
    
    if (!baserunningStats || baserunningStats.length === 0) {
      console.log('⚠️ 크롤링된 주루 기록 데이터가 없습니다');
      return NextResponse.json({
        success: true,
        message: '주루 기록 데이터 없음',
        timestamp: new Date().toISOString(),
        teamsCount: 0
      });
    }

    await saveBaserunningStats(baserunningStats);

    const verificationResult = await sql`
      SELECT COUNT(*) as count
      FROM baserunning_stats;
    `;

    const savedCount = parseInt(verificationResult.rows[0].count);

    console.log('=== 주루 기록 크론잡 완료 ===');

    return NextResponse.json({
      success: true,
      message: '주루 기록 크롤링 및 저장 완료',
      scrapedTeams: baserunningStats.length,
      savedTeams: savedCount,
      topTeamBySb: baserunningStats[0]?.teamName || 'Unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 주루 기록 크론잡 실행 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '주루 기록 크롤링 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🧪 수동 주루 기록 크롤링 테스트 실행');
  return POST();
}