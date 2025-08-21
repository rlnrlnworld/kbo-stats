import Image from 'next/image';

type Props = {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamModal({ teamId, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div 
          className={`bg-${teamId}-primary p-6 rounded-lg max-w-md w-full mx-4 relative`}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            ✕
          </button>
          
          <div className="flex justify-center mb-4">
            <Image
              src={`/team-logos/${teamId}.png`}
              alt={`${teamId} 로고`}
              width={80}
              height={80}
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