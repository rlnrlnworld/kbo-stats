"use client"

import { useTeams } from '@/hooks/useTeams'
import React, { useEffect, useState } from 'react'


const mockPlayers = [
  { rank: 1, name: '김도영', team: 'KIA', avg: '.347', hr: 38, rbi: 109, hits: 201 },
  { rank: 2, name: '소크라테스', team: 'KT', avg: '.330', hr: 31, rbi: 95, hits: 186 },
  { rank: 3, name: '오스틴', team: 'LG', avg: '.325', hr: 25, rbi: 102, hits: 178 },
  { rank: 4, name: '구자욱', team: '삼성', avg: '.318', hr: 22, rbi: 87, hits: 165 },
]

const getTeamHoverClass = (teamId: string) => {
  return `team-hover-${teamId}`
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('batting')
  const [activeNav, setActiveNav] = useState('standings')

  const { teams, loading, error, mutate } = useTeams()
  useEffect(() => {
    console.log(teams)
  }, [teams])

  const validTeams = teams?.slice(0, 10)

  const handleRefresh = () => {
    mutate()
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-8">
        {/* Header */}
        <header className="pt-16 pb-24 text-center">
          <h1 className="text-5xl font-light tracking-tight mb-4 text-neutral-900">
            KBO
          </h1>
          <p className="text-lg text-neutral-600 font-normal">
            {new Date().getFullYear()} 시즌 기록
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center mb-32">
          <ul className="flex gap-16">
            {[
              { id: 'standings', label: '순위' },
              { id: 'players', label: '선수 기록' },
              { id: 'schedule', label: '일정' },
              { id: 'stats', label: '통계' },
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveNav(item.id)}
                  className={`
                    text-base font-normal py-2 border-b-2 transition-all duration-300
                    ${activeNav === item.id 
                      ? 'text-neutral-900 border-neutral-900' 
                      : 'text-neutral-500 border-transparent hover:text-neutral-900 hover:border-neutral-900'
                    }
                  `}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main>
          {/* Teams Section */}
          {activeNav === 'standings' && (
            <section className="mb-40">
              <div className="mb-16">
                <h2 className="text-2xl font-normal mb-2 text-neutral-900">
                  팀 순위
                </h2>
                <p className="text-base text-neutral-600">
                  정규시즌 현재 순위
                </p>
              </div>

              {loading && (
                <div className="text-center py-20 text-neutral-400">
                  순위 데이터를 불러오는 중...
                </div>
              )}

              {error && (
                <div className="text-center py-20">
                  <div className="text-red-600 mb-4">데이터를 불러올 수 없습니다</div>
                  <div className="text-sm text-neutral-500 mb-4">{error}</div>
                  <button 
                    onClick={handleRefresh}
                    className="px-6 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {!loading && !error && (
                <div className="border-t border-neutral-200">
                  {validTeams.map((team) => (
                    <div
                      key={team.id}
                      className={`
                        grid grid-cols-4 gap-8 py-8 border-b border-neutral-100 
                        items-center cursor-pointer transition-all duration-200
                        hover:-mx-8 hover:px-8
                        ${getTeamHoverClass(team.id)}
                      `}
                    >
                      {/* Team Name */}
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${team.color}`}></div>
                        <span className="text-base font-normal text-neutral-900">
                          {team.name}
                        </span>
                      </div>

                      {/* Wins */}
                      <div className="text-right">
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
                          승
                        </div>
                        <div className="text-base text-neutral-900 font-mono">
                          {team.wins}
                        </div>
                      </div>

                      {/* Losses */}
                      <div className="text-right">
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
                          패
                        </div>
                        <div className="text-base text-neutral-900 font-mono">
                          {team.losses}
                        </div>
                      </div>

                      {/* Win Rate */}
                      <div className="text-right">
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
                          승률
                        </div>
                        <div className="text-base text-neutral-900 font-mono font-semibold">
                          {team.winRate.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Players Section */}
          {activeNav === 'players' && (
            <section className="mb-32">
              <div className="mb-16">
                <h2 className="text-2xl font-normal mb-2 text-neutral-900">
                  선수 기록
                </h2>
                <p className="text-base text-neutral-600">
                  주요 개인 기록
                </p>
              </div>

              {/* Stats Navigation */}
              <div className="flex gap-8 mb-16 border-b border-neutral-100">
                {[
                  { id: 'batting', label: '타격' },
                  { id: 'pitching', label: '투구' },
                  { id: 'fielding', label: '수비' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      py-4 text-base font-normal border-b-2 transition-all duration-300
                      ${activeTab === tab.id
                        ? 'text-neutral-900 border-neutral-900'
                        : 'text-neutral-500 border-transparent hover:text-neutral-900 hover:border-neutral-900'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Stats Table */}
              <div className="border-t border-neutral-200">
                {/* Header */}
                <div className="grid grid-cols-6 gap-8 py-6 border-b border-neutral-100">
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">
                    순위
                  </span>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider">
                    선수
                  </span>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider text-right">
                    타율
                  </span>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider text-right">
                    홈런
                  </span>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider text-right">
                    타점
                  </span>
                  <span className="text-xs text-neutral-400 uppercase tracking-wider text-right">
                    안타
                  </span>
                </div>

                {/* Data Rows */}
                {mockPlayers.map((player) => (
                  <div
                    key={player.rank}
                    className="grid grid-cols-6 gap-8 py-6 border-b border-neutral-50 
                             hover:bg-neutral-25 hover:-mx-8 hover:px-8 cursor-pointer
                             transition-all duration-200"
                  >
                    <div className="text-sm text-neutral-400 font-mono">
                      {player.rank}
                    </div>
                    <div>
                      <div className="text-base font-medium text-neutral-900 mb-1">
                        {player.name}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {player.team}
                      </div>
                    </div>
                    <div className="text-base text-neutral-900 font-mono text-right">
                      {player.avg}
                    </div>
                    <div className="text-base text-neutral-900 font-mono text-right">
                      {player.hr}
                    </div>
                    <div className="text-base text-neutral-900 font-mono text-right">
                      {player.rbi}
                    </div>
                    <div className="text-base text-neutral-900 font-mono text-right">
                      {player.hits}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other sections can be added here */}
          {activeNav === 'schedule' && (
            <section className="mb-32">
              <div className="mb-16">
                <h2 className="text-2xl font-normal mb-2 text-neutral-900">
                  경기 일정
                </h2>
                <p className="text-base text-neutral-600">
                  오늘의 경기 및 향후 일정
                </p>
              </div>
              <div className="text-center py-20 text-neutral-400">
                경기 일정 데이터 준비 중...
              </div>
            </section>
          )}

          {activeNav === 'stats' && (
            <section className="mb-32">
              <div className="mb-16">
                <h2 className="text-2xl font-normal mb-2 text-neutral-900">
                  통계
                </h2>
                <p className="text-base text-neutral-600">
                  시즌 주요 통계 분석
                </p>
              </div>
              <div className="text-center py-20 text-neutral-400">
                통계 데이터 준비 중...
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}