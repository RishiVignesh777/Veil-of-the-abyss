import React from 'react';
import { RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  onRespawn: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRespawn }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 select-none font-serif animate-fade-in pointer-events-auto">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-red-600 to-transparent mb-6 animate-pulse" />
        <h1 className="text-4xl md:text-5xl font-black tracking-[0.25em] text-red-600 drop-shadow-[0_0_25px_rgba(220,20,30,0.8)]">
          THE VEIL CLAIMS YOU
        </h1>
        <p className="mt-4 text-xs font-sans text-gray-400 leading-relaxed tracking-wider">
          Your physical form dissolves into the infinite abyss. But the Grave Lantern's ember still whispers from the sacred shrine.
        </p>

        <button
          onClick={onRespawn}
          className="mt-8 flex items-center gap-2 rounded border border-red-800/80 bg-red-950/40 px-8 py-3 text-xs font-bold tracking-widest text-red-200 transition-all hover:bg-red-900/60 hover:border-red-600 hover:shadow-[0_0_25px_rgba(200,30,40,0.6)] cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          COMMUNE & RESPAWN AT SHRINE
        </button>
      </div>
    </div>
  );
};
