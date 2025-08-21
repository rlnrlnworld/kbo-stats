import { useTeamData } from '@/hooks/useTeamData'
import { TEAM_COLORS } from '@/types/team'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'

const TEAM_NAMES : Record<string, string> = {
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
  const color = TEAM_COLORS[teamId]
  const { team, isLoading, error } = useTeamData(teamId)
  const teamName = TEAM_NAMES[teamId] || teamId

  useEffect(() => {
    console.log(team)
  }, [team])

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        <div className={`${color} px-8 pt-8 pb-20 relative`}>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200"
          >
            <X strokeWidth={1.5} size={20} />
          </button>
          
          <div className="text-center text-white mb-6">
            {!isLoading && team && (
              <div className="text-4xl tracking-wider opacity-90">
                현재 {team.rank}위
              </div>
            )}
            {!isLoading && team && (
              <div className="text-base font-normal mb-2">
                {team.wins}승 {team.losses}패 {team.ties}무
              </div>
            )}
          </div>

          <div className="absolute w-full grid grid-cols-3 items-center justify-between left-0 bottom-0 transform translate-y-1/2">
            <div className='flex flex-col gap-3 items-center'>
              <div className="text-2xl font-normal text-white">
                {team?.win_rate}
              </div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                승률
              </div>
            </div>
            <div className="w-30 h-30 mx-auto bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white">
              <Image
                src={`/team-logos/${teamId}.svg`}
                alt={`${teamName} 로고`}
                width={80}
                height={80}
                priority
              />
            </div>
            <div className='flex flex-col gap-3 items-center'>
              <div className="text-2xl font-normal text-white">
                {team?.games_back === 0 ? '-' : team?.games_back}
              </div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                게임차
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-8 pt-24 pb-8">
          {error ? (
            <div className="text-center py-8">
              <div className="text-neutral-400 mb-2">
                데이터를 불러올 수 없습니다
              </div>
              <div className="text-sm text-neutral-500">{error}</div>
            </div>
          ) : team ? (
            <div>
              <div className="text-center mb-8 text-neutral-800">
                {isLoading ? (
                  <div className='h-8 w-20 bg-neutral-200 animate-pulse rounded-md'></div>
                ): (
                  <h2 className="text-3xl tracking-wide mb-2">
                    {teamName}
                  </h2>
                )}
              </div>
  
              <div className="border-t border-neutral-100 pt-6">
                <div className="text-center">
                  <div className="text-xs text-neutral-400 mb-2">
                    업데이트
                  </div>
                  <div className="text-sm text-neutral-600">
                    {new Date(team.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
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