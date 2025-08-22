import useSWR from 'swr';
import type { GameSchedule, GameStatus } from '@/types/game';

interface NextGameData extends GameSchedule {
  opponent: string;
  is_home_game: boolean;
  team_role: 'home' | 'away';
}

interface NextGameResponse {
  success: boolean;
  data: {
    team_id: string;
    ui_team_id: string;
    next_game: NextGameData | null;
    days_until_game: number | null;
    total_upcoming_games: number;
  };
}

interface NextGameError {
  success: false;
  error: string;
  details?: string;
}

const fetcher = async (url: string): Promise<NextGameResponse> => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorData: NextGameError = await res.json();
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export function useNextGame(teamId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<NextGameResponse>(
    teamId ? `/api/schedule/team/${teamId}/next` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      errorRetryInterval: 5000,
      errorRetryCount: 3,
    }
  );

  const nextGame = data?.success ? data.data.next_game : null;

  return {
    nextGame,
    hasNextGame: !!nextGame,
    
    opponent: nextGame?.opponent || null,
    isHomeGame: nextGame?.is_home_game || false,
    gameDate: nextGame?.date || null,
    gameTime: nextGame?.game_time || null,
    stadium: nextGame?.stadium || null,
    
    daysUntilGame: data?.success ? data.data.days_until_game : null,
    totalUpcomingGames: data?.success ? data.data.total_upcoming_games : 0,
    
    isLoading,
    isError: !!error,
    error: error?.message || null,
    
    mutate,
    refresh: () => mutate(),
  };
}