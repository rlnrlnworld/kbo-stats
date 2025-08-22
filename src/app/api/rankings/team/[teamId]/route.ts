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
      LIMIT 30;
    `;

    let recentForm: string[] = [];
    let streak = { type: 'W' as 'W' | 'L', count: 0 };

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
        let lastGameResult = '';
        let streakCount = 0;
        
        for (let i = recentForm.length - 1; i >= 0; i--) {
          if (recentForm[i] !== 'T') {
            lastGameResult = recentForm[i];
            streakCount = 1;
            break;
          }
        }
        
        if (lastGameResult) {
          const allData = recentDataResult.rows.reverse();
          
          for (let i = allData.length - 2; i >= 0; i--) {
            const prev = allData[i];
            const curr = allData[i + 1];
            
            const winsChanged = curr.wins - prev.wins;
            const lossesChanged = curr.losses - prev.losses;
            const tiesChanged = curr.ties - prev.ties;
            
            // 무승부인 경우 연승/연패에 영향 없음
            if (tiesChanged > 0) {
              continue;
            }
            
            let gameResult = '';
            if (winsChanged > 0) {
              gameResult = 'W';
            } else if (lossesChanged > 0) {
              gameResult = 'L';
            }
            
            // 연승/연패가 끊어지면 중단
            if (gameResult !== lastGameResult) {
              break;
            }
            
            streakCount++;
          }
          
          streak = {
            type: lastGameResult as 'W' | 'L',
            count: streakCount
          };
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