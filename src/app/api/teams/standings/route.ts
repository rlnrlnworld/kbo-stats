import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Team, getTeamId, getTeamColorClass } from '@/types/team';

export async function GET() {
  try {
    const response = await axios.get('https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const teams: Team[] = [];

    $('.tData tbody tr').each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length >= 8) { 
        const rank = parseInt(cells.eq(0).text().trim());
        const teamName = cells.eq(1).text().trim();
        const wins = parseInt(cells.eq(3).text().trim());
        const losses = parseInt(cells.eq(4).text().trim());
        const ties = parseInt(cells.eq(5).text().trim());
        const winRate = parseFloat(cells.eq(6).text().trim());
        const gamesBack = parseFloat(cells.eq(7).text().trim());
        
        if (teamName && !isNaN(rank) && !isNaN(wins) && !isNaN(losses)) {
          const teamId = getTeamId(teamName);
          
          const team: Team = {
            id: teamId,
            name: teamName,
            shortName: teamName,
            color: getTeamColorClass(teamId),
            rank,
            wins,
            losses,
            ties: ties || 0,
            winRate,
            gamesBack: gamesBack || 0,
          };
          
          teams.push(team);
        }
      }
    });

    teams.sort((a, b) => a.rank - b.rank);

    console.log('파싱된 팀 데이터:', teams);

    return NextResponse.json(teams);
    
  } catch (error) {
    console.error('크롤링 에러:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team standings' }, 
      { status: 500 }
    );
  }
}