import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

import type { GameSchedule, GameStatus } from '@/types/game';
import { getTeamIdFromDB, TEAM_ID_MAPPING } from '@/constants/teamData';

interface NextGameData extends GameSchedule {
  opponent: string;
  is_home_game: boolean;
  team_role: 'home' | 'away';
}

interface NextGameResponse {
  success: true;
  data: {
    team_id: string;
    ui_team_id: string;
    next_game: NextGameData | null;
    days_until_game: number | null;
    total_upcoming_games: number;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type ApiResponse = NextGameResponse | ErrorResponse;

interface RouteParams {
  params: Promise<{
    teamId: string;
  }>;
}

interface DbNextGameResult {
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
  days_until: number;
}

interface DbUpcomingCountResult {
  upcoming_count: number;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  const { teamId } = await params;
  const dbTeamId = TEAM_ID_MAPPING[teamId.toLowerCase()];

  try {
    console.log(`=== 다가오는 경기 조회: ${teamId} -> ${dbTeamId} ===`);

    if (!dbTeamId) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        error: `지원하지 않는 팀 ID입니다: ${teamId}. 사용 가능한 팀: ${Object.keys(TEAM_ID_MAPPING).join(', ')}`
      }, { status: 400 });
    }

    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const today = koreaTime.toISOString().split('T')[0];
    const currentTime = koreaTime.toTimeString().split(' ')[0];

    console.log(`현재 한국 시간: ${today} ${currentTime}`);

    const nextGameResult = await sql<DbNextGameResult>`
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
        updated_at,
        (date - CURRENT_DATE) as days_until
      FROM game_schedule
      WHERE (home_team = ${dbTeamId} OR away_team = ${dbTeamId})
        AND (
          date > ${today}
          OR (date = ${today} AND game_time > ${currentTime})
        )
        AND status = 'scheduled'
      ORDER BY date ASC, game_time ASC
      LIMIT 1;
    `;

    const upcomingCountResult = await sql<DbUpcomingCountResult>`
      SELECT COUNT(*) as upcoming_count
      FROM game_schedule
      WHERE (home_team = ${dbTeamId} OR away_team = ${dbTeamId})
        AND (
          date > ${today}
          OR (date = ${today} AND game_time > ${currentTime})
        )
        AND status = 'scheduled';
    `;

    const totalUpcomingGames = Number(upcomingCountResult.rows[0]?.upcoming_count || 0);

    if (nextGameResult.rows.length === 0) {
      return NextResponse.json<NextGameResponse>({
        success: true,
        data: {
          team_id: dbTeamId,
          ui_team_id: teamId,
          next_game: null,
          days_until_game: null,
          total_upcoming_games: totalUpcomingGames
        }
      });
    }

    const gameRow = nextGameResult.rows[0];
    const isHomeGame = gameRow.home_team === dbTeamId;
    const opponent = isHomeGame ? getTeamIdFromDB(gameRow.away_team) : getTeamIdFromDB(gameRow.home_team);

    const nextGame: NextGameData = {
      id: gameRow.id,
      date: gameRow.date.toISOString().split('T')[0],
      home_team: getTeamIdFromDB(gameRow.home_team),
      away_team: getTeamIdFromDB(gameRow.away_team),
      stadium: gameRow.stadium || '미정',
      game_time: gameRow.game_time || '18:30:00',
      status: validateGameStatus(gameRow.status),
      
      home_score: gameRow.home_score,
      away_score: gameRow.away_score,
      winner: gameRow.winner,
      
      innings: gameRow.innings ?? 9,
      attendance: gameRow.attendance,
      weather: gameRow.weather,
      game_duration: gameRow.game_duration,
      
      created_at: gameRow.created_at.toISOString(),
      updated_at: gameRow.updated_at.toISOString(),
      
      opponent,
      is_home_game: isHomeGame,
      team_role: isHomeGame ? 'home' : 'away'
    };

    return NextResponse.json<NextGameResponse>({
      success: true,
      data: {
        team_id: dbTeamId,
        ui_team_id: teamId,
        next_game: nextGame,
        days_until_game: Number(gameRow.days_until),
        total_upcoming_games: totalUpcomingGames
      }
    });

  } catch (error) {
    console.error(`❌ 다가오는 경기 조회 실패 (${teamId}):`, error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: '다가오는 경기 조회 실패',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function validateGameStatus(status: string): GameStatus {
  const validStatuses: GameStatus[] = ['scheduled', 'completed', 'postponed', 'cancelled'];
  return validStatuses.includes(status as GameStatus) ? (status as GameStatus) : 'scheduled';
}