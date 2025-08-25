"use client"

import { TEAM_NAMES } from '@/constants/teamData'
import { useCurrentMonthSchedule } from '@/hooks/useMonthlySchedule'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
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

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-4">
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

        <div className="lg:col-span-2">
          <div className="sticky top-6">
            {selectedDay ? (
              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-lg bg-white">
                <div className="bg-black text-white p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
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
                            <span className="px-2 py-1 bg-white text-black text-xs rounded-full font-medium">
                              Today
                            </span>
                          )}
                        </p>
                      </div>
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
                          className={`bg-white rounded-2xl ${index === 0 ? '' : 'border-t border-neutral-200'}`}
                        >

                          <div className="mb-6 bg-white">
                            <div className={`flex items-center gap-4 p-4 ${game.status === 'completed' ? 'justify-between' : ''}`}>
                              <div className='flex items-center gap-2'>
                                <div className="relative">
                                  <TeamLogo teamName={game.away_team} className="w-12 h-12" />
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neutral-600 rounded-full flex items-center justify-center">
                                    <span className="text-[10px] text-white font-bold">A</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-bold text-lg text-neutral-900 mb-1">
                                    {TEAM_NAMES[game.away_team] || game.away_team}
                                  </div>
                                </div>
                              </div>
                              {game.away_score !== undefined && game.away_score !== null && (
                                <div className="text-right">
                                  <div 
                                    className="text-3xl font-black text-white px-6 py-3 rounded-xl shadow-lg border-2"
                                    style={{ 
                                      backgroundColor: `var(--team-${game.away_team})`,
                                      borderColor: `var(--team-${game.away_team})`
                                    }}
                                  >
                                    {game.away_score}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-center py-4">
                              <div className="px-6 py-2 text-neutral-700 text-sm font-bold tracking-widest">
                                VS
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4">
                              <div className="relative">
                                <TeamLogo teamName={game.home_team} className="w-12 h-12" />
                                <div 
                                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: `var(--team-${game.home_team})` }}
                                >
                                  <span className="text-[10px] text-white font-bold">H</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-lg text-neutral-900 mb-1">
                                  {TEAM_NAMES[game.home_team] || game.home_team}
                                </div>
                              </div>
                              {game.home_score !== undefined && game.home_score !== null && (
                                <div className="text-right">
                                  <div 
                                    className="text-3xl font-black text-white px-6 py-3 rounded-xl shadow-lg border-2"
                                    style={{ 
                                      backgroundColor: `var(--team-${game.home_team})`,
                                      borderColor: `var(--team-${game.home_team})`
                                    }}
                                  >
                                    {game.home_score}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
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