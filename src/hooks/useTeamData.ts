import { TeamData } from '@/types/team'
import useSWR from 'swr'

interface TeamResponse {
  success: boolean
  team: TeamData
  error?: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTeamData(teamId: string) {
  const { data, error, isLoading, mutate } = useSWR<TeamResponse>(
    teamId ? `/api/rankings/team/${teamId}` : null,
    fetcher,
    {
      refreshInterval: 300000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  )

  return {
    team: data?.success ? data.team : null,
    isLoading,
    error: error || (data?.success === false ? data.error : null),
    mutate,
  }
}
