import { useTeamData } from '@/hooks/useTeamData';
import { TEAM_COLORS } from '@/types/team';
import { X } from 'lucide-react';
import Image from 'next/image';

type Props = {
  teamId: string;
  onClose: () => void;
}

export default function TeamModal({ teamId, onClose }: Props) {

  const color = TEAM_COLORS[teamId]
  const { team } = useTeamData(teamId)

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 bg-opacity-50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div 
          className={`${color} p-6 rounded-xl max-w-xl w-full mx-4 relative`}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 p-2 rounded-full hover:bg-white/10 hover:text-white cursor-pointer transition-colors ease"
          >
            <X strokeWidth={1} size={20} />
          </button>
          
          <div className="flex justify-center mb-4">
            <Image
              src={`/team-logos/${teamId}.svg`}
              alt={`${teamId} 로고`}
              width={150}
              height={150}
              priority
            />
          </div>
          
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-2">{teamId} 정보</h2>
            {/* 추가 팀 정보들 */}
          </div>
        </div>
      </div>
    </>
  );
}