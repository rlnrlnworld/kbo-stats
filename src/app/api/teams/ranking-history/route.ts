import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  console.log('=== API 호출 시작 ===');
  
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

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    console.log('=== 요청 준비 ===');
    console.log('요청 URL:', 'https://www.koreabaseball.com/ws/Record.asmx/GetTeamRankDaily');
    console.log('요청 데이터:', { startDate: startDateStr, endDate: endDateStr });

    // 먼저 단순한 GET 요청으로 테스트
    console.log('=== KBO 사이트 접근 테스트 ===');
    const testResponse = await axios.get('https://www.koreabaseball.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    console.log('KBO 메인 사이트 접근 성공:', testResponse.status);

    // 실제 API 호출
    console.log('=== 실제 API 호출 ===');
    const response = await axios.post(
      'https://www.koreabaseball.com/ws/Record.asmx/GetTeamRankDaily',
      `{"startDate":"${startDateStr}","endDate":"${endDateStr}"}`,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 15000
      }
    );

    console.log('=== API 응답 성공 ===');
    console.log('응답 상태:', response.status);
    console.log('응답 헤더:', response.headers);
    console.log('응답 데이터:', response.data);

    return NextResponse.json({
      success: true,
      rawData: response.data,
      requestParams: {
        startDate: startDateStr,
        endDate: endDateStr,
        days: parseInt(days)
      }
    });
    
  } catch (error) {
    console.error('=== 상세 에러 정보 ===');
    console.error('에러 타입:', error?.constructor?.name);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios 에러 상세:');
      console.error('- 상태 코드:', error.response?.status);
      console.error('- 상태 텍스트:', error.response?.statusText);
      console.error('- 응답 헤더:', error.response?.headers);
      console.error('- 응답 데이터:', error.response?.data);
      console.error('- 요청 URL:', error.config?.url);
      console.error('- 요청 메서드:', error.config?.method);
      console.error('- 요청 헤더:', error.config?.headers);
      console.error('- 요청 데이터:', error.config?.data);
      
      if (error.code) {
        console.error('- 에러 코드:', error.code);
      }
    } else {
      console.error('일반 에러:', error);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch ranking history',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name,
        ...(axios.isAxiosError(error) && {
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorCode: error.code
        })
      }, 
      { status: 500 }
    );
  }
}