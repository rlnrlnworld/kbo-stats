import { NextResponse } from 'next/server';

interface ApiResult {
  success: boolean;
  message: string;
  scrapedTeams?: number;
  savedTeams?: number;
  timestamp: string;
  error?: string;
  details?: string;
}

interface IntegratedResult {
  batting: ApiResult;
  pitching: ApiResult;
  fielding: ApiResult;
  baserunning: ApiResult;
}


async function executeBattingCron(): Promise<ApiResult> {
  try {
    console.log('🔄 타자 기록 크롤링 시작...');
    
    const { POST } = await import('../daily-batting-stats/route');
    const response = await POST();
    const result = await response.json();
    
    console.log('✅ 타자 기록 크롤링 완료');
    return result;
    
  } catch (error) {
    console.error('❌ 타자 기록 크롤링 실패:', error);
    return {
      success: false,
      message: '타자 기록 크롤링 실패',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

async function executePitchingCron(): Promise<ApiResult> {
  try {
    console.log('🔄 투수 기록 크롤링 시작...');
    
    const { POST } = await import('../daily-pitching-stats/route');
    const response = await POST();
    const result = await response.json();
    
    console.log('✅ 투수 기록 크롤링 완료');
    return result;
    
  } catch (error) {
    console.error('❌ 투수 기록 크롤링 실패:', error);
    return {
      success: false,
      message: '투수 기록 크롤링 실패',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

async function executeFieldingCron(): Promise<ApiResult> {
  try {
    console.log('🔄 수비 기록 크롤링 시작...');
    
    const { POST } = await import('../daily-defense-stats/route');
    const response = await POST();
    const result = await response.json();
    
    console.log('✅ 수비 기록 크롤링 완료');
    return result;
    
  } catch (error) {
    console.error('❌ 수비 기록 크롤링 실패:', error);
    return {
      success: false,
      message: '수비 기록 크롤링 실패',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

async function executeBaserunningCron(): Promise<ApiResult> {
  try {
    console.log('🔄 주루 기록 크롤링 시작...');
    
    const { POST } = await import('../daily-baserunning-stats/route');
    const response = await POST();
    const result = await response.json();
    
    console.log('✅ 주루 기록 크롤링 완료');
    return result;
    
  } catch (error) {
    console.error('❌ 주루 기록 크롤링 실패:', error);
    return {
      success: false,
      message: '주루 기록 크롤링 실패',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

export async function POST() {
  try {
    console.log('🚀 === 통합 KBO 팀 기록 크롤링 크론잡 시작 ===');
    console.log('⏰ 시간:', new Date().toISOString());

    const startTime = Date.now();

    const results: IntegratedResult = {
      batting: await executeBattingCron(),
      pitching: await executePitchingCron(),  
      fielding: await executeFieldingCron(),
      baserunning: await executeBaserunningCron()
    };

    const endTime = Date.now();
    const executionTime = Math.round((endTime - startTime) / 1000);

    const totalSuccess = Object.values(results).filter(r => r.success).length;
    const totalFailed = Object.values(results).filter(r => !r.success).length;
    const totalScraped = Object.values(results).reduce((sum, r) => sum + (r.scrapedTeams || 0), 0);
    const totalSaved = Object.values(results).reduce((sum, r) => sum + (r.savedTeams || 0), 0);

    const successfulApis = Object.entries(results)
      .filter(([_, result]) => result.success)
      .map(([key, _]) => key);
    
    const failedApis = Object.entries(results)
      .filter(([_, result]) => !result.success)
      .map(([key, result]) => ({ api: key, error: result.error }));

    console.log('📊 === 통합 크롤링 결과 집계 ===');
    console.log(`✅ 성공: ${totalSuccess}/4개 API`);
    console.log(`❌ 실패: ${totalFailed}/4개 API`);
    console.log(`📈 총 크롤링: ${totalScraped}개 팀 데이터`);
    console.log(`💾 총 저장: ${totalSaved}개 레코드`);
    console.log(`⏱️ 실행 시간: ${executionTime}초`);
    
    if (successfulApis.length > 0) {
      console.log(`🎉 성공한 API: ${successfulApis.join(', ')}`);
    }
    
    if (failedApis.length > 0) {
      console.log(`⚠️ 실패한 API:`);
      failedApis.forEach(({ api, error }) => {
        console.log(`   - ${api}: ${error}`);
      });
    }

    console.log('🏁 === 통합 팀 기록 크론잡 완료 ===');

    const overallSuccess = totalSuccess > 0;

    return NextResponse.json({
      success: overallSuccess,
      message: totalFailed === 0 
        ? '모든 팀 기록 크롤링 완료' 
        : `부분 성공: ${totalSuccess}개 성공, ${totalFailed}개 실패`,
      summary: {
        totalApis: 4,
        successfulApis: totalSuccess,
        failedApis: totalFailed,
        totalScrapedTeams: totalScraped,
        totalSavedRecords: totalSaved,
        executionTimeSeconds: executionTime
      },
      results,
      successful: successfulApis,
      failed: failedApis,
      timestamp: new Date().toISOString()
    }, { 
      status: overallSuccess ? 200 : 207
    });

  } catch (error) {
    console.error('❌ 통합 크론잡 실행 중 치명적 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: '통합 크롤링 실행 실패',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('🧪 수동 통합 팀 기록 크롤링 테스트 실행');
  return POST();
}