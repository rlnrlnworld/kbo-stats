import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const TEAM_MAPPING: { [key: string]: string } = {
  'KIA': 'kia',
  '삼성': 'samsung', 
  'LG': 'lg',
  'KT': 'kt',
  '키움': 'kiwoom',
  'NC': 'nc',
  '롯데': 'lotte',
  'SSG': 'ssg',
  '두산': 'doosan',
  '한화': 'hanwha'
};

interface GameUpdate {
  game_id?: number;
  date: string;
  home_team: string;
  away_team: string;
  status: 'scheduled' | 'completed' | 'postponed' | 'cancelled';
  home_score?: number | null;
  away_score?: number | null;
  winner?: string | null;
}

function extractScore(scoreText: string): number | null {
  if (!scoreText) return null;
  const numbers = scoreText.match(/\d+/);
  return numbers ? parseInt(numbers[0]) : null;
}

function determineWinner(homeScore: number, awayScore: number, homeTeam: string, awayTeam: string): string | null {
  if (homeScore > awayScore) return homeTeam;
  if (awayScore > homeScore) return awayTeam;
  return null;
}

function normalizeTeamName(teamName: string): string {
  return TEAM_MAPPING[teamName] || teamName.toLowerCase();
}

function getTodayKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (kstOffset * 60000));
  
  return kstTime.toISOString().split('T')[0];
}

async function scrapeGameResults(date: string): Promise<GameUpdate[]> {
  try {
    const url = `https://m.sports.naver.com/kbaseball/schedule/index?date=${date}`;
    
    console.log(`🔍 ${date} 경기 결과 크롤링 시작...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const games: GameUpdate[] = [];
    
    $('.ScheduleAllType_match_list_group__1nFDy').each((_, section) => {
      const titleElem = $(section).find('.ScheduleAllType_title___Qfd4');
      if (titleElem.text().includes('KBO리그')) {
        
        $(section).find('.MatchBox_match_item__3_D0Q').each((_, item) => {
          if ($(item).hasClass('ScheduleAllType_match_item_empty__10TSo')) {
            return;
          }

          const game: GameUpdate = {
            date: date,
            status: 'scheduled',
            home_team: '',
            away_team: ''
          };

          const statusElem = $(item).find('.MatchBox_status__2pbzi');
          if (statusElem.length) {
            const statusText = statusElem.text().trim();
            const statusMapping: { [key: string]: GameUpdate['status'] } = {
              '예정': 'scheduled',
              '종료': 'completed',
              '연기': 'postponed',
              '취소': 'cancelled'
            };
            game.status = statusMapping[statusText] || 'scheduled';
          }

          const teamItems = $(item).find('.MatchBoxHeadToHeadArea_team_item__25jg6');
          if (teamItems.length >= 2) {
            const awayTeamElem = teamItems.eq(0).find('.MatchBoxHeadToHeadArea_team__40JQL');
            if (awayTeamElem.length) {
              game.away_team = normalizeTeamName(awayTeamElem.text().trim());
            }

            const homeTeamElem = teamItems.eq(1).find('.MatchBoxHeadToHeadArea_team__40JQL');
            const homeMark = teamItems.eq(1).find('.MatchBoxHeadToHeadArea_home_mark__i18Sf');
            
            if (homeTeamElem.length) {
              if (homeMark.length) {
                game.home_team = normalizeTeamName(homeTeamElem.text().trim());
              } else {
                game.home_team = game.away_team;
                game.away_team = normalizeTeamName(homeTeamElem.text().trim());
              }
            }

            if (game.status === 'completed') {
              const scoreWraps = $(item).find('.MatchBoxHeadToHeadArea_score_wrap__caI_I');
              
              if (scoreWraps.length >= 2) {
                const awayScoreElem = scoreWraps.eq(0).find('.MatchBoxHeadToHeadArea_score__e2D7k');
                if (awayScoreElem.length) {
                  game.away_score = extractScore(awayScoreElem.text().trim());
                }

                const homeScoreElem = scoreWraps.eq(1).find('.MatchBoxHeadToHeadArea_score__e2D7k');
                if (homeScoreElem.length) {
                  game.home_score = extractScore(homeScoreElem.text().trim());
                }

                if (game.home_score !== null && game.away_score !== null) {
                  game.winner = determineWinner(
                    game.home_score ?? 0,
                    game.away_score ?? 0,
                    game.home_team,
                    game.away_team
                  );
                }
              }
            }
          }

          if (game.home_team && game.away_team) {
            games.push(game);
          }
        });
      }
    });

    console.log(`✅ ${date}: ${games.length}경기 크롤링 완료`);
    return games;
    
  } catch (error) {
    console.error(`❌ ${date} 크롤링 실패:`, error);
    return [];
  }
}

async function findExistingGame(game: GameUpdate) {
  try {
    const result = await sql`
      SELECT id, status, home_score, away_score, winner
      FROM game_schedule 
      WHERE date = ${game.date} 
        AND home_team = ${game.home_team} 
        AND away_team = ${game.away_team}
      LIMIT 1
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error('기존 경기 조회 실패:', error);
    return null;
  }
}

async function updateGameInDB(game: GameUpdate, existingGameId: number) {
  try {
    if (game.status === 'completed' && game.home_score !== null && game.away_score !== null) {
      await sql`
        UPDATE game_schedule 
        SET 
          status = ${game.status},
          home_score = ${game.home_score},
          away_score = ${game.away_score},
          winner = ${game.winner},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingGameId}
      `;
      
      console.log(`✅ 경기 완료 업데이트: ${game.away_team} vs ${game.home_team} (${game.away_score}-${game.home_score})`);
      
    } else if (game.status === 'postponed' || game.status === 'cancelled') {
      await sql`
        UPDATE game_schedule 
        SET 
          status = ${game.status},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingGameId}
      `;
      
      console.log(`⚠️ 경기 ${game.status}: ${game.away_team} vs ${game.home_team}`);
      
    } else {
      await sql`
        UPDATE game_schedule 
        SET 
          status = ${game.status},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingGameId}
      `;
      
      console.log(`📅 경기 상태 업데이트: ${game.away_team} vs ${game.home_team} (${game.status})`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ 경기 업데이트 실패 (ID: ${existingGameId}):`, error);
    return false;
  }
}

export async function POST() {
  try {
    console.log('🚀 일일 경기 결과 업데이트 크론잡 시작');
    
    const today = getTodayKST();
    console.log(`📅 업데이트 대상 날짜: ${today}`);
    
    const games = await scrapeGameResults(today);
    
    if (games.length === 0) {
      console.log('⚠️ 오늘 경기가 없습니다.');
      return NextResponse.json({
        success: true,
        message: '오늘 경기가 없습니다.',
        date: today,
        updated_count: 0
      });
    }

    console.log(`🔄 ${games.length}경기 업데이트 시작...`);
    
    let updatedCount = 0;
    let errorCount = 0;

    for (const game of games) {
      try {
        const existingGame = await findExistingGame(game);
        
        if (existingGame) {
          const hasChanges = (
            existingGame.status !== game.status ||
            existingGame.home_score !== game.home_score ||
            existingGame.away_score !== game.away_score ||
            existingGame.winner !== game.winner
          );

          if (hasChanges) {
            const success = await updateGameInDB(game, existingGame.id);
            if (success) {
              updatedCount++;
            } else {
              errorCount++;
            }
          } else {
            console.log(`ℹ️ 변경사항 없음: ${game.away_team} vs ${game.home_team}`);
          }
        } else {
          console.log(`⚠️ 기존 경기를 찾을 수 없음: ${game.away_team} vs ${game.home_team}`);
          errorCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ 경기 처리 실패 (${game.away_team} vs ${game.home_team}):`, error);
        errorCount++;
      }
    }

    console.log('✅ 일일 경기 결과 업데이트 완료');
    console.log(`📊 업데이트된 경기: ${updatedCount}개`);
    console.log(`❌ 실패한 경기: ${errorCount}개`);

    return NextResponse.json({
      success: true,
      message: '경기 결과 업데이트 완료',
      date: today,
      total_games: games.length,
      updated_count: updatedCount,
      error_count: errorCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 크론잡 실행 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '크론잡 실행 실패',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('🧪 수동 테스트 모드로 크론잡 실행');
  return POST();
}