export interface Team {
  id: string
  name: string
  shortName: string
  color: string
  wins: number
  losses: number
  winRate: number
  rank: number
  gamesBack: number
}

export const TEAM_IDS = [
  'kia', 'samsung', 'lg', 'kt', 'kiwoom', 
  'nc', 'lotte', 'ssg', 'doosan', 'hanwha'
] as const

export type TeamId = typeof TEAM_IDS[number]