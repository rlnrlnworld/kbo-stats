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
  ui_team_id: string
  recent_form: string[]
  current_streak: {
    type: 'W' | 'L'
    count: number
  }
}

export interface BattingStats {
  teamId: string
  teamName: string
  avg: number        // 타율
  gp: number         // 경기수 (GP)
  ab: number         // 타수 (AB)
  r: number          // 득점 (R)
  h: number          // 안타 (H)
  doubles: number    // 2루타 (2B)
  triples: number    // 3루타 (3B)
  hr: number         // 홈런 (HR)
  tb: number         // 루타 (TB)
  rbi: number        // 타점 (RBI)
  sac: number        // 희생번트 (SAC)
  sf: number         // 희생플라이 (SF)
}

export interface PitchingStats {
  teamId: string
  teamName: string
  era: number        // 평균자책점
  g: number          // 경기수
  w: number          // 승
  l: number          // 패
  sv: number         // 세이브
  hld: number        // 홀드
  wpct: number       // 승률
  ip: number         // 이닝 (소수점 처리)
  h: number          // 피안타
  hr: number         // 피홈런
  bb: number         // 볼넷
  hbp: number        // 몸에 맞는 볼
  so: number         // 탈삼진
  r: number          // 실점
  er: number         // 자책점
  whip: number       // WHIP
}

export interface DefenseStats {
  teamId: string
  teamName: string
  g: number          // 경기수
  e: number          // 실책
  pk: number         // 견제사 (PKO)
  po: number         // 풋아웃
  a: number          // 어시스트
  dp: number         // 병살
  fpct: number       // 수비율
  pb: number         // 포일
  sb: number         // 도루허용
  cs: number         // 도루저지
  csPct: number      // 도루저지율
}

export interface BaserunningStats {
  teamId: string
  teamName: string
  g: number          // 경기수
  sba: number        // 도루시도
  sb: number         // 도루성공
  cs: number         // 도루실패
  sbPct: number      // 도루성공률
  oob: number        // 주루사 (OOB - Out On Base)
  pko: number        // 견제사 (PKO)
}

export const TEAM_MAPPING: { [key: string]: string } = {
  'LG': 'LG',
  'KIA': 'KIA', 
  'SSG': 'SSG',
  '두산': 'DU',
  'KT': 'KT',
  '롯데': 'LT',
  '삼성': 'SS',
  'NC': 'NC',
  '한화': 'HH',
  '키움': 'KW'
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