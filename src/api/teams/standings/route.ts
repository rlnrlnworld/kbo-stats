import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Team, getTeamId, getTeamColorClass } from '@/types/team';

export async function GET() {
  try {
    const response = await axios.get('https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KBOStatsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const teams: Team[] = [];

    $('.tData tr').each((index, element) => {
      const $row = $(element);
      const teamName = $row.find('td').eq(1).text().trim();
      
      if (teamName) {
        const teamId = getTeamId(teamName);
        
        const team: Team = {
          id: teamId,
          name: teamName,
          shortName: teamName.split(' ')[0],
          color: getTeamColorClass(teamId),
          rank: index + 1,
          wins: parseInt($row.find('td').eq(2).text()) || 0,
          losses: parseInt($row.find('td').eq(3).text()) || 0,
          ties: parseInt($row.find('td').eq(4).text()) || 0,
          winRate: parseFloat($row.find('td').eq(5).text()) || 0,
          gamesBack: parseFloat($row.find('td').eq(6).text()) || 0,
        };
        
        teams.push(team);
      }
    });

    if (teams.length === 0) {
      return NextResponse.json(
        { error: 'No team data found' }, 
        { status: 404 }
      );
    }

    teams.sort((a, b) => a.rank - b.rank);

    return NextResponse.json(teams);
    
  } catch (error) {
    console.error('Crawling error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json(
          { error: 'Request timeout - KBO website took too long to respond' }, 
          { status: 408 }
        );
      }
      
      if (error.response?.status) {
        return NextResponse.json(
          { error: `KBO website returned ${error.response.status}` }, 
          { status: 502 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch team standings', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}