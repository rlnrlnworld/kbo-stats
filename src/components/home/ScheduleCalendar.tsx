"use client"

import { useCurrentMonthSchedule } from '@/hooks/useMonthlySchedule'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Trophy, Users } from 'lucide-react'
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
      <div className={`rounded-full bg-neutral-400 flex items-center justify-center text-xs font-bold text-white ${className}`}>
        {teamName.charAt(0)}
      </div>
    )
  }

  return (
    <img
      src={logoSrc}
      alt={`${teamName} 로고`}
      className={className}
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
      case 'completed': return 'bg-neutral-100 text-neutral-700 border-neutral-200'
      case 'scheduled': return 'bg-neutral-50 text-neutral-700 border-neutral-200'
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

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  const selectedDayGames = selectedDay ? getGamesOnDate(selectedDay) : []

  if (isLoading) {
    return (
      <div className="text-center py-20 text-neutral-400">
        경기 일정을 불러오는 중...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <div className="text-red-600 mb-4">일정 데이터를 불러올 수 없습니다</div>
        <button 
          className="px-6 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-700 transition-colors"
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
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-neutral-600" />
          </button>
          <div className="px-6 py-2 text-lg font-normal text-neutral-900 min-w-[120px] text-center">
            {year}년 {month}월
          </div>
          <button
            onClick={getNextMonth}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="border border-neutral-200 rounded-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-neutral-200">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div 
                  key={day} 
                  className="p-4 text-center bg-neutral-50"
                >
                  <span className="text-xs text-neutral-400 uppercase tracking-wider font-normal">
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
                      aspect-square p-4 cursor-pointer border-b border-r border-neutral-100 transition-all duration-200
                      relative hover:bg-neutral-50 group bg-white
                      ${today ? 'bg-neutral-100' : ''}
                      ${selected ? 'bg-neutral-200' : ''}
                    `}
                  >
                    <div className={`
                      text-base font-normal mb-2
                      ${today ? 'text-neutral-900 font-medium' : 
                        selected ? 'text-neutral-900 font-medium' :
                        dayOfWeek === 0 ? 'text-red-500' :
                        dayOfWeek === 6 ? 'text-blue-500' :
                        'text-neutral-900'}
                    `}>
                      {day}
                    </div>

                    {hasGames && (
                      <div className="absolute bottom-3 right-3">
                        <div className="bg-neutral-900 text-white text-xs font-mono rounded-full w-5 h-5 flex items-center justify-center">
                          {gameCount}
                        </div>
                      </div>
                    )}

                    {today && (
                      <div className="absolute top-3 right-3">
                        <div className="w-2 h-2 bg-neutral-900 rounded-full"></div>
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
              <div className="border border-neutral-200 rounded-sm overflow-hidden">
                <div className="bg-neutral-900 text-white p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={18} strokeWidth={1} />
                    <h3 className="font-normal text-lg">
                      {new Date(selectedDay).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <p className="text-neutral-300 text-sm font-normal">
                      {new Date(selectedDay).toLocaleDateString('ko-KR', {
                        weekday: 'long'
                      })}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-white">
                  {selectedDayGames.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <div className="mb-3">
                        <Calendar size={24} strokeWidth={1} className="text-neutral-400 mx-auto" />
                      </div>
                      <p className="font-normal mb-2">경기가 없는 날입니다</p>
                      <p className="text-sm text-neutral-400">다른 날짜를 선택해보세요</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedDayGames.map((game, index) => (
                        <div
                          key={game.id}
                          className="border-b border-neutral-100 pb-6 last:border-b-0 last:pb-0"
                        >
                          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-4 font-normal">
                            {index + 1}경기
                          </div>
                          
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <TeamLogo teamName={game.away_team} />
                                <span className="font-normal text-neutral-900">{game.away_team}</span>
                                <span className="text-xs text-neutral-500 font-mono">원정</span>
                              </div>
                              {game.away_score !== undefined && game.away_score !== null && (
                                <span className="text-lg font-mono text-neutral-900">{game.away_score}</span>
                              )}
                            </div>
                            
                            <div className="text-center py-2">
                              <span className="text-xs text-neutral-400 font-mono">VS</span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3">
                                <TeamLogo teamName={game.home_team} />
                                <span className="font-normal text-neutral-900">{game.home_team}</span>
                                <span className="text-xs text-neutral-500 font-mono">홈</span>
                              </div>
                              {game.home_score !== undefined && game.home_score !== null && (
                                <span className="text-lg font-mono text-neutral-900">{game.home_score}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                              <Clock size={14} strokeWidth={1} />
                              <span className="font-mono">{game.game_time ? game.game_time.slice(0, 5) : '시간 미정'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                              <MapPin size={14} strokeWidth={1} />
                              <span className="font-normal">{game.stadium || '구장 미정'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-3 py-1 rounded border font-normal ${getStatusColor(game.status)}`}>
                              {getStatusText(game.status)}
                            </span>
                            {game.status === 'completed' && game.winner && (
                              <div className="flex items-center gap-1">
                                <Trophy size={12} strokeWidth={1} className="text-neutral-400" />
                                <span className="text-neutral-500 font-mono">
                                  {game.winner}
                                </span>
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
              <div className="border border-neutral-200 rounded-sm p-8 text-center bg-white">
                <div className="mb-4">
                  <Calendar size={24} strokeWidth={1} className="text-neutral-400 mx-auto" />
                </div>
                <h3 className="font-normal text-neutral-900 mb-2">날짜를 선택하세요</h3>
                <p className="text-sm text-neutral-500 font-normal">
                  캘린더에서 날짜를 클릭하면<br />상세한 경기 정보를 확인할 수 있습니다
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}