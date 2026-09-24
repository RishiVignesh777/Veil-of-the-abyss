import React from 'react';
import { Volume2, VolumeX, RotateCcw, Play, Home, Save } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRespawnShrine: () => void;
  onSave: () => void;
  onMainMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRespawnShrine,
  onSave,
  onMainMenu,
  isMuted,
  onToggleMute
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md pointer-events-auto select-none font-serif">
      <div className="relative w-full max-w-sm rounded-lg border border-purple-900/80 bg-zinc-950 p-8 text-center text-gray-200 shadow-[0_0_50px_rgba(100,30,160,0.6)]">
        <h2 className="text-2xl font-extrabold tracking-widest text-cyan-300 drop-shadow-[0_0_15px_rgba(40,180,240,0.6)]">
          PAUSED
        </h2>
        <p className="mt-1 text-xs text-gray-400 font-sans tracking-wide">
          Veil of the Abyss
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded border border-cyan-600/80 bg-cyan-950/40 py-2.5 text-xs font-bold tracking-widest text-cyan-200 transition hover:bg-cyan-900/60 hover:shadow-[0_0_15px_rgba(40,180,240,0.4)] cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            RESUME JOURNEY
          </button>

          <button
            onClick={onRespawnShrine}
            className="flex items-center justify-center gap-2 rounded border border-gray-800 bg-zinc-900 py-2.5 text-xs font-semibold tracking-wider text-gray-300 transition hover:border-gray-600 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-purple-400" />
            RETURN TO VEIL SHRINE
          </button>

          <button
            onClick={onSave}
            className="flex items-center justify-center gap-2 rounded border border-gray-800 bg-zinc-900 py-2.5 text-xs font-semibold tracking-wider text-gray-300 transition hover:border-gray-600 hover:text-white cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 text-amber-400" />
            RECORD MEMORIES (SAVE)
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 rounded border border-gray-800 bg-zinc-900 py-2.5 text-xs font-semibold tracking-wider text-gray-300 transition hover:border-gray-600 hover:text-white cursor-pointer"
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
            {isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 rounded border border-red-950/60 bg-red-950/20 py-2.5 text-xs font-semibold tracking-wider text-red-300 transition hover:bg-red-950/40 hover:border-red-800 cursor-pointer mt-2"
          >
            <Home className="h-3.5 w-3.5" />
            MAIN TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
