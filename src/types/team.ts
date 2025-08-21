export interface Team {
  id: string
  name: string
  shortName: string
  color: string
  wins: number
  ties: number
  losses: number
  winRate: number
  rank: number
  gamesBack: number
}

export interface TeamStats {
  teamId: string
  runsScored: number
  runsAllowed: number
  homeRecord: string
  awayRecord: string
}
export interface TeamRankHistory {
  teamId: string
  date: string
  rank: number
  wins: number
  losses: number
  winRate: number
}

export interface TeamData {
  date: string
  team_id: string
  team_name: string
  rank: number
  wins: number
  losses: number
  ties: number
  win_rate: number
  games_back: number
  created_at: string
  total_games: number
  win_percentage: string
  record_text: string
  rank_suffix: string
}

export interface RankingChart {
  teams: TeamRankHistory[]
  dateRange: {
    start: string
    end: string
  }
}

export const TEAM_IDS = [
  'kia', 'samsung', 'lg', 'kt', 'kiwoom', 
  'nc', 'lotte', 'ssg', 'doosan', 'hanwha'
] as const

export const TEAM_NAME_TO_ID: Record<string, string> = {
  'KIA': 'kia',
  'KIA 타이거즈': 'kia',
  '삼성': 'samsung', 
  '삼성 라이온즈': 'samsung',
  'LG': 'lg',
  'LG 트윈스': 'lg',
  '키움': 'kiwoom',
  '키움 히어로즈': 'kiwoom',
  'NC': 'nc',
  'NC 다이노스': 'nc',
  'KT': 'kt',
  'KT 위즈': 'kt',
  'SSG': 'ssg',
  'SSG 랜더스': 'ssg',
  '롯데': 'lotte',
  '롯데 자이언츠': 'lotte',
  '두산': 'doosan',
  '두산 베어스': 'doosan',
  '한화': 'hanwha',
  '한화 이글스': 'hanwha',
}

export const TEAM_COLORS: Record<string, string> = {
  kia: 'bg-team-kia',
  samsung: 'bg-team-samsung',
  lg: 'bg-team-lg',
  kt: 'bg-team-kt',
  kiwoom: 'bg-team-kiwoom',
  nc: 'bg-team-nc',
  lotte: 'bg-team-lotte',
  ssg: 'bg-team-ssg',
  doosan: 'bg-team-doosan',
  hanwha: 'bg-team-hanwha',
}

export const getTeamId = (teamName: string): string => {
  return TEAM_NAME_TO_ID[teamName] || teamName.toLowerCase()
}

export const getTeamColorClass = (teamId: string): string => {
  return TEAM_COLORS[teamId] || 'bg-gray-500'
}

export const getTeamHoverClass = (teamId: string): string => {
  return `team-hover-${teamId}`
}

export type TeamId = typeof TEAM_IDS[number]