// src/app/api/schedule/team/[teamId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

import type { GameSchedule, GameStatus, GamesByDate } from '@/types/game';
import { TEAM_ID_MAPPING } from '@/constants/teamData';

interface TeamScheduleGame extends GameSchedule {
  opponent: string;
  is_home_game: boolean;
  team_role: 'home' | 'away';
}

interface StatusBreakdown {
  scheduled?: number;
  completed?: number;
  postponed?: number;
  cancelled?: number;
}

interface TeamScheduleResponse {
  success: true;
  data: {
    team_id: string;
    ui_team_id: string;
    query_date: string | null;
    total_games: number;
    home_games: number;
    away_games: number;
    status_breakdown: StatusBreakdown;
    games: TeamScheduleGame[];
    games_by_date?: GamesByDate;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type TeamApiResponse = TeamScheduleResponse | ErrorResponse;

interface RouteParams {
  params: Promise<{
    teamId: string;
  }>;
}

interface DbTeamGameResult {
  id: number;
  date: Date;
  home_team: string;
  away_team: string;
  stadium: string | null;
  game_time: string | null;
  status: string;
  created_at: Date;
}


export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<TeamApiResponse>> {
  const { teamId } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const groupByDate = searchParams.get('groupByDate') === 'true';
  
  const dbTeamId = TEAM_ID_MAPPING[teamId.toLowerCase()];

  try {
    console.log(`=== 팀 일정 조회: ${teamId} -> ${dbTeamId} ${date ? `(${date})` : '(전체)'} ===`);

    if (!dbTeamId) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        error: `지원하지 않는 팀 ID입니다: ${teamId}. 사용 가능한 팀: ${Object.keys(TEAM_ID_MAPPING).join(', ')}`
      }, { status: 400 });
    }

    let result;

    if (date) {
      if (!isValidDateFormat(date)) {
        return NextResponse.json<ErrorResponse>({
          success: false,
          error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD 형식 필요)'
        }, { status: 400 });
      }

      result = await sql<DbTeamGameResult>`
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
        WHERE (home_team = ${dbTeamId} OR away_team = ${dbTeamId})
          AND date = ${date}
        ORDER BY game_time ASC;
      `;
    } else {
      result = await sql<DbTeamGameResult>`
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
        WHERE home_team = ${dbTeamId} OR away_team = ${dbTeamId}
        ORDER BY date ASC, game_time ASC;
      `;
    }

    if (result.rows.length === 0) {
      return NextResponse.json<ErrorResponse>({
        success: false,
        error: date 
          ? `${teamId} 팀의 ${date} 일정을 찾을 수 없습니다.`
          : `${teamId} 팀의 일정을 찾을 수 없습니다.`
      }, { status: 404 });
    }

    const games: TeamScheduleGame[] = result.rows.map((row): TeamScheduleGame => {
      const isHomeGame = row.home_team === dbTeamId;
      const opponent = isHomeGame ? row.away_team : row.home_team;
      
      return {
        id: row.id,
        date: row.date.toISOString().split('T')[0],
        home_team: row.home_team,
        away_team: row.away_team,
        stadium: row.stadium || '미정',
        game_time: row.game_time || '18:30:00',
        status: validateGameStatus(row.status),
        created_at: row.created_at.toISOString(),
        opponent,
        is_home_game: isHomeGame,
        team_role: isHomeGame ? 'home' : 'away'
      };
    });

    const totalGames = games.length;
    const homeGames = games.filter(game => game.is_home_game).length;
    const awayGames = totalGames - homeGames;
    
    const statusStats: StatusBreakdown = games.reduce((acc, game) => {
      acc[game.status] = (acc[game.status] || 0) + 1;
      return acc;
    }, {} as StatusBreakdown);

    const responseData: TeamScheduleResponse['data'] = {
      team_id: dbTeamId,
      ui_team_id: teamId,
      query_date: date || null,
      total_games: totalGames,
      home_games: homeGames,
      away_games: awayGames,
      status_breakdown: statusStats,
      games: games
    };

    if (groupByDate) {
      const gamesByDate: GamesByDate = {};
      games.forEach(game => {
        const dateKey = game.date;
        if (!gamesByDate[dateKey]) {
          gamesByDate[dateKey] = [];
        }
        gamesByDate[dateKey].push(game);
      });
      responseData.games_by_date = gamesByDate;
    }

    return NextResponse.json<TeamScheduleResponse>({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error(`❌ 팀 일정 조회 실패 (${teamId}):`, error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: '팀 일정 조회 실패',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function isValidDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate.toISOString().split('T')[0] === date;
}

function validateGameStatus(status: string): GameStatus {
  const validStatuses: GameStatus[] = ['scheduled', 'completed', 'postponed', 'cancelled'];
  return validStatuses.includes(status as GameStatus) ? (status as GameStatus) : 'scheduled';
}