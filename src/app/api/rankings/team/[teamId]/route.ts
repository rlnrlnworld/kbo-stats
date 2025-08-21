import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const TEAM_ID_MAPPING: Record<string, string> = {
  kia: 'KIA',
  samsung: 'SS', 
  lg: 'LG',
  kt: 'KT',
  kiwoom: 'KW',
  nc: 'NC',
  lotte: 'LT',
  ssg: 'SSG',
  doosan: 'DU',
  hanwha: 'HH',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const dbTeamId = TEAM_ID_MAPPING[teamId.toLowerCase()];

  try {
    console.log(`=== 팀 현재 데이터 조회: ${teamId} -> ${dbTeamId} ===`);

    if (!dbTeamId) {
      return NextResponse.json({
        success: false,
        error: `지원하지 않는 팀 ID입니다: ${teamId}`
      }, { status: 400 });
    }

    const currentDataResult = await sql`
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
      WHERE team_id = ${dbTeamId}
        AND date = (
          SELECT MAX(date) 
          FROM daily_team_rankings 
          WHERE team_id = ${dbTeamId}
        );
    `;

    if (currentDataResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: `${teamId} 팀의 데이터를 찾을 수 없습니다. (DB ID: ${dbTeamId})`
      }, { status: 404 });
    }

    const teamData = currentDataResult.rows[0];
    
    const recentDataResult = await sql`
      SELECT 
        date,
        wins,
        losses,
        ties,
        rank
      FROM daily_team_rankings 
      WHERE team_id = ${dbTeamId}
      ORDER BY date DESC 
      LIMIT 6;
    `;

    let recentForm: string[] = [];
    // eslint-disable-next-line prefer-const
    let streak = { type: 'W', count: 0 };

    if (recentDataResult.rows.length >= 2) {
      const recentData = recentDataResult.rows.reverse();
      
      for (let i = 1; i < Math.min(6, recentData.length); i++) {
        const prev = recentData[i - 1];
        const curr = recentData[i];
        
        const winsChanged = curr.wins - prev.wins;
        const lossesChanged = curr.losses - prev.losses;
        
        if (winsChanged > 0) {
          recentForm.push('W');
        } else if (lossesChanged > 0) {
          recentForm.push('L');
        } else {
          recentForm.push('T');
        }
      }
      
      if (recentForm.length > 0) {
        const lastResult = recentForm[recentForm.length - 1];
        streak.type = lastResult as 'W' | 'L';
        streak.count = 1;
        
        for (let i = recentForm.length - 2; i >= 0; i--) {
          if (recentForm[i] === lastResult) {
            streak.count++;
          } else {
            break;
          }
        }
      }
      
      recentForm = recentForm.slice(-5);
    }

    const totalGames = teamData.wins + teamData.losses + teamData.ties;
    const winPercentage = totalGames > 0 ? (teamData.wins / totalGames * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      team: {
        ...teamData,
        ui_team_id: teamId,
        total_games: totalGames,
        win_percentage: winPercentage,
        record_text: `${teamData.wins}승 ${teamData.losses}패 ${teamData.ties}무`,
        rank_suffix: getRankSuffix(teamData.rank),
        
        recent_form: recentForm,
        current_streak: streak
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