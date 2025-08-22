// src/app/api/team-stats/[teamId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface BattingStats {
  team_id: string;
  team_name: string;
  avg: number;
  gp: number;
  ab: number;
  r: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  tb: number;
  rbi: number;
  sac: number;
  sf: number;
  updated_at: string;
}

interface PitchingStats {
  team_id: string;
  team_name: string;
  era: number;
  g: number;
  w: number;
  l: number;
  sv: number;
  hld: number;
  wpct: number;
  ip: number;
  h: number;
  hr: number;
  bb: number;
  hbp: number;
  so: number;
  r: number;
  er: number;
  whip: number;
  updated_at: string;
}

interface FieldingStats {
  team_id: string;
  team_name: string;
  g: number;
  e: number;
  pk: number;
  po: number;
  a: number;
  dp: number;
  fpct: number;
  pb: number;
  sb: number;
  cs: number;
  cs_pct: number;
  updated_at: string;
}

interface BaserunningStats {
  team_id: string;
  team_name: string;
  g: number;
  sba: number;
  sb: number;
  cs: number;
  sb_pct: number;
  ob: number;
  bp: number;
  ko: number;
  updated_at: string;
}

interface TeamStats {
  teamId: string;
  teamName: string;
  batting: BattingStats | null;
  pitching: PitchingStats | null;
  fielding: FieldingStats | null;
  baserunning: BaserunningStats | null;
  lastUpdated: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;

    if (!teamId) {
      return NextResponse.json(
        { error: '팀 ID가 필요합니다' },
        { status: 400 }
      );
    }

    console.log(`📊 팀 기록 조회 요청: ${teamId}`);

    const [battingResult, pitchingResult, fieldingResult, baserunningResult] = await Promise.allSettled([
      sql`SELECT * FROM batting_stats WHERE team_id = ${teamId}`,
      
      sql`SELECT * FROM pitching_stats WHERE team_id = ${teamId}`,
      
      sql`SELECT * FROM fielding_stats WHERE team_id = ${teamId}`,
      
      sql`SELECT * FROM baserunning_stats WHERE team_id = ${teamId}`
    ]);

    const batting = battingResult.status === 'fulfilled' && battingResult.value.rows.length > 0
      ? battingResult.value.rows[0] as BattingStats
      : null;

    const pitching = pitchingResult.status === 'fulfilled' && pitchingResult.value.rows.length > 0
      ? pitchingResult.value.rows[0] as PitchingStats
      : null;

    const fielding = fieldingResult.status === 'fulfilled' && fieldingResult.value.rows.length > 0
      ? fieldingResult.value.rows[0] as FieldingStats
      : null;

    const baserunning = baserunningResult.status === 'fulfilled' && baserunningResult.value.rows.length > 0
      ? baserunningResult.value.rows[0] as BaserunningStats
      : null;

    const teamName = batting?.team_name || pitching?.team_name || fielding?.team_name || baserunning?.team_name || teamId;

    const updateTimes = [
      batting?.updated_at,
      pitching?.updated_at,
      fielding?.updated_at,
      baserunning?.updated_at
    ].filter(Boolean);

    const lastUpdated = updateTimes.length > 0 
      ? new Date(Math.max(...updateTimes.map(time => new Date(time!).getTime()))).toISOString()
      : new Date().toISOString();

    const teamStats: TeamStats = {
      teamId,
      teamName,
      batting,
      pitching,
      fielding,
      baserunning,
      lastUpdated
    };

    if (!batting && !pitching && !fielding && !baserunning) {
      return NextResponse.json(
        { 
          error: '해당 팀의 기록을 찾을 수 없습니다',
          teamId 
        },
        { status: 404 }
      );
    }

    console.log(`✅ 팀 기록 조회 완료: ${teamName} (${teamId})`);

    return NextResponse.json({
      success: true,
      data: teamStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 팀 기록 조회 실패:', error);
    
    return NextResponse.json(
      {
        error: '팀 기록 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}