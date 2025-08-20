export interface BasePlayer {
  id: string
  name: string
  teamId: string
  position: string
  uniformNumber?: number
  birthDate?: string
}

export interface BattingStats {
  games: number
  atBats: number
  hits: number
  doubles: number
  triples: number
  homeRuns: number
  rbis: number
  battingAvg: number
  onBasePercentage: number
  sluggingPercentage: number
}

export interface PitchingStats {
  games: number
  wins: number
  losses: number
  saves: number
  innings: number
  hits: number
  runs: number
  earnedRuns: number
  era: number
  strikeouts: number
  walks: number
}

export interface Player extends BasePlayer {
  batting?: BattingStats
  pitching?: PitchingStats
}