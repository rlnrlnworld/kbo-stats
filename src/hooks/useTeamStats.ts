import useSWR from 'swr';

interface BattingStats {
  team_id: string;
  team_name: string;
  avg: number;
  gp: number;
  ab: number;
  r: number;
  h: number;
  doubles: number;
  triples: number;
  hr: number;
  tb: number;
  rbi: number;
  sac: number;
  sf: number;
  updated_at: string;
}

interface PitchingStats {
  team_id: string;
  team_name: string;
  era: number;
  g: number;
  w: number;
  l: number;
  sv: number;
  hld: number;
  wpct: number;
  ip: number;
  h: number;
  hr: number;
  bb: number;
  hbp: number;
  so: number;
  r: number;
  er: number;
  whip: number;
  updated_at: string;
}

interface FieldingStats {
  team_id: string;
  team_name: string;
  g: number;
  e: number;
  pk: number;
  po: number;
  a: number;
  dp: number;
  fpct: number;
  pb: number;
  sb: number;
  cs: number;
  cs_pct: number;
  updated_at: string;
}

interface BaserunningStats {
  team_id: string;
  team_name: string;
  g: number;
  sba: number;
  sb: number;
  cs: number;
  sb_pct: number;
  ob: number;
  bp: number;
  ko: number;
  updated_at: string;
}

interface TeamStats {
  teamId: string;
  teamName: string;
  batting: BattingStats | null;
  pitching: PitchingStats | null;
  fielding: FieldingStats | null;
  baserunning: BaserunningStats | null;
  lastUpdated: string;
}

interface TeamStatsResponse {
  success: boolean;
  data: TeamStats;
  timestamp: string;
}

interface TeamStatsError {
  error: string;
  teamId?: string;
  details?: string;
}

const fetcher = async (url: string): Promise<TeamStatsResponse> => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorData: TeamStatsError = await res.json();
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }
  
  return res.json();
};

export function useTeamStats(teamId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    teamId ? `/api/team-stats/${teamId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      errorRetryInterval: 5000,
      errorRetryCount: 3,
    }
  );

  return {
    teamStats: data?.data || null,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
    
    battingStats: data?.data?.batting || null,
    pitchingStats: data?.data?.pitching || null,
    fieldingStats: data?.data?.fielding || null,
    baserunningStats: data?.data?.baserunning || null,
    teamName: data?.data?.teamName || teamId,
    lastUpdated: data?.data?.lastUpdated || null,
  };
}

export function hasBattingStats(teamStats: TeamStats | null): teamStats is TeamStats & { batting: BattingStats } {
  return teamStats?.batting !== null;
}

export function hasPitchingStats(teamStats: TeamStats | null): teamStats is TeamStats & { pitching: PitchingStats } {
  return teamStats?.pitching !== null;
}

export function hasFieldingStats(teamStats: TeamStats | null): teamStats is TeamStats & { fielding: FieldingStats } {
  return teamStats?.fielding !== null;
}

export function hasBaserunningStats(teamStats: TeamStats | null): teamStats is TeamStats & { baserunning: BaserunningStats } {
  return teamStats?.baserunning !== null;
}

export const TEAM_IDS = {
  LG: 'LG',
  KIA: 'KIA',
  SSG: 'SSG',
  DOOSAN: 'DU',
  KT: 'KT',
  LOTTE: 'LT',
  SAMSUNG: 'SS',
  NC: 'NC',
  HANWHA: 'HH',
  KIWOOM: 'KW'
} as const;

export type TeamId = typeof TEAM_IDS[keyof typeof TEAM_IDS];