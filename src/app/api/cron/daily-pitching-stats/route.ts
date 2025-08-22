import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as cheerio from 'cheerio';
import { PitchingStats, TEAM_MAPPING } from '@/types/team';

function parseInnings(inningsText: string): number {
  const match = inningsText.match(/(\d+)(?:\s+(\d+)\/(\d+))?/);
  if (!match) return 0;
  
  let innings = parseInt(match[1]);
  
  if (match[2] && match[3]) {
    const numerator = parseInt(match[2]);
    const denominator = parseInt(match[3]);
    innings += numerator / denominator;
  }
  
  return Math.round(innings * 10) / 10;
}

async function scrapePitchingStats(): Promise<PitchingStats[] | null> {
  const url = 'https://www.koreabaseball.com/Record/Team/Pitcher/Basic1.aspx';
  
  try {
    console.log('⚾ KBO 팀 투수 기록 크롤링 시작...');
    
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

    const pitchingStats: PitchingStats[] = [];
    const tableRows = $('table.tData tbody tr');

    if (tableRows.length === 0) {
      console.log('⚠️ 투수 기록 데이터가 없습니다');
      return null;
    }

    const maxTeams = Math.min(tableRows.length, 10);
    
    for (let index = 0; index < maxTeams; index++) {
      const row = tableRows.eq(index);
      const cells = row.find('td');
      
      if (cells.length >= 18) {
        try {
          const teamName = cells.eq(1).text().trim();
          const eraText = cells.eq(2).text().trim();
          const gText = cells.eq(3).text().trim();
          const wText = cells.eq(4).text().trim();
          const lText = cells.eq(5).text().trim();
          const svText = cells.eq(6).text().trim();
          const hldText = cells.eq(7).text().trim();
          const wpctText = cells.eq(8).text().trim();
          const ipText = cells.eq(9).text().trim();
          const hText = cells.eq(10).text().trim();
          const hrText = cells.eq(11).text().trim();
          const bbText = cells.eq(12).text().trim();
          const hbpText = cells.eq(13).text().trim();
          const soText = cells.eq(14).text().trim();
          const rText = cells.eq(15).text().trim();
          const erText = cells.eq(16).text().trim();
          const whipText = cells.eq(17).text().trim();

          const era = parseFloat(eraText);
          const g = parseInt(gText);
          const w = parseInt(wText);
          const l = parseInt(lText);
          const sv = parseInt(svText);
          const hld = parseInt(hldText);
          const wpct = parseFloat(wpctText);
          const ip = parseInnings(ipText);
          const h = parseInt(hText);
          const hr = parseInt(hrText);
          const bb = parseInt(bbText);
          const hbp = parseInt(hbpText);
          const so = parseInt(soText);
          const r = parseInt(rText);
          const er = parseInt(erText);
          const whip = parseFloat(whipText);

          if (isNaN(era) || isNaN(g) || isNaN(w) || isNaN(l) || 
              isNaN(wpct) || isNaN(ip) || isNaN(h)) {
            console.log(`⚠️ ${index + 1}번째 행 데이터 무효 - 건너뛰기: ${teamName}`);
            continue;
          }

          const teamId = TEAM_MAPPING[teamName];
          if (!teamId) {
            console.log(`⚠️ 알 수 없는 팀명: ${teamName} - 건너뛰기`);
            continue;
          }

          pitchingStats.push({
            teamId,
            teamName,
            era: Math.round(era * 100) / 100,
            g,
            w,
            l,
            sv: isNaN(sv) ? 0 : sv,
            hld: isNaN(hld) ? 0 : hld,
            wpct: Math.round(wpct * 1000) / 1000,
            ip,
            h,
            hr: isNaN(hr) ? 0 : hr,
            bb: isNaN(bb) ? 0 : bb,
            hbp: isNaN(hbp) ? 0 : hbp,
            so: isNaN(so) ? 0 : so,
            r: isNaN(r) ? 0 : r,
            er: isNaN(er) ? 0 : er,
            whip: isNaN(whip) ? 0 : Math.round(whip * 100) / 100 // 소수점 2자리
          });

          console.log(`✅ ${teamName}(${teamId}): ERA${era} ${g}경기 ${w}승${l}패 이닝${ip}`);

        } catch (error) {
          console.error(`⚠️ ${index + 1}번째 행 파싱 실패:`, error);
          continue;
        }
      }
    }

    console.log(`🎉 투수 기록 크롤링 완료: ${pitchingStats.length}개 팀`);
    
    if (pitchingStats.length < 10) {
      console.log(`⚠️ 예상보다 적은 팀 데이터: ${pitchingStats.length}개 (정상적으로는 10개)`);
    }
    
    return pitchingStats;

  } catch (error) {
    console.error('❌ 투수 기록 크롤링 실패:', error);
    throw error;
  }
}

async function savePitchingStats(stats: PitchingStats[]): Promise<void> {
  try {
    console.log(`💾 투수 기록 데이터 저장 시작... (${stats.length}개 팀)`);

    for (const stat of stats) {
      if (isNaN(stat.era) || isNaN(stat.g) || isNaN(stat.w) || isNaN(stat.l)) {
        console.error(`⚠️ 유효하지 않은 데이터 발견, 건너뛰기:`, stat);
        continue;
      }

      await sql`
        INSERT INTO pitching_stats 
        (
          team_id, team_name, era, g, w, l, sv, hld, wpct, ip, 
          h, hr, bb, hbp, so, r, er, whip
        )
        VALUES (
          ${stat.teamId}, 
          ${stat.teamName}, 
          ${stat.era}, 
          ${stat.g}, 
          ${stat.w}, 
          ${stat.l}, 
          ${stat.sv}, 
          ${stat.hld}, 
          ${stat.wpct}, 
          ${stat.ip}, 
          ${stat.h}, 
          ${stat.hr}, 
          ${stat.bb}, 
          ${stat.hbp}, 
          ${stat.so}, 
          ${stat.r}, 
          ${stat.er}, 
          ${stat.whip}
        )
        ON CONFLICT (team_id) 
        DO UPDATE SET 
          team_name = EXCLUDED.team_name,
          era = EXCLUDED.era,
          g = EXCLUDED.g,
          w = EXCLUDED.w,
          l = EXCLUDED.l,
          sv = EXCLUDED.sv,
          hld = EXCLUDED.hld,
          wpct = EXCLUDED.wpct,
          ip = EXCLUDED.ip,
          h = EXCLUDED.h,
          hr = EXCLUDED.hr,
          bb = EXCLUDED.bb,
          hbp = EXCLUDED.hbp,
          so = EXCLUDED.so,
          r = EXCLUDED.r,
          er = EXCLUDED.er,
          whip = EXCLUDED.whip,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }

    console.log(`✅ 투수 기록 데이터 저장 완료`);

  } catch (error) {
    console.error('❌ 투수 기록 데이터베이스 저장 실패:', error);
    throw error;
  }
}

export async function POST() {
  try {
    console.log('=== 일일 KBO 투수 기록 크롤링 크론잡 시작 ===');
    console.log('시간:', new Date().toISOString());

    const pitchingStats = await scrapePitchingStats();
    
    if (!pitchingStats || pitchingStats.length === 0) {
      console.log('⚠️ 크롤링된 투수 기록 데이터가 없습니다');
      return NextResponse.json({
        success: true,
        message: '투수 기록 데이터 없음',
        timestamp: new Date().toISOString(),
        teamsCount: 0
      });
    }

    await savePitchingStats(pitchingStats);

    // 저장 결과 확인
    const verificationResult = await sql`
      SELECT COUNT(*) as count
      FROM pitching_stats;
    `;

    const savedCount = parseInt(verificationResult.rows[0].count);

    console.log('=== 투수 기록 크론잡 완료 ===');

    return NextResponse.json({
      success: true,
      message: '투수 기록 크롤링 및 저장 완료',
      scrapedTeams: pitchingStats.length,
      savedTeams: savedCount,
      topTeamByEra: pitchingStats[0]?.teamName || 'Unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 투수 기록 크론잡 실행 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '투수 기록 크롤링 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🧪 수동 투수 기록 크롤링 테스트 실행');
  return POST();
}