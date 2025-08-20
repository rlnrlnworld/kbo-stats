export interface Game {
  id: string
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: GameStatus
  inning?: number
  stadium?: string
}

export type GameStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'

export interface Schedule {
  date: string
  games: Game[]
}