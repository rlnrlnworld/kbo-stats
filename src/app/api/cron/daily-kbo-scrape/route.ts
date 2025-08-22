// src/app/api/cron/daily-kbo-scrape/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import * as cheerio from 'cheerio';

const TEAM_MAPPING: { [key: string]: string } = {
  'LG': 'LG',
  'KIA': 'KIA', 
  'SSG': 'SSG',
  '두산': 'DU',
  'KT': 'KT',
  '롯데': 'LT',
  '삼성': 'SS',
  'NC': 'NC',
  '한화': 'HH',
  '키움': 'KW'
};

interface TeamRanking {
  teamId: string;
  teamName: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  gamesBack: number;
}

async function scrapeCurrentKboRankings(): Promise<{ teams: TeamRanking[], date: string } | null> {
  const url = 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx';
  
  try {
    console.log('🕷️ KBO 현재 순위 크롤링 시작...');
    
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

    const dateElement = $('span[id*="lblSearchDateTitle"]');
    let currentDate = new Date().toISOString().split('T')[0];
    
    if (dateElement.length > 0) {
      const dateText = dateElement.text().trim();
      currentDate = dateText.replace(/\./g, '-');
    }

    console.log(`📅 크롤링 날짜: ${currentDate}`);

    const teams: TeamRanking[] = [];
    const rankingRows = $('table.tData tbody tr');

    if (rankingRows.length === 0) {
      console.log('⚠️ 순위 데이터가 없습니다 (경기 없는 날일 수 있음)');
      return null;
    }

    const maxTeams = Math.min(rankingRows.length, 10);
    
    for (let index = 0; index < maxTeams; index++) {
      const row = rankingRows.eq(index);
      const cells = row.find('td');
      
      if (cells.length >= 8) {
        try {
          const rankText = cells.eq(0).text().trim();
          const teamName = cells.eq(1).text().trim();
          const winsText = cells.eq(3).text().trim();
          const lossesText = cells.eq(4).text().trim();
          const tiesText = cells.eq(5).text().trim();
          const winRateText = cells.eq(6).text().trim();
          const gamesBackText = cells.eq(7).text().trim();

          const rank = parseInt(rankText);
          const wins = parseInt(winsText);
          const losses = parseInt(lossesText);
          const ties = parseInt(tiesText);
          const winRate = parseFloat(winRateText);

          if (isNaN(rank) || isNaN(wins) || isNaN(losses) || isNaN(ties) || isNaN(winRate)) {
            console.log(`⚠️ ${index + 1}번째 행 데이터 무효 - 건너뛰기: ${teamName}`);
            continue;
          }

          let gamesBack = 0.0;
          if (gamesBackText && gamesBackText !== '0' && gamesBackText !== '-') {
            const parsed = parseFloat(gamesBackText);
            if (!isNaN(parsed)) {
              gamesBack = parsed;
            }
          }

          const teamId = TEAM_MAPPING[teamName] || teamName.substring(0, 3).toUpperCase();
          
          if (!TEAM_MAPPING[teamName]) {
            console.log(`⚠️ 알 수 없는 팀명: ${teamName} - 건너뛰기`);
            continue;
          }

          teams.push({
            teamId,
            teamName,
            rank,
            wins,
            losses,
            ties,
            winRate: Math.round(winRate * 1000) / 1000,
            gamesBack: Math.round(gamesBack * 10) / 10
          });

          console.log(`✅ ${rank}위 ${teamName}(${teamId}): ${wins}승 ${losses}패 승률${winRate} 게임차${gamesBack}`);

        } catch (error) {
          console.error(`⚠️ ${index + 1}번째 행 파싱 실패:`, error);
          continue;
        }
      }
    }

    console.log(`🎉 크롤링 완료: ${teams.length}개 팀 (최대 10개로 제한)`);
    
    if (teams.length < 10) {
      console.log(`⚠️ 예상보다 적은 팀 데이터: ${teams.length}개 (정상적으로는 10개)`);
    }
    
    return { teams, date: currentDate };

  } catch (error) {
    console.error('❌ KBO 크롤링 실패:', error);
    throw error;
  }
}

async function saveTodayRankings(teams: TeamRanking[], date: string): Promise<void> {
  try {
    console.log(`💾 ${date} 순위 데이터 저장 시작... (${teams.length}개 팀)`);

    for (const team of teams) {
      // 저장 전 한 번 더 데이터 검증
      if (isNaN(team.rank) || isNaN(team.wins) || isNaN(team.losses) || isNaN(team.ties) || isNaN(team.winRate)) {
        console.error(`⚠️ 유효하지 않은 데이터 발견, 건너뛰기:`, team);
        continue;
      }

      await sql`
        INSERT INTO daily_team_rankings 
        (date, team_id, team_name, rank, wins, losses, ties, win_rate, games_back)
        VALUES (
          ${date}::date,
          ${team.teamId}, 
          ${team.teamName}, 
          ${team.rank}, 
          ${team.wins}, 
          ${team.losses}, 
          ${team.ties}, 
          ${team.winRate}, 
          ${team.gamesBack}
        )
        ON CONFLICT (date, team_id) 
        DO UPDATE SET 
          team_name = EXCLUDED.team_name,
          rank = EXCLUDED.rank,
          wins = EXCLUDED.wins,
          losses = EXCLUDED.losses,
          ties = EXCLUDED.ties,
          win_rate = EXCLUDED.win_rate,
          games_back = EXCLUDED.games_back,
          created_at = CURRENT_TIMESTAMP;
      `;
    }

    console.log(`✅ ${date} 데이터 저장 완료`);

  } catch (error) {
    console.error('❌ 데이터베이스 저장 실패:', error);
    throw error;
  }
}

export async function POST() {
  try {
    console.log('=== 일일 KBO 순위 크롤링 크론잡 시작 ===');
    console.log('시간:', new Date().toISOString());

    const result = await scrapeCurrentKboRankings();
    
    if (!result || !result.teams || result.teams.length === 0) {
      console.log('⚠️ 크롤링된 데이터가 없습니다 (경기 없는 날일 수 있음)');
      return NextResponse.json({
        success: true,
        message: '경기 없는 날 - 데이터 없음',
        date: new Date().toISOString().split('T')[0],
        teamsCount: 0
      });
    }

    await saveTodayRankings(result.teams, result.date);

    const verificationResult = await sql`
      SELECT COUNT(*) as count
      FROM daily_team_rankings 
      WHERE date = ${result.date}::date;
    `;

    const savedCount = parseInt(verificationResult.rows[0].count);

    console.log('=== 일일 크론잡 완료 ===');

    return NextResponse.json({
      success: true,
      message: '일일 순위 크롤링 및 저장 완료',
      date: result.date,
      scrapedTeams: result.teams.length,
      savedTeams: savedCount,
      topTeam: result.teams[0]?.teamName || 'Unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 크론잡 실행 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '일일 크롤링 실패',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('🧪 수동 크롤링 테스트 실행');
  return POST();
}