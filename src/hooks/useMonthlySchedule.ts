import useSWR from 'swr'
import { GamesByDate, GameSchedule } from '@/types/game'

interface MonthlyScheduleData {
  year: number
  month: number
  total_games: number
  dates_with_games: number
  games_by_date: GamesByDate
  raw_games: GameSchedule[]
}

interface MonthlyScheduleResponse {
  success: true
  data: MonthlyScheduleData
}

interface ErrorResponse {
  success: false
  error: string
  details?: string
}

type ApiResponse = MonthlyScheduleResponse | ErrorResponse

interface UseMonthlyScheduleOptions {
  year: number
  month: number
  refreshInterval?: number
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
}

interface UseMonthlyScheduleReturn {
  scheduleData: MonthlyScheduleData | null
  gamesByDate: GamesByDate
  rawGames: GameSchedule[]
  
  totalGames: number
  datesWithGames: number
  
  isLoading: boolean
  isError: boolean
  error: Error | null
  
  hasGamesOnDate: (date: string) => boolean
  getGamesOnDate: (date: string) => GameSchedule[]
  getGameCount: (date: string) => number
  
  mutate: () => Promise<ApiResponse | undefined>
  isValidating: boolean
}

const fetcher = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

export function useMonthlySchedule({
  year,
  month,
  refreshInterval = 0,
  revalidateOnFocus = true,
  revalidateOnReconnect = true
}: UseMonthlyScheduleOptions): UseMonthlyScheduleReturn {
  
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Month must be between 1 and 12.`)
  }
  
  if (year < 2020 || year > 2030) {
    throw new Error(`Invalid year: ${year}. Year must be between 2020 and 2030.`)
  }

  const apiUrl = `/api/schedule/month/${year}/${month}`
  
  const {
    data,
    error,
    mutate,
    isLoading,
    isValidating
  } = useSWR<ApiResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus,
      revalidateOnReconnect,
      revalidateOnMount: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error(`❌ 월별 일정 조회 실패 (${year}-${month}):`, error)
      },
      onSuccess: (data) => {
        if (data.success) {
          console.log(`✅ 월별 일정 조회 성공 (${year}-${month}):`, data.data.total_games, '경기')
        }
      }
    }
  )

  const scheduleData = data?.success ? data.data : null
  const gamesByDate = scheduleData?.games_by_date || {}
  const rawGames = scheduleData?.raw_games || []
  const totalGames = scheduleData?.total_games || 0
  const datesWithGames = scheduleData?.dates_with_games || 0
  const isError: boolean = !!error || (data !== undefined && !data.success)
  const errorMessage = error || (data && !data.success ? new Error(data.error) : null)

  const hasGamesOnDate = (date: string): boolean => {
    return !!gamesByDate[date] && gamesByDate[date].length > 0
  }

  const getGamesOnDate = (date: string): GameSchedule[] => {
    return gamesByDate[date] || []
  }

  const getGameCount = (date: string): number => {
    return gamesByDate[date]?.length || 0
  }

  return {
    scheduleData,
    gamesByDate,
    rawGames,
    
    totalGames,
    datesWithGames,
    
    isLoading,
    isError,
    error: errorMessage,
    
    hasGamesOnDate,
    getGamesOnDate,
    getGameCount,
    
    mutate,
    isValidating
  }
}

export function useCurrentMonthSchedule(
  options: Omit<UseMonthlyScheduleOptions, 'year' | 'month'> = {}
): UseMonthlyScheduleReturn {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  return useMonthlySchedule({
    year,
    month,
    ...options
  })
}
