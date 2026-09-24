import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Sparkles, BookOpen, Compass } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  hasSaveData: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  hasSaveData,
  isMuted,
  onToggleMute
}) => {
  const [activeModal, setActiveModal] = useState<'NONE' | 'CONTROLS' | 'LORE'>('NONE');

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-12 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-auto select-none font-serif">
      {/* Title Section */}
      <div className="flex flex-col items-start pt-8">
        <div className="flex items-center gap-2 text-xs tracking-[0.35em] text-cyan-400 font-mono">
          <Sparkles className="h-3.5 w-3.5" />
          <span>A 3D DARK FANTASY ODYSSEY</span>
        </div>
        <h1 className="mt-2 text-5xl md:text-7xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-gray-100 via-gray-300 to-purple-400 drop-shadow-[0_0_35px_rgba(160,80,255,0.6)]">
          VEIL OF THE ABYSS
        </h1>
        <p className="mt-3 max-w-lg text-sm text-gray-400 leading-relaxed font-sans">
          Traverse between the Waking World and the ethereal Veil. Unravel the supernatural blight of The Hollow, ignite the Grave Lantern, and forge your passage through corrupted ruins.
        </p>
      </div>

      {/* Menu Options */}
      <div className="flex flex-col gap-3.5 max-w-xs z-20 pb-8">
        <button
          onClick={onStartGame}
          className="group relative flex items-center justify-between overflow-hidden rounded border border-purple-800/80 bg-black/80 px-6 py-3.5 text-sm font-bold tracking-widest text-gray-200 transition-all duration-300 hover:border-cyan-400 hover:text-cyan-200 hover:bg-purple-950/40 hover:shadow-[0_0_20px_rgba(80,200,255,0.4)] cursor-pointer"
        >
          <span>{hasSaveData ? 'CONTINUE JOURNEY' : 'NEW JOURNEY'}</span>
          <span className="text-xs text-purple-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
        </button>

        <button
          onClick={() => setActiveModal('CONTROLS')}
          className="flex items-center justify-between rounded border border-gray-800 bg-black/70 px-6 py-3 text-xs font-semibold tracking-wider text-gray-400 transition hover:border-gray-500 hover:text-gray-200 hover:bg-black/90 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            CONTROLS & SHORTCUTS
          </span>
        </button>

        <button
          onClick={() => setActiveModal('LORE')}
          className="flex items-center justify-between rounded border border-gray-800 bg-black/70 px-6 py-3 text-xs font-semibold tracking-wider text-gray-400 transition hover:border-gray-500 hover:text-gray-200 hover:bg-black/90 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-400" />
            LORE & MYTHOLOGY
          </span>
        </button>

        <button
          onClick={onToggleMute}
          className="flex items-center justify-between rounded border border-gray-800 bg-black/70 px-6 py-2.5 text-xs font-semibold tracking-wider text-gray-400 transition hover:border-gray-500 hover:text-gray-200 hover:bg-black/90 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
            {isMuted ? 'AUDIO: MUTED' : 'AUDIO: ATMOSPHERIC'}
          </span>
        </button>
      </div>

      {/* Controls Modal */}
      {activeModal === 'CONTROLS' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg border border-purple-900/80 bg-zinc-950 p-6 text-gray-200 shadow-[0_0_40px_rgba(120,40,180,0.5)]">
            <h2 className="text-xl font-bold tracking-widest text-cyan-300 pb-3 border-b border-gray-800">
              CONTROLS & MECHANICS
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-sans">
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Movement</span>
                <span className="font-mono font-bold text-cyan-300">W / A / S / D</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Camera</span>
                <span className="font-mono font-bold text-cyan-300">Mouse Look</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Dimension Shift</span>
                <span className="font-mono font-bold text-purple-400">[Q]</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Light / Combo Attack</span>
                <span className="font-mono font-bold text-cyan-300">Left Click</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Heavy Slash</span>
                <span className="font-mono font-bold text-cyan-300">Hold Left Click</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Grave Lantern Focus</span>
                <span className="font-mono font-bold text-cyan-300">Right Click</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Dodge (I-Frames)</span>
                <span className="font-mono font-bold text-cyan-300">CTRL / C</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Jump</span>
                <span className="font-mono font-bold text-cyan-300">Space</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Sprint</span>
                <span className="font-mono font-bold text-cyan-300">Shift</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Interact / Shrine</span>
                <span className="font-mono font-bold text-cyan-300">[E]</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Inventory & Relics</span>
                <span className="font-mono font-bold text-cyan-300">[TAB] / [I]</span>
              </div>
              <div className="flex items-center justify-between rounded bg-zinc-900/90 p-2.5 border border-zinc-800">
                <span className="text-gray-400">Pause Menu</span>
                <span className="font-mono font-bold text-cyan-300">[ESC]</span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal('NONE')}
              className="mt-6 w-full rounded border border-gray-700 bg-zinc-900 py-2 text-xs font-bold tracking-widest text-gray-300 hover:border-gray-500 hover:bg-zinc-800 cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Lore Modal */}
      {activeModal === 'LORE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg border border-purple-900/80 bg-zinc-950 p-6 text-gray-200 shadow-[0_0_40px_rgba(120,40,180,0.5)]">
            <h2 className="text-xl font-bold tracking-widest text-purple-300 pb-3 border-b border-gray-800">
              CHRONICLES OF THE HOLLOW
            </h2>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-gray-300 font-sans max-h-72 overflow-y-auto pr-2">
              <p>
                <strong className="text-cyan-300">The Dual Realm:</strong> Long before the silence fell, the mortal Waking World and the ethereal Veil existed in fragile harmony. But when the cosmic seal cracked, The Hollow bled across the threshold.
              </p>
              <p>
                <strong className="text-cyan-300">Nyra:</strong> Neither mortal nor wraith, Nyra was born upon the boundary rift. Bearing the pale porcelain mask and an arm bound to living shadow, she carries the Grave Lantern—a celestial relic capable of illuminating hidden truths and dispelling phantom corruptions.
              </p>
              <p>
                <strong className="text-cyan-300">Dimensional Shift:</strong> Pressing [Q] lets you shift between realities. What is shattered stone in the Waking World may form a bridge of ancient bone in the Veil. But beware: creatures of darkness thrive in the abyss.
              </p>
            </div>
            <button
              onClick={() => setActiveModal('NONE')}
              className="mt-6 w-full rounded border border-gray-700 bg-zinc-900 py-2 text-xs font-bold tracking-widest text-gray-300 hover:border-gray-500 hover:bg-zinc-800 cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
