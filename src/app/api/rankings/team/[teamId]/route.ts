// src/app/api/rankings/team/[teamId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  try {
    console.log(`=== 팀 현재 데이터 조회: ${teamId} ===`);

    const result = await sql`
      SELECT 
        date,
        team_id,
        team_name,
        rank,
        wins,
        losses,
        ties,
        win_rate,
        games_back,
        created_at
      FROM daily_team_rankings 
      WHERE team_id = ${teamId}
        AND date = (
          SELECT MAX(date) 
          FROM daily_team_rankings 
          WHERE team_id = ${teamId}
        );
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: `${teamId} 팀의 데이터를 찾을 수 없습니다.`
      }, { status: 404 });
    }

    const teamData = result.rows[0];
    
    const totalGames = teamData.wins + teamData.losses + teamData.ties;
    const winPercentage = totalGames > 0 ? (teamData.wins / totalGames * 100).toFixed(1) : '0.0';

    console.log(`✅ ${teamId} 팀 데이터 조회 완료: ${teamData.rank}위`);

    return NextResponse.json({
      success: true,
      team: {
        ...teamData,
        total_games: totalGames,
        win_percentage: winPercentage,
        record_text: `${teamData.wins}승 ${teamData.losses}패 ${teamData.ties}무`,
        rank_suffix: getRankSuffix(teamData.rank),
      }
    });

  } catch (error) {
    console.error(`❌ ${teamId} 팀 데이터 조회 실패:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: '팀 데이터 조회 실패',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

function getRankSuffix(rank: number): string {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';  
  if (rank === 3) return '3rd';
  return `${rank}th`;
}