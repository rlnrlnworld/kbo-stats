/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  try {
    console.log(`=== 차트용 순위 데이터 조회: ${days}일 ===`);

    let query;
    
    if (startDate && endDate) {
      query = sql`
        SELECT 
          date,
          team_id,
          team_name,
          rank,
          wins,
          losses,
          ties,
          win_rate,
          games_back
        FROM daily_team_rankings 
        WHERE date >= ${startDate}::date 
          AND date <= ${endDate}::date
        ORDER BY date ASC, rank ASC;
      `;
    } else {
      query = sql`
        SELECT 
          date,
          team_id,
          team_name,
          rank,
          wins,
          losses,
          ties,
          win_rate,
          games_back
        FROM daily_team_rankings 
        WHERE date >= (
          SELECT MAX(date) - INTERVAL '1 day' * ${days}
          FROM daily_team_rankings
        )
        ORDER BY date ASC, rank ASC;
      `;
    }

    const result = await query;
    
    const chartData = transformForChart(result.rows);
    
    return NextResponse.json({
      success: true,
      chartData: chartData,
      rawData: result.rows,
      period: {
        days: days,
        startDate: startDate || null,
        endDate: endDate || null,
        actualStart: result.rows[0]?.date || null,
        actualEnd: result.rows[result.rows.length - 1]?.date || null
      },
      summary: {
        totalRecords: result.rows.length,
        uniqueDates: [...new Set(result.rows.map(r => r.date))].length,
        uniqueTeams: [...new Set(result.rows.map(r => r.team_name))].length
      }
    });

  } catch (error) {
    console.error('❌ 차트 데이터 조회 실패:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '차트 데이터 조회 실패',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

function transformForChart(rankingData: any[]) {
  
  const grouped = rankingData.reduce((acc, row) => {
    const dateKey = row.date;
    
    if (!acc[dateKey]) {
      const dateObj = new Date(row.date);
      acc[dateKey] = {
        date: dateKey,
        displayDate: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        fullDate: dateObj.toLocaleDateString('ko-KR', { 
          month: 'long', 
          day: 'numeric',
          weekday: 'short'
        })
      };
    }
    
    const teamName = row.team_name;
    
    acc[dateKey][teamName] = row.rank;
    
    acc[dateKey][`${teamName}_wins`] = row.wins;
    acc[dateKey][`${teamName}_losses`] = row.losses;
    acc[dateKey][`${teamName}_ties`] = row.ties;
    acc[dateKey][`${teamName}_winRate`] = row.win_rate;
    acc[dateKey][`${teamName}_gamesBack`] = row.games_back;
    acc[dateKey][`${teamName}_record`] = `${row.wins}승 ${row.losses}패 ${row.ties}무`;
    
    return acc;
  }, {} as any);

  const chartData = Object.values(grouped).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return chartData;
}