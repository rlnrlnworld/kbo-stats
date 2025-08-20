import useSWR from 'swr';
import { Team } from '@/types/team';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
};

export function useTeams() {
  const { 
    data: teams, 
    error, 
    isLoading: loading, 
    mutate
  } = useSWR<Team[]>('/api/teams/standings', fetcher, {
    refreshInterval: 15 * 60 * 60 * 1000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });

  return { 
    teams: teams || [], 
    loading, 
    error: error?.message || null, 
    mutate 
  };
}