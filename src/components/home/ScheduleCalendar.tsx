"use client"

import { TEAM_NAMES } from '@/constants/teamData'
import { useCurrentMonthSchedule } from '@/hooks/useMonthlySchedule'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Activity, Crown } from 'lucide-react'
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

  const formatTime = (time: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [hh, mm,ss] = time?.split(":")

    return `${hh}:${mm}`
  }

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
                      relative group bg-white
                      ${today ? 'border border-black z-20' : ''}
                      ${selected ? 'bg-black text-white ' : 'hover:bg-gradient-to-br hover:from-neutral-50 hover:to-neutral-100'}
                    `}
                  >
                    <div className={`
                      text-base font-medium mb-2 transition-colors duration-200
                      ${today && !selected ? 'text-black font-semibold' : 
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
                      <div className="absolute top-5 right-3">
                        <div className="w-2.5 h-2.5 bg-black rounded-full animate-pulse shadow-sm"></div>
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
                          className={` rounded-2xl ${index === 0 ? '' : 'border-t border-neutral-200'}`}
                        >
                          <div className="flex items-center justify-center gap-3 text-xs text-neutral-400 my-3">
                            <div className='flex items-center gap-2'>
                              <Clock size={12} strokeWidth={1} />
                              <span>{formatTime(game.game_time)}</span>
                            </div>
                            <div className='h-4 w-1 border-r border-neutral-300'></div>
                            <div className='flex items-center gap-2'>
                              <MapPin size={12} strokeWidth={1} />
                              <span>{game.stadium?.slice(0,2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center mb-6 bg-white">
                            <div className={`flex-1 flex flex-col items-center gap-4 p-4 ${game.status === 'completed' ? 'justify-between' : 'justify-center'}`}>
                              <div className="relative">
                                {game.winner === game.away_team && (
                                  <div 
                                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center"
                                  >
                                    <svg fill={`var(--team-${game.away_team})`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                      {/* <!--!Font Awesome Free v7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--> */}
                                      <path d="M345 151.2C354.2 143.9 360 132.6 360 120C360 97.9 342.1 80 320 80C297.9 80 280 97.9 280 120C280 132.6 285.9 143.9 295 151.2L226.6 258.8C216.6 274.5 195.3 278.4 180.4 267.2L120.9 222.7C125.4 216.3 128 208.4 128 200C128 177.9 110.1 160 88 160C65.9 160 48 177.9 48 200C48 221.8 65.5 239.6 87.2 240L119.8 457.5C124.5 488.8 151.4 512 183.1 512L456.9 512C488.6 512 515.5 488.8 520.2 457.5L552.8 240C574.5 239.6 592 221.8 592 200C592 177.9 574.1 160 552 160C529.9 160 512 177.9 512 200C512 208.4 514.6 216.3 519.1 222.7L459.7 267.3C444.8 278.5 423.5 274.6 413.5 258.9L345 151.2z"/>
                                    </svg>
                                  </div>
                                )}
                                <TeamLogo teamName={game.away_team} className="w-12 h-12" />
                                <div 
                                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-neutral-800"
                                >
                                  <span className="text-[10px] text-white font-bold">A</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-lg text-neutral-900 mb-1">
                                  {TEAM_NAMES[game.away_team] || game.away_team}
                                </div>
                              </div>
                              {game.away_score !== undefined && game.away_score !== null && (
                                <div className="text-right">
                                  <div 
                                    className="text-3xl font-black text-white px-6 py-3 "
                                    style={{ 
                                      color: `var(--team-${game.away_team})`,
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
                            
                            <div className={`flex-1 flex flex-col items-center gap-4 p-4 ${game.status === 'completed' ? 'justify-between' : 'justify-center'}`}>
                              <div className="relative">
                                {game.winner === game.home_team && (
                                  <div 
                                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center"
                                  >
                                    <svg fill={`var(--team-${game.home_team})`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                      {/* <!--!Font Awesome Free v7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--> */}
                                      <path d="M345 151.2C354.2 143.9 360 132.6 360 120C360 97.9 342.1 80 320 80C297.9 80 280 97.9 280 120C280 132.6 285.9 143.9 295 151.2L226.6 258.8C216.6 274.5 195.3 278.4 180.4 267.2L120.9 222.7C125.4 216.3 128 208.4 128 200C128 177.9 110.1 160 88 160C65.9 160 48 177.9 48 200C48 221.8 65.5 239.6 87.2 240L119.8 457.5C124.5 488.8 151.4 512 183.1 512L456.9 512C488.6 512 515.5 488.8 520.2 457.5L552.8 240C574.5 239.6 592 221.8 592 200C592 177.9 574.1 160 552 160C529.9 160 512 177.9 512 200C512 208.4 514.6 216.3 519.1 222.7L459.7 267.3C444.8 278.5 423.5 274.6 413.5 258.9L345 151.2z"/>
                                    </svg>
                                  </div>
                                )}
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
                                    className="text-3xl font-black text-white px-6 py-3 "
                                    style={{ 
                                      color: `var(--team-${game.home_team})`,
                                    }}
                                  >
                                    {game.home_score}
                                  </div>
                                </div>
                              )}
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