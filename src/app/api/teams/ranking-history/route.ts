import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '30';
  
  try {
    // 날짜 계산
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const response = await axios.post(
      'https://www.koreabaseball.com/ws/Record.asmx/GetTeamRankDaily',
      {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx'
        }
      }
    );

    console.log('차트 데이터:', response.data);
    return NextResponse.json(response.data);
    
  } catch (error) {
    console.error('차트 데이터 크롤링 에러:', error);
    
    if (axios.isAxiosError(error)) {
      console.log('응답 상태:', error.response?.status);
      console.log('응답 데이터:', error.response?.data);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch ranking history' }, 
      { status: 500 }
    );
  }
}