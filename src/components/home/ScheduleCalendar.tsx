"use client"

import { useCurrentMonthSchedule } from '@/hooks/useMonthlySchedule'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useState } from 'react'

interface ScheduleCalendarProps {
  selectedDate?: string
  onDateSelect?: (date: string) => void
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

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  const selectedDayGames = selectedDay ? getGamesOnDate(selectedDay) : []

  if (isLoading) {
    return (
      <div className="text-center py-20 text-neutral-400">
        캘린더를 불러오는 중...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-600">
        캘린더 데이터를 불러올 수 없습니다
      </div>
    )
  }

  return (
    <div className="p-1">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-normal text-neutral-900">
            {year}년 {month}월
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            총 {totalGames}경기 예정
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={getPrevMonth}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-neutral-600" />
          </button>
          <button
            onClick={getNextMonth}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-7 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div 
                key={day} 
                className={`p-4 text-center text-sm font-medium ${
                  index === 0 ? 'text-red-500' : 
                  index === 6 ? 'text-blue-500' : 
                  'text-neutral-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border border-neutral-200 rounded-lg overflow-hidden">
            {emptyDays.map((_, index) => (
              <div 
                key={`empty-${index}`} 
                className="aspect-square bg-neutral-50 border-r border-b border-neutral-100"
              />
            ))}
            
            {daysArray.map((day) => {
              const dateKey = formatDateKey(year, month, day)
              const dayGames = getGamesOnDate(dateKey)
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
                    aspect-square border-r border-b border-neutral-100 p-2 cursor-pointer
                    transition-all duration-200 relative
                    ${today ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-neutral-50'}
                    ${selected ? 'bg-blue-100 border-blue-300' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${today ? 'text-blue-600 font-semibold' : 
                      dayOfWeek === 0 ? 'text-red-500' :
                      dayOfWeek === 6 ? 'text-blue-500' :
                      'text-neutral-900'}
                  `}>
                    {day}
                  </div>

                  {hasGames && (
                    <div className="space-y-1">
                      {dayGames.slice(0, 2).map((game, index) => (
                        <div
                          key={game.id}
                          className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800 truncate"
                          title={`${game.away_team} vs ${game.home_team}`}
                        >
                          {game.away_team.slice(0, 2)} vs {game.home_team.slice(0, 2)}
                        </div>
                      ))}
                      {gameCount > 2 && (
                        <div className="text-xs text-neutral-500 text-center">
                          +{gameCount - 2}
                        </div>
                      )}
                    </div>
                  )}

                  {today && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            {selectedDay ? (
              <div className="bg-neutral-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={18} className="text-neutral-600" />
                  <h3 className="font-medium text-neutral-900">
                    {new Date(selectedDay).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </h3>
                </div>

                {selectedDayGames.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400">
                    이 날은 경기가 없습니다
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-neutral-600 mb-4">
                      총 {selectedDayGames.length}경기 예정
                    </div>
                    
                    {selectedDayGames.map((game) => (
                      <div
                        key={game.id}
                        className="bg-white border border-neutral-200 rounded-lg p-4"
                      >
                        <div className="font-medium text-neutral-900 mb-2">
                          {game.away_team} vs {game.home_team}
                        </div>
                        
                        <div className="space-y-2 text-sm text-neutral-600">
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            {game.game_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            {game.stadium}
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            game.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                            game.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            game.status === 'postponed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {game.status === 'scheduled' ? '예정' :
                             game.status === 'completed' ? '종료' :
                             game.status === 'postponed' ? '연기' : '취소'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-6 text-center text-neutral-400">
                날짜를 선택하면 경기 일정을 확인할 수 있습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}