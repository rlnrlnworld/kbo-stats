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

export interface Schedule {
  date: string
  games: Game[]
}

export interface GameSchedule {
  id: number;
  date: string;
  home_team: string;
  away_team: string;
  stadium: string;
  game_time: string;
  status: GameStatus;
  created_at: string;
}

export type GameStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled';

export interface GamesByDate {
  [dateKey: string]: GameSchedule[];
}