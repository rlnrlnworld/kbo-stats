import { useTeamData } from '@/hooks/useTeamData'
import { TEAM_COLORS } from '@/types/team'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'

const TEAM_NAMES: Record<string, string> = {
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

type Props = {
  teamId: string
  onClose: () => void
}

export default function TeamModal({ teamId, onClose }: Props) {
  const color = TEAM_COLORS[teamId] || 'bg-gradient-to-br from-gray-600 to-gray-700'
  const { team, isLoading, error } = useTeamData(teamId)
  const teamName = TEAM_NAMES[teamId] || teamId

  useEffect(() => {
    console.log(team)
  }, [team])

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-white/20">
        <div className={`${color} px-8 pt-10 pb-24 relative overflow-hidden`}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2.5 rounded-full hover:bg-white/15 transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            <X strokeWidth={1.5} size={18} />
          </button>
          
          <div className="text-center text-white mb-6 relative z-10">
            <h2 className="text-2xl font-light tracking-wide mb-3 drop-shadow-sm">
              {teamName}
            </h2>
            {!isLoading && team && (
              <div className="text-5xl font-extralight tracking-wider opacity-95 drop-shadow-md">
                현재 {team.rank}위
              </div>
            )}
          </div>

          <div className="absolute w-full grid grid-cols-3 items-end justify-between left-0 bottom-0 transform translate-y-1/2 px-8">
            <div className="flex flex-col items-center backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
              <div className="text-2xl font-light text-white mb-1">
                {team?.win_rate }
              </div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-medium">
                승률
              </div>
            </div>
            
            <div className="w-32 h-32 mx-auto bg-white/95 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center border-4 border-white/50 relative">
              <div className="absolute inset-2 bg-gradient-to-br from-white to-gray-50 rounded-full"></div>
              <div className="relative z-10">
                <Image
                  src={`/team-logos/${teamId}.svg`}
                  alt={`${teamName} 로고`}
                  width={80}
                  height={80}
                  priority
                  className="relative z-20"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            
            <div className="flex flex-col items-center backdrop-blur-md bg-white/10 rounded-2xl p-4 border border-white/20">
              <div className="text-2xl font-light text-white mb-1">
                {team?.games_back === 0 ? '-' : team?.games_back || '-'}
              </div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-medium">
                게임차
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-8 pt-20 pb-8 bg-gradient-to-b from-white to-gray-50/50">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
                  <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
                </div>
                <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                데이터를 불러올 수 없습니다
              </div>
              <div className="text-sm text-gray-500">{error}</div>
            </div>
          ) : team ? (
            <div>
              <div className="text-center mb-8">
                <div className="text-xl font-light text-gray-800 mb-3 tracking-wide">
                  {team.wins}승 {team.losses}패 {team.ties}무
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {new Date().getFullYear()} 정규시즌 기록
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent h-px top-6"></div>
                <div className="relative bg-white px-6 pt-8 text-center">
                  <div className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                    최종 업데이트
                  </div>
                  <div className="text-sm text-gray-600 font-light">
                    {new Date(team.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}