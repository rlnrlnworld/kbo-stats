/* eslint-disable @typescript-eslint/no-explicit-any */
import useSWR from 'swr';

export interface ChartDataPoint {
  date: string;
  displayDate: string;
  fullDate: string;
  [teamName: string]: any;
}

export interface ChartDataResponse {
  success: boolean;
  chartData: ChartDataPoint[];
  rawData: any[];
  period: {
    days: number;
    startDate: string | null;
    endDate: string | null;
    actualStart: string | null;
    actualEnd: string | null;
  };
  summary: {
    totalRecords: number;
    uniqueDates: number;
    uniqueTeams: number;
  };
}

const fetcher = (url: string) => 
  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`API 오류: ${res.status}`);
      }
      return res.json();
    });

export function useRankingHistory(days: number = 30, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  params.append('days', days.toString());
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const { data, error, isLoading, mutate } = useSWR<ChartDataResponse>(
    `/api/rankings/chart-data?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  return {
    rankingHistory: data?.chartData || [],
    rawData: data?.rawData || [],
    
    period: data?.period || { days, startDate: null, endDate: null, actualStart: null, actualEnd: null },
    summary: data?.summary || { totalRecords: 0, uniqueDates: 0, uniqueTeams: 0 },
    
    isLoading,
    error,
    
    refresh: mutate,
    
    hasData: (data?.chartData?.length || 0) > 0,
    dateRange: data?.period ? `${data.period.actualStart?.split("T")[0]} ~ ${data.period.actualEnd?.split("T")[0]}` : '',
  };
}

export function useRankingHistoryByPeriod(startDate: string, endDate: string) {
  return useRankingHistory(30, startDate, endDate);
}

export function useMonthlyRankings(year: number, month: number) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  return useRankingHistoryByPeriod(startDate, endDate);
}