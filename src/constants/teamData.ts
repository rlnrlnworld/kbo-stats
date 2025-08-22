export const TEAM_NAMES: Record<string, string> = {
  kia: 'KIA 타이거즈',
  samsung: '삼성 라이온즈',
  lg: 'LG 트윈스',
  kt: 'KT 위즈',
  kiwoom: '키움 히어로즈',
  nc: 'NC 다이노스',
  lotte: '롯데 자이언츠',
  ssg: 'SSG 랜더스',
  doosan: '두산 베어스',
  hanwha: '한화 이글스',
}

export interface TeamInfo {
  location: string
  championships: number
  founded: number
}

export const TEAM_INFO: Record<string, TeamInfo> = {
  kia: { location: '광주', championships: 12, founded: 1982 },
  samsung: { location: '대구', championships: 8, founded: 1982 },
  lg: { location: '서울', championships: 3, founded: 1982 },
  kt: { location: '수원', championships: 1, founded: 2013 },
  kiwoom: { location: '서울', championships: 0, founded: 2008 },
  nc: { location: '창원', championships: 1, founded: 2011 },
  lotte: { location: '부산', championships: 2, founded: 1982 },
  ssg: { location: '인천', championships: 5, founded: 2000 },
  doosan: { location: '서울', championships: 6, founded: 1982 },
  hanwha: { location: '대전', championships: 1, founded: 1986 },
}

export const TEAM_ID_MAPPING: Record<string, string> = {
  kia: 'KIA',
  samsung: 'SS', 
  lg: 'LG',
  kt: 'KT',
  kiwoom: 'KW',
  nc: 'NC',
  lotte: 'LT',
  ssg: 'SSG',
  doosan: 'DU',
  hanwha: 'HH',
}

export const getTeamName = (teamId: string): string => {
  return TEAM_NAMES[teamId] || teamId
}

export const getTeamInfo = (teamId: string): TeamInfo | undefined => {
  return TEAM_INFO[teamId]
}

export const getDbTeamId = (teamId: string): string | undefined => {
  return TEAM_ID_MAPPING[teamId.toLowerCase()]
}