export type GameStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled'
export interface GameSchedule {
  id: number
  date: string 
  home_team: string
  away_team: string
  stadium: string
  game_time: string
  status: GameStatus
  
  home_score?: number | null
  away_score?: number | null
  winner?: string | null 
  
  innings?: number
  attendance?: number | null
  weather?: string | null
  game_duration?: string | null 
  
  created_at: string 
  updated_at?: string
}

export interface CompletedGame extends GameSchedule {
  status: 'completed'
  home_score: number
  away_score: number
  winner: string | null
}

export interface ScheduledGame extends GameSchedule {
  status: 'scheduled'
  home_score: null
  away_score: null
  winner: null
}

export interface GamesByDate {
  [dateKey: string]: GameSchedule[]
}

export interface GameScheduleResponse {
  success: true
  data: GameSchedule[]
  total: number
}

export interface SingleGameResponse {
  success: true
  data: GameSchedule
}

export interface GameErrorResponse {
  success: false
  error: string
  details?: string
}

export interface GameScoreUpdate {
  home_score: number
  away_score: number
  winner?: string | null
  innings?: number
  attendance?: number
  weather?: string
  game_duration?: string
}

export interface GameStats {
  total_games: number
  completed_games: number
  scheduled_games: number
  postponed_games: number
  cancelled_games: number
}

export interface TeamGameRecord {
  team_id: string
  total_games: number
  wins: number
  losses: number
  ties: number
  win_rate: number
  home_wins: number
  away_wins: number
  recent_games: GameSchedule[]
}