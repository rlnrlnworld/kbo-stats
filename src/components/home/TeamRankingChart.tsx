/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useRankingHistory } from '@/hooks/useRankingHistory'
import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { Calendar, TrendingUp, BarChart3, RefreshCw } from 'lucide-react'

const teamColors = {
  'KIA': '#ea0029',
  'LG': '#c41e3a', 
  '삼성': '#074ca1',
  '한화': '#ff6900',
  'NC': '#315288',
  'KT': '#000000',
  'SSG': '#ce1141',
  '롯데': '#041e42',
  '두산': '#131230',
  '키움': '#570514',
}

const teamNames = ['KIA', 'LG', '삼성', '한화', 'NC', 'KT', 'SSG', '롯데', '두산', '키움']

export default function TeamRankingChart() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['KIA', 'LG', '삼성'])
  const [period, setPeriod] = useState<'7' | '14' | '30'>('30')

  const { 
    rankingHistory, 
    isLoading, 
    error, 
    hasData, 
    dateRange, 
    summary,
    refresh 
  } = useRankingHistory(Number(period))

  useEffect(() => {
    console.log('📊 순위 히스토리 데이터:', rankingHistory)
    console.log('📈 데이터 요약:', summary)
  }, [rankingHistory, summary])

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => 
      prev.includes(team) 
        ? prev.filter(t => t !== team)
        : [...prev, team]
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.fullDate}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.dataKey}:</span>
              <span className="text-gray-700">{entry.value}위</span>
              {data[`${entry.dataKey}_record`] && (
                <span className="text-xs text-gray-500 ml-2">
                  ({data[`${entry.dataKey}_record`]})
                </span>
              )}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">❌ 데이터 로드 실패</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refresh()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1 flex items-center">

            순위 변동 추이
          </h3>
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {dateRange || `최근 ${period}일`}
            </div>
          </div>
        </div>
        
        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
          {['7', '14', '30'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as '7' | '14' | '30')}
              className={`
                px-3 py-1 text-sm rounded-md transition-all duration-200
                ${period === p 
                  ? 'bg-white text-neutral-900 shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-900'
                }
              `}
            >
              {p}일
            </button>
          ))}
        </div>
      </div>

      {/* Team Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-neutral-400 uppercase tracking-wider">
            표시할 팀 선택
          </p>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {teamNames.map((team) => (
            <button
              key={team}
              onClick={() => toggleTeam(team)}
              className={`
                px-3 py-1 text-sm rounded-full border transition-all duration-200
                ${selectedTeams.includes(team)
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: teamColors[team as keyof typeof teamColors] }}
                />
                {team}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">순위 데이터 로딩 중...</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">📊</div>
              <p className="text-gray-600">표시할 순위 데이터가 없습니다</p>
              <p className="text-sm text-gray-500 mt-1">데이터 수집 후 다시 확인해주세요</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rankingHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                domain={[1, 10]}
                reversed={true}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                tickFormatter={(value) => `${value}위`}
              />
              
              <ReferenceLine y={5.5} stroke="#e5e5e5" strokeDasharray="2 2" />
              
              <Tooltip content={<CustomTooltip />} />
              
              {selectedTeams.map((team) => (
                <Line
                  key={team}
                  type="monotone"
                  dataKey={team}
                  stroke={teamColors[team as keyof typeof teamColors]}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center text-xs text-neutral-500">
        <div>
          * 클릭해서 팀을 선택/해제할 수 있습니다
        </div>
        {!isLoading && hasData && (
          <div className="mt-3 text-center text-xs text-gray-400">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        )}
      </div>
    </div>
  )
}