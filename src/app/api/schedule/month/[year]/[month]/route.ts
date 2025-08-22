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
  stadium: string;
  game_time: string;
  status: string;
  created_at: Date;
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
        created_at
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
      created_at: row.created_at.toISOString()
    }));

    const gamesByDate: GamesByDate = {};
    
    games.forEach(game => {
      const dateKey = game.date;
      if (!gamesByDate[dateKey]) {
        gamesByDate[dateKey] = [];
      }
      gamesByDate[dateKey].push(game);
    });

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
        raw_games: games
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