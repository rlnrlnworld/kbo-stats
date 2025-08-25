"use client"

import { TEAM_NAMES } from '@/constants/teamData'
import { useCurrentMonthSchedule } from '@/hooks/useMonthlySchedule'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Trophy, Users, Star, Activity } from 'lucide-react'
import React, { useState } from 'react'

interface ScheduleCalendarProps {
  selectedDate?: string
  onDateSelect?: (date: string) => void
}

const TeamLogo = ({ teamName, className = "w-6 h-6" }: { teamName: string, className?: string }) => {
  const [hasError, setHasError] = useState(false)
  const logoSrc = `/team-logos/${teamName}.svg`

  if (hasError) {
    return (
      <div className={`rounded-full bg-gradient-to-br from-neutral-400 to-neutral-500 flex items-center justify-center text-xs font-bold text-white shadow-sm ${className}`}>
        {teamName.charAt(0)}
      </div>
    )
  }

  return (
    <img
      src={logoSrc}
      alt={`${teamName} 로고`}
      className={`${className} rounded-full shadow-sm`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  )
}

export default function ScheduleCalendar({ selectedDate, onDateSelect }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(selectedDate || null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const { 
    hasGamesOnDate,
    getGamesOnDate,
    getGameCount,
    isLoading, 
    isError 
  } = useCurrentMonthSchedule()

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const getPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
  }

  const getNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date()
    return today.getFullYear() === year && 
           today.getMonth() + 1 === month && 
           today.getDate() === day
  }

  const handleDayClick = (day: number) => {
    const dateKey = formatDateKey(year, month, day)
    setSelectedDay(dateKey)
    onDateSelect?.(dateKey)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'postponed': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-neutral-50 text-neutral-700 border-neutral-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '종료'
      case 'scheduled': return '예정'
      case 'postponed': return '연기'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const getSelectedDateInfo = () => {
    if (!selectedDay) return null
    
    const date = new Date(selectedDay)
    const dayOfWeek = date.toLocaleDateString('ko-KR', { weekday: 'long' })
    const monthDay = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    const isSelectedToday = isToday(date.getFullYear(), date.getMonth() + 1, date.getDate())
    
    return {
      dayOfWeek,
      monthDay,
      isToday: isSelectedToday,
      formattedDate: date.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  const selectedDayGames = selectedDay ? getGamesOnDate(selectedDay) : []
  const selectedDateInfo = getSelectedDateInfo()

  if (isLoading) {
    return (
      <div className="text-center py-20 text-neutral-400">
        <div className="animate-pulse">
          <Activity size={32} className="mx-auto mb-4 text-neutral-300" />
          <p className="font-normal">경기 일정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">일정 데이터를 불러올 수 없습니다</div>
        <button 
          className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors shadow-sm"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={getPrevMonth}
            className="p-3 hover:bg-neutral-100 rounded-xl transition-all duration-200 hover:shadow-sm"
          >
            <ChevronLeft size={20} className="text-neutral-600" />
          </button>
          <div className="px-8 py-3 text-xl font-medium text-neutral-900 min-w-[140px] text-center bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl shadow-sm">
            {year}년 {month}월
          </div>
          <button
            onClick={getNextMonth}
            className="p-3 hover:bg-neutral-100 rounded-xl transition-all duration-200 hover:shadow-sm"
          >
            <ChevronRight size={20} className="text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 border-b border-neutral-200">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div 
                  key={day} 
                  className="p-4 text-center bg-gradient-to-b from-neutral-50 to-neutral-100"
                >
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {emptyDays.map((_, index) => (
                <div 
                  key={`empty-${index}`} 
                  className="aspect-square border-b border-r border-neutral-100 bg-neutral-25"
                />
              ))}
              
              {daysArray.map((day) => {
                const dateKey = formatDateKey(year, month, day)
                const gameCount = getGameCount(dateKey)
                const hasGames = hasGamesOnDate(dateKey)
                const today = isToday(year, month, day)
                const selected = selectedDay === dateKey
                const dayOfWeek = (firstDayOfMonth + day - 1) % 7

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`
                      aspect-square p-4 cursor-pointer border-b border-r border-neutral-100 transition-all duration-300
                      relative hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100 group bg-white
                      hover:shadow-sm transform hover:scale-[1.02]
                      ${today ? 'bg-gradient-to-br from-blue-50 to-blue-100 ring-2 ring-blue-200' : ''}
                      ${selected ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 text-white shadow-lg ring-2 ring-neutral-300' : ''}
                    `}
                  >
                    <div className={`
                      text-base font-medium mb-2 transition-colors duration-200
                      ${today && !selected ? 'text-blue-700 font-semibold' : 
                        selected ? 'text-white font-semibold' :
                        dayOfWeek === 0 ? 'text-red-500' :
                        dayOfWeek === 6 ? 'text-blue-500' :
                        'text-neutral-900'}
                    `}>
                      {day}
                    </div>

                    {hasGames && (
                      <div className="absolute bottom-3 right-3">
                        <div className={`
                          text-xs font-mono rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200
                          ${selected ? 'bg-white text-neutral-900 shadow-sm' : 'bg-gradient-to-r from-neutral-800 to-neutral-900 text-white shadow-sm'}
                        `}>
                          {gameCount}
                        </div>
                      </div>
                    )}

                    {today && !selected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-sm"></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {selectedDay ? (
              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-lg bg-white">
                {/* 헤더 섹션 업그레이드 */}
                <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 text-white p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Calendar size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl">
                          {selectedDateInfo?.monthDay}
                        </h3>
                        <p className="text-neutral-300 text-sm font-medium flex items-center gap-2">
                          {selectedDateInfo?.dayOfWeek}
                          {selectedDateInfo?.isToday && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium animate-pulse">
                              오늘
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* 경기 수 표시 */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
                      <Users size={16} strokeWidth={1.5} className="text-neutral-300" />
                      <span className="text-sm text-neutral-300 font-medium">
                        총 {selectedDayGames.length}경기
                      </span>
                      {selectedDayGames.length > 0 && (
                        <div className="ml-auto flex items-center gap-1">
                          <Star size={14} strokeWidth={1.5} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-neutral-300">경기일</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-b from-white to-neutral-50">
                  {selectedDayGames.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mb-6 relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                          <Calendar size={28} strokeWidth={1} className="text-neutral-400" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">0</span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-neutral-900 mb-2 text-lg">경기가 없는 날</h4>
                      <p className="text-sm text-neutral-500 font-normal leading-relaxed">
                        이 날에는 예정된 경기가 없습니다.<br />
                        다른 날짜를 선택해서<br />
                        경기 일정을 확인해보세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedDayGames.map((game, index) => (
                        <div
                          key={game.id}
                          className="border border-neutral-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-neutral-300"
                        >
                          {/* 경기 번호 표시 */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                              <div className="px-3 py-1 bg-gradient-to-r from-neutral-100 to-neutral-200 rounded-full">
                                <span className="text-xs font-mono text-neutral-600">경기 {index + 1}</span>
                              </div>
                              {game.status === 'completed' && (
                                <div className="px-2 py-1 bg-emerald-100 rounded-full">
                                  <Trophy size={12} className="text-emerald-600" />
                                </div>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full border font-medium text-xs shadow-sm ${getStatusColor(game.status)}`}>
                              {getStatusText(game.status)}
                            </span>
                          </div>

                          {/* 팀 매치업 - 더 시각적으로 업그레이드 */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl">
                              <div className="flex items-center gap-4 flex-1">
                                <TeamLogo teamName={game.away_team} className="w-10 h-10" />
                                <div className="flex-1">
                                  <div className="font-semibold text-neutral-900 text-base">
                                    {TEAM_NAMES[game.away_team] || game.away_team}
                                  </div>
                                  <div className="text-xs text-neutral-500 font-medium bg-neutral-200 px-2 py-1 rounded-full inline-block mt-1">
                                    원정
                                  </div>
                                </div>
                              </div>
                              {game.away_score !== undefined && game.away_score !== null && (
                                <div className="text-2xl font-bold text-neutral-900 bg-white px-4 py-2 rounded-lg shadow-sm border">
                                  {game.away_score}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-center py-3">
                              <div className="px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-semibold tracking-wider shadow-sm">
                                VS
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-xl">
                              <div className="flex items-center gap-4 flex-1">
                                <TeamLogo teamName={game.home_team} className="w-10 h-10" />
                                <div className="flex-1">
                                  <div className="font-semibold text-neutral-900 text-base">
                                    {TEAM_NAMES[game.home_team] || game.home_team}
                                  </div>
                                  <div className="text-xs text-neutral-500 font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full inline-block mt-1">
                                    홈
                                  </div>
                                </div>
                              </div>
                              {game.home_score !== undefined && game.home_score !== null && (
                                <div className="text-2xl font-bold text-neutral-900 bg-white px-4 py-2 rounded-lg shadow-sm border">
                                  {game.home_score}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 경기 세부 정보 */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Clock size={16} strokeWidth={1.5} className="text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-neutral-900 text-sm">경기 시간</div>
                                  <div className="font-mono text-neutral-600 text-sm">
                                    {game.game_time ? game.game_time.slice(0, 5) : '시간 미정'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                  <MapPin size={16} strokeWidth={1.5} className="text-emerald-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-neutral-900 text-sm">경기장</div>
                                  <div className="text-neutral-600 text-sm">
                                    {game.stadium || '구장 미정'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 승부 결과 (완료된 경기만) */}
                            {game.status === 'completed' && game.winner && (
                              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-500 rounded-lg">
                                    <Trophy size={16} strokeWidth={1.5} className="text-white" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-emerald-900 text-sm">승리팀</div>
                                    <div className="font-mono text-emerald-700 text-base font-medium">
                                      {TEAM_NAMES[game.winner] || game.winner}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-xl p-8 text-center bg-gradient-to-b from-white to-neutral-50 shadow-sm">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Calendar size={28} strokeWidth={1} className="text-neutral-400" />
                  </div>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-3 text-lg">날짜를 선택하세요</h3>
                <p className="text-sm text-neutral-500 font-normal leading-relaxed">
                  캘린더에서 날짜를 클릭하면<br />
                  해당 날의 상세한 경기 정보와<br />
                  일정을 확인할 수 있습니다
                </p>
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">
                    💡 숫자가 표시된 날짜는 경기가 있는 날입니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}