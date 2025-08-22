import { TEAM_INFO, TEAM_NAMES } from '@/constants/teamData'
import { useTeamData } from '@/hooks/useTeamData'
import { TEAM_COLORS } from '@/types/team'
import { X, MapPin, Trophy, Calendar, Clock, Target, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'

// 목업 추가 데이터 (실제로는 API에서 가져와야 함)
const getMockAdditionalData = (teamId: string) => ({
  nextGame: {
    date: '2024-10-20',
    opponent: teamId === 'kia' ? 'samsung' : 'kia',
    time: '14:00',
    isHome: Math.random() > 0.5
  },
  teamStats: {
    avg: 0.284,
    era: 4.12,
    homeRuns: 187
  },
})

type Props = {
  teamId: string
  onClose: () => void
}

export default function TeamModal({ teamId, onClose }: Props) {
  const color = TEAM_COLORS[teamId]
  const { team, isLoading, error } = useTeamData(teamId)
  const teamName = TEAM_NAMES[teamId] || teamId
  const teamInfo = TEAM_INFO[teamId]
  const additionalData = getMockAdditionalData(teamId)

  useEffect(() => {
    console.log(team)
  }, [team])

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-xl max-w-lg w-full mx-4 overflow-hidden border border-neutral-100">
        <div className={`${color} px-8 pt-8 pb-20 relative`}>
          <button 
            onClick={onClose}
            className="absolute z-90 cursor-pointer top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200"
          >
            <X strokeWidth={1} size={20} />
          </button>
          
          <div className="text-center text-white mb-6">
            {isLoading ? (
              <div className='flex flex-col gap-2 items-center'>
                <div className='h-7 w-50 rounded-md bg-white/30 animate-pulse'></div>
                <div className='h-6 w-50 mb-2 rounded-md bg-white/30 animate-pulse'></div>
              </div>
            ): (
              <div className='flex flex-col items-center'>
                <div className="text-xl  tracking-wide mb-1">
                  현재 {team?.rank}위
                </div>
                <div className="text-sm  ">
                  {team?.wins}승 {team?.losses}패 {team?.ties}무
                </div>
              </div>
            )}
          </div>

          <div className="absolute w-full grid grid-cols-3 items-center justify-between left-0 bottom-0 transform translate-y-1/2">
            <div className='flex flex-col gap-2 items-center'>
              <div className="text-xl text-white">
                {isLoading ? (
                  <div className='h-8 w-10 rounded-md bg-white/30 animate-pulse'></div>
                ) : (
                  <span>{team?.win_rate}</span>
                )}
              </div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider ">
                승률
              </div>
            </div>
            <div className="w-28 h-28 mx-auto bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-white">
              <Image
                src={`/team-logos/${teamId}.svg`}
                alt={`${teamName} 로고`}
                width={80}
                height={80}
                priority
              />
            </div>
            <div className='flex flex-col gap-2 items-center'>
              <div className="text-xl  text-white">
                {isLoading ? (
                  <div className='h-8 w-10 rounded-md bg-white/30 animate-pulse'></div>
                ) : (
                  <span>
                    {team?.games_back === 0 ? '-' : team?.games_back}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider ">
                게임차
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-8 pt-20 pb-8">
          {error ? (
            <div className="text-center py-8">
              <div className="text-neutral-400 mb-2 ">
                데이터를 불러올 수 없습니다
              </div>
              <div className="text-sm text-neutral-500 ">{error}</div>
            </div>
          ) : team ? (
            <div>
              <div className="text-center mb-4">
                {isLoading ? (
                  <div className='h-9 w-20 bg-neutral-200 animate-pulse rounded-md mx-auto'></div>
                ): (
                  <h2 className="text-4xl font-semibold tracking-wide text-neutral-900 mb-1">
                    {teamName}
                  </h2>
                )}
              </div>

              {teamInfo && (
                <div className="flex items-center justify-center space-x-6 text-xs text-neutral-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" strokeWidth={1.5} />
                    <span>{teamInfo.location}</span>
                  </div>
                  <div className="w-px h-3 bg-neutral-200"></div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                    <span>우승 {teamInfo.championships}회</span>
                  </div>
                  <div className="w-px h-3 bg-neutral-200"></div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" strokeWidth={1.5} />
                    <span>{teamInfo.founded}년 창단</span>
                  </div>
                </div>
              )}

              <div className="space-y-6 mb-8 max-h-50 overflow-y-auto scrollbar-hide">
                <div className="border border-neutral-100 rounded-2xl p-6 bg-neutral-25">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <span className="text-sm  text-neutral-700">다음 경기</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg  text-neutral-900">
                        vs {TEAM_NAMES[additionalData.nextGame.opponent] || '상대팀'}
                      </div>
                      <span className={additionalData.nextGame.isHome ? 'px-3 py-1 rounded-full text-xs  bg-blue-50 text-blue-600 border border-blue-100' : 'px-3 py-1 rounded-full text-xs  bg-red-50 text-red-600 border border-red-100'}>
                        {additionalData.nextGame.isHome ? '홈' : '원정'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm  text-neutral-900">
                        {new Date(additionalData.nextGame.date).toLocaleDateString('ko-KR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-neutral-400 ">{additionalData.nextGame.time}</div>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-100 rounded-2xl p-6 bg-neutral-25">
                  <div className="flex items-center space-x-2 mb-4">
                    <Target className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <span className="text-sm  text-neutral-700">시즌 주요 기록</span>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-lg  text-neutral-900 font-mono">{additionalData.teamStats.avg.toFixed(3)}</div>
                      <div className="text-xs text-neutral-400 ">팀 타율</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg  text-neutral-900 font-mono">{additionalData.teamStats.era.toFixed(2)}</div>
                      <div className="text-xs text-neutral-400 ">팀 평균자책점</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg  text-neutral-900 font-mono">{additionalData.teamStats.homeRuns}</div>
                      <div className="text-xs text-neutral-400 ">팀 홈런</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-neutral-100 rounded-2xl p-4 bg-neutral-25">
                    <div className="flex items-center space-x-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                      <span className="text-sm  text-neutral-700">최근 5경기</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {team.recent_form.map((result, index) => (
                        <div 
                          key={index} 
                          className={result === 'W' ? 'w-6 h-6 rounded-full flex items-center justify-center text-xs  bg-green-50 text-green-600 border border-green-100' : 'w-6 h-6 rounded-full flex items-center justify-center text-xs  bg-red-50 text-red-600 border border-red-100'}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-neutral-100 rounded-2xl p-4 bg-neutral-25">
                    <div className="text-sm  text-neutral-700 mb-2">현재 기록</div> 
                    <div className={team.current_streak.type === 'W' ? 'text-lg  text-green-600' : 'text-lg  text-red-600'}>
                      {team.current_streak.count}{team.current_streak.type === 'W' ? '연승' : '연패'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-6">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-lg  text-neutral-900 font-mono">{team.wins}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wider ">승</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg  text-neutral-900 font-mono">{team.losses}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wider ">패</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg  text-neutral-900 font-mono">{team.ties}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wider ">무</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-neutral-400 mb-1 ">
                    마지막 업데이트
                  </div>
                  <div className="text-sm text-neutral-600 ">
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