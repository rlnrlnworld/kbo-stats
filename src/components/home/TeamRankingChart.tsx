/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRankingHistory } from '@/hooks/useRankingHistory';
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const generateMockRankingData = () => {
  const teams = ['KIA', 'LG', '삼성', '한화', 'NC', 'KT', 'SSG', '롯데', '두산', '키움'];
  const data = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dayData: any = {
      date: date.toISOString().split('T')[0],
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
    };
    
    teams.forEach((team, index) => {
      // 약간의 랜덤 변동 추가
      const baseRank = index + 1;
      const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      dayData[team] = Math.max(1, Math.min(10, baseRank + variation));
    });
    
    data.push(dayData);
  }
  
  return data;
};

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
};

export default function TeamRankingChart() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['KIA', 'LG', '삼성']);
  const [period, setPeriod] = useState<'7' | '14' | '30'>('30');

  const { rankingHistory } = useRankingHistory(Number(period))
  useEffect(() => {
    console.log(rankingHistory)
  }, [rankingHistory])
  
  const data = generateMockRankingData();
  const filteredData = data.slice(-parseInt(period));

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => 
      prev.includes(team) 
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">
            순위 변동 추이
          </h3>
          <p className="text-sm text-neutral-600">
            최근 {period}일간 팀 순위 변화
          </p>
        </div>
        
        {/* Period Selector */}
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
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">
          표시할 팀 선택
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(teamColors).map((team) => (
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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              domain={[1, 10]}
              reversed={true} // 1위가 위에 오도록
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              tickFormatter={(value) => `${value}위`}
            />
            <Tooltip 
              contentStyle={{
                background: 'white',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              formatter={(value, name) => [`${value}위`, name]}
            />
            
            {selectedTeams.map((team) => (
              <Line
                key={team}
                type="monotone"
                dataKey={team}
                stroke={teamColors[team as keyof typeof teamColors]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 text-xs text-neutral-500 text-center">
        * 클릭해서 팀을 선택/해제할 수 있습니다
      </div>
    </div>
  );
}