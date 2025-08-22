import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as cheerio from 'cheerio';
import { DefenseStats, TEAM_MAPPING } from '@/types/team';

async function scrapeFieldingStats(): Promise<DefenseStats[] | null> {
  const url = 'https://www.koreabaseball.com/Record/Team/Defense/Basic.aspx';
  
  try {
    console.log('🛡️ KBO 팀 수비 기록 크롤링 시작...');
    
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

    const fieldingStats: DefenseStats[] = [];
    const tableRows = $('table.tData tbody tr');

    if (tableRows.length === 0) {
      console.log('⚠️ 수비 기록 데이터가 없습니다');
      return null;
    }

    const maxTeams = Math.min(tableRows.length, 10);
    
    for (let index = 0; index < maxTeams; index++) {
      const row = tableRows.eq(index);
      const cells = row.find('td');
      
      if (cells.length >= 13) {
        try {
          const teamName = cells.eq(1).text().trim();
          const gText = cells.eq(2).text().trim();
          const eText = cells.eq(3).text().trim();
          const pkText = cells.eq(4).text().trim();
          const poText = cells.eq(5).text().trim();
          const aText = cells.eq(6).text().trim();
          const dpText = cells.eq(7).text().trim();
          const fpctText = cells.eq(8).text().trim();
          const pbText = cells.eq(9).text().trim();
          const sbText = cells.eq(10).text().trim();
          const csText = cells.eq(11).text().trim();
          const csPctText = cells.eq(12).text().trim();

          const g = parseInt(gText);
          const e = parseInt(eText);
          const pk = parseInt(pkText);
          const po = parseInt(poText);
          const a = parseInt(aText);
          const dp = parseInt(dpText);
          const fpct = parseFloat(fpctText);
          const pb = parseInt(pbText);
          const sb = parseInt(sbText);
          const cs = parseInt(csText);
          const csPct = parseFloat(csPctText);

          if (isNaN(g) || isNaN(e) || isNaN(po) || isNaN(a) || isNaN(fpct)) {
            console.log(`⚠️ ${index + 1}번째 행 데이터 무효 - 건너뛰기: ${teamName}`);
            continue;
          }

          const teamId = TEAM_MAPPING[teamName];
          if (!teamId) {
            console.log(`⚠️ 알 수 없는 팀명: ${teamName} - 건너뛰기`);
            continue;
          }

          fieldingStats.push({
            teamId,
            teamName,
            g,
            e,
            pk: isNaN(pk) ? 0 : pk,
            po,
            a,
            dp: isNaN(dp) ? 0 : dp,
            fpct: Math.round(fpct * 1000) / 1000, // 소수점 3자리
            pb: isNaN(pb) ? 0 : pb,
            sb: isNaN(sb) ? 0 : sb,
            cs: isNaN(cs) ? 0 : cs,
            csPct: isNaN(csPct) ? 0 : Math.round(csPct * 10) / 10 // 소수점 1자리
          });

          console.log(`✅ ${teamName}(${teamId}): ${g}경기 실책${e} 수비율${fpct} 도루저지율${csPct}%`);

        } catch (error) {
          console.error(`⚠️ ${index + 1}번째 행 파싱 실패:`, error);
          continue;
        }
      }
    }

    console.log(`🎉 수비 기록 크롤링 완료: ${fieldingStats.length}개 팀`);
    
    // 10개 팀이 정확히 크롤링되지 않으면 경고
    if (fieldingStats.length < 10) {
      console.log(`⚠️ 예상보다 적은 팀 데이터: ${fieldingStats.length}개 (정상적으로는 10개)`);
    }
    
    return fieldingStats;

  } catch (error) {
    console.error('❌ 수비 기록 크롤링 실패:', error);
    throw error;
  }
}

async function saveFieldingStats(stats: FieldingStats[]): Promise<void> {
  try {
    console.log(`💾 수비 기록 데이터 저장 시작... (${stats.length}개 팀)`);

    for (const stat of stats) {
      // 저장 전 한 번 더 데이터 검증
      if (isNaN(stat.g) || isNaN(stat.e) || isNaN(stat.po) || isNaN(stat.fpct)) {
        console.error(`⚠️ 유효하지 않은 데이터 발견, 건너뛰기:`, stat);
        continue;
      }

      await sql`
        INSERT INTO fielding_stats 
        (
          team_id, team_name, g, e, pk, po, a, dp, fpct, pb, sb, cs, cs_pct
        )
        VALUES (
          ${stat.teamId}, 
          ${stat.teamName}, 
          ${stat.g}, 
          ${stat.e}, 
          ${stat.pk}, 
          ${stat.po}, 
          ${stat.a}, 
          ${stat.dp}, 
          ${stat.fpct}, 
          ${stat.pb}, 
          ${stat.sb}, 
          ${stat.cs}, 
          ${stat.csPct}
        )
        ON CONFLICT (team_id) 
        DO UPDATE SET 
          team_name = EXCLUDED.team_name,
          g = EXCLUDED.g,
          e = EXCLUDED.e,
          pk = EXCLUDED.pk,
          po = EXCLUDED.po,
          a = EXCLUDED.a,
          dp = EXCLUDED.dp,
          fpct = EXCLUDED.fpct,
          pb = EXCLUDED.pb,
          sb = EXCLUDED.sb,
          cs = EXCLUDED.cs,
          cs_pct = EXCLUDED.cs_pct,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }

    console.log(`✅ 수비 기록 데이터 저장 완료`);

  } catch (error) {
    console.error('❌ 수비 기록 데이터베이스 저장 실패:', error);
    throw error;
  }
}

export async function POST() {
  try {
    console.log('=== 일일 KBO 수비 기록 크롤링 크론잡 시작 ===');
    console.log('시간:', new Date().toISOString());

    const fieldingStats = await scrapeFieldingStats();
    
    if (!fieldingStats || fieldingStats.length === 0) {
      console.log('⚠️ 크롤링된 수비 기록 데이터가 없습니다');
      return NextResponse.json({
        success: true,
        message: '수비 기록 데이터 없음',
        timestamp: new Date().toISOString(),
        teamsCount: 0
      });
    }

    await saveFieldingStats(fieldingStats);

    // 저장 결과 확인
    const verificationResult = await sql`
      SELECT COUNT(*) as count
      FROM fielding_stats;
    `;

    const savedCount = parseInt(verificationResult.rows[0].count);

    console.log('=== 수비 기록 크론잡 완료 ===');

    return NextResponse.json({
      success: true,
      message: '수비 기록 크롤링 및 저장 완료',
      scrapedTeams: fieldingStats.length,
      savedTeams: savedCount,
      topTeamByFpct: fieldingStats.find(team => team.fpct > 0)?.teamName || 'Unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 수비 기록 크론잡 실행 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '수비 기록 크롤링 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🧪 수동 수비 기록 크롤링 테스트 실행');
  return POST();
}