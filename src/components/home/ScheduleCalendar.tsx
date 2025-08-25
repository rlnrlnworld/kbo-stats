"use client"

import { useCurrentMonthSchedule } from '@/hooks/useMonthlySchedule'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Trophy, Users } from 'lucide-react'
import React, { useState } from 'react'

interface ScheduleCalendarProps {
  selectedDate?: string
  onDateSelect?: (date: string) => void
}

const getTeamColorClass = (teamName: string): string => {
  const team = teamName.toLowerCase()
  return `bg-team-${team}`
}

const getTeamColorStyle = (teamName: string): React.CSSProperties => {
  const team = teamName.toLowerCase()
  return { backgroundColor: `var(--color-team-${team}, #6B7280)` }
}

export default function ScheduleCalendar({ selectedDate, onDateSelect }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(selectedDate || null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const { 
    totalGames, 
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
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'postponed': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
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
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">캘린더를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-red-500" />
          </div>
          <p className="text-red-600 font-medium">캘린더 데이터를 불러올 수 없습니다</p>
          <p className="text-gray-500 text-sm mt-2">잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {year}년 {month}월 경기 일정
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Trophy size={16} />
            총 {totalGames}경기 예정
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm">
          <button
            onClick={getPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="px-4 py-2 text-sm font-medium text-gray-700 min-w-[100px] text-center">
            {year}년 {month}월
          </div>
          <button
            onClick={getNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div 
                  key={day} 
                  className={`p-4 text-center text-sm font-semibold border-b border-gray-200 ${
                    index === 0 ? 'text-red-500' : 
                    index === 6 ? 'text-blue-500' : 
                    'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {emptyDays.map((_, index) => (
                <div 
                  key={`empty-${index}`} 
                  className="aspect-square border-b border-r border-gray-200 bg-gray-50"
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
                      aspect-square p-3 cursor-pointer border-b border-r border-gray-200 transition-all duration-200
                      relative hover:bg-blue-50 group
                      ${today ? 'bg-blue-100 border-blue-300' : 'bg-white'}
                      ${selected ? 'bg-blue-200 border-blue-400' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-semibold mb-2
                      ${today ? 'text-blue-700' : 
                        selected ? 'text-blue-800' :
                        dayOfWeek === 0 ? 'text-red-500' :
                        dayOfWeek === 6 ? 'text-blue-500' :
                        'text-gray-900'}
                    `}>
                      {day}
                    </div>

                    {hasGames && (
                      <div className="absolute bottom-2 right-2">
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {gameCount}
                        </div>
                      </div>
                    )}

                    {today && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar size={20} />
                    <h3 className="font-bold text-lg">
                      {new Date(selectedDay).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>
                  <p className="text-blue-100 text-sm">
                    {new Date(selectedDay).toLocaleDateString('ko-KR', {
                      weekday: 'long'
                    })}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Users size={16} />
                    <span className="text-sm font-medium">
                      {selectedDayGames.length}경기 {selectedDayGames.length > 0 ? '진행' : '없음'}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {selectedDayGames.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar size={20} className="text-gray-400" />
                      </div>
                      <p className="font-medium mb-1">경기가 없는 날입니다</p>
                      <p className="text-sm">다른 날짜를 선택해보세요</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayGames.map((game, index) => (
                        <div
                          key={game.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="text-xs text-gray-500 font-medium mb-3">
                            {index + 1}경기
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={getTeamColorStyle(game.away_team)}
                                  />
                                  <span className="font-semibold text-gray-900">{game.away_team}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">원정</span>
                                </div>
                                {game.away_score !== undefined && game.away_score !== null && (
                                  <span className="text-xl font-bold text-gray-900">{game.away_score}</span>
                                )}
                              </div>
                              
                              <div className="text-center py-1">
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">VS</span>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={getTeamColorStyle(game.home_team)}
                                  />
                                  <span className="font-semibold text-gray-900">{game.home_team}</span>
                                  <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-700">홈</span>
                                </div>
                                {game.home_score !== undefined && game.home_score !== null && (
                                  <span className="text-xl font-bold text-gray-900">{game.home_score}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Winner indicator */}
                            {game.winner && (
                              <div className="ml-4">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <Trophy size={16} className="text-yellow-600" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Game Info */}
                          <div className="space-y-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock size={14} />
                              <span>{game.game_time ? game.game_time.slice(0, 5) : '시간 미정'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin size={14} />
                              <span className="flex-1">{game.stadium || '구장 미정'}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(game.status)}`}>
                                {getStatusText(game.status)}
                              </span>
                              {game.status === 'completed' && game.winner && (
                                <span className="text-xs text-gray-500">
                                  승리: {game.winner}
                                </span>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={24} className="text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">날짜를 선택하세요</h3>
                <p className="text-sm text-gray-500">
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