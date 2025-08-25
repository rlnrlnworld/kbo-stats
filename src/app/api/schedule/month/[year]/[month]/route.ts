import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GamesByDate, GameSchedule, GameStatus } from '@/types/game';

interface MonthlyScheduleResponse {
  success: true;
  data: {
    year: number;
    month: number;
    total_games: number;
    dates_with_games: number;
    games_by_date: GamesByDate;
    raw_games: GameSchedule[];
    // 추가 통계 정보
    completed_games: number;
    scheduled_games: number;
    postponed_games: number;
    cancelled_games: number;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type ApiResponse = MonthlyScheduleResponse | ErrorResponse;

interface RouteParams {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

interface DbGameResult {
  id: number;
  date: Date;
  home_team: string;
  away_team: string;
  stadium: string | null;
  game_time: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  innings: number | null;
  attendance: number | null;
  weather: string | null;
  game_duration: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  const { year, month } = await params;
  
  try {
    console.log(`=== 월별 일정 조회: ${year}년 ${month}월 ===`);

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        error: '유효하지 않은 년도 또는 월입니다.'
      }, { status: 400 });
    }

    if (yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        error: '지원하지 않는 년도입니다. (2020-2030)'
      }, { status: 400 });
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const result = await sql<DbGameResult>`
      SELECT 
        id,
        date,
        home_team,
        away_team,
        stadium,
        game_time,
        status,
        home_score,
        away_score,
        winner,
        innings,
        attendance,
        weather,
        game_duration,
        created_at,
        updated_at
      FROM game_schedule
      WHERE date >= ${startDate}
        AND date <= ${endDate}
      ORDER BY date ASC, game_time ASC;
    `;

    const games: GameSchedule[] = result.rows.map((row): GameSchedule => ({
      id: row.id,
      date: row.date.toISOString().split('T')[0],
      home_team: row.home_team,
      away_team: row.away_team,
      stadium: row.stadium || '미정',
      game_time: row.game_time || '18:30:00',
      status: isValidGameStatus(row.status) ? row.status as GameStatus : 'scheduled',
      
      home_score: row.home_score,
      away_score: row.away_score,
      winner: row.winner ? row.winner : null,
      
      innings: row.innings ?? 9,
      attendance: row.attendance,
      weather: row.weather,
      game_duration: row.game_duration,
      
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString()
    }));

    const gamesByDate: GamesByDate = {};
    
    games.forEach(game => {
      const dateKey = game.date;
      if (!gamesByDate[dateKey]) {
        gamesByDate[dateKey] = [];
      }
      gamesByDate[dateKey].push(game);
    });

    const gameStats = games.reduce((stats, game) => {
      stats[game.status]++;
      return stats;
    }, {
      completed: 0,
      scheduled: 0,
      postponed: 0,
      cancelled: 0
    } as Record<GameStatus, number>);

    const totalGames = games.length;
    const datesWithGames = Object.keys(gamesByDate).length;

    return NextResponse.json<MonthlyScheduleResponse>({
      success: true,
      data: {
        year: yearNum,
        month: monthNum,
        total_games: totalGames,
        dates_with_games: datesWithGames,
        games_by_date: gamesByDate,
        raw_games: games,
        
        completed_games: gameStats.completed,
        scheduled_games: gameStats.scheduled,
        postponed_games: gameStats.postponed,
        cancelled_games: gameStats.cancelled
      }
    });

  } catch (error) {
    console.error(`❌ 월별 일정 조회 실패 (${year}-${month}):`, error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: '월별 일정 조회 실패',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function isValidGameStatus(status: string): status is GameStatus {
  return ['scheduled', 'completed', 'postponed', 'cancelled'].includes(status);
}