import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useRankingHistory(days: number = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/teams/ranking-history?days=${days}`,
    fetcher,
    {
      refreshInterval: 24 * 60 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  return { 
    rankingHistory: data || [], 
    loading: isLoading, 
    error: error?.message || null, 
    mutate 
  };
}