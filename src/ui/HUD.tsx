import React from 'react';
import { Dimension, BossInfo, CombatHit } from '../types/game';
import { Flame, Sparkles, Coins, Zap } from 'lucide-react';

interface HUDProps {
  health: number;
  maxHealth: number;
  veilEnergy: number;
  maxVeilEnergy: number;
  dimension: Dimension;
  isShifting: boolean;
  shards: number;
  coins: number;
  interactionPrompt: { key: string; title: string; action: string } | null;
  notice: string | null;
  bossInfo: BossInfo | null;
  recentHits: CombatHit[];
  lanternActive: boolean;
  onOpenInventory: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  veilEnergy,
  maxVeilEnergy,
  dimension,
  isShifting,
  shards,
  coins,
  interactionPrompt,
  notice,
  bossInfo,
  recentHits,
  lanternActive,
  onOpenInventory,
  onPause
}) => {
  const isVeil = dimension === Dimension.VEIL;
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const veilPercent = Math.max(0, Math.min(100, (veilEnergy / maxVeilEnergy) * 100));

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* Dimensional Shift Fullscreen Glitch/Flash */}
      {isShifting && (
        <div className="pointer-events-none absolute inset-0 z-50 bg-purple-950/60 backdrop-invert animate-pulse transition-all duration-300" />
      )}

      {/* Screen Vignette */}
      <div
        className={`pointer-events-none absolute inset-0 transition-colors duration-700 ${
          isVeil
            ? 'shadow-[inset_0_0_120px_rgba(75,15,110,0.6)]'
            : 'shadow-[inset_0_0_100px_rgba(5,10,18,0.7)]'
        }`}
      />

      {/* Top Left: Health & Status Orbs */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        {/* Health Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-950 bg-black/80 shadow-[0_0_15px_rgba(180,20,30,0.5)]">
            <span className="font-serif text-xs font-bold text-red-300">HP</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-xs tracking-widest text-red-200/80 font-serif">
              <span>VITALITY</span>
              <span>{Math.round(health)} / {maxHealth}</span>
            </div>
            <div className="relative h-3.5 w-64 overflow-hidden rounded border border-red-900/60 bg-black/70">
              <div
                className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-400 transition-all duration-200 shadow-[0_0_10px_rgba(230,40,50,0.8)]"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Veil Energy Bar */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-[11px] tracking-widest text-cyan-200/80 font-serif">
              <span>VEIL RESONANCE</span>
              <span>{Math.round(veilEnergy)}%</span>
            </div>
            <div className="relative h-2.5 w-52 overflow-hidden rounded border border-cyan-900/60 bg-black/70">
              <div
                className={`h-full transition-all duration-300 ${
                  isVeil
                    ? 'bg-gradient-to-r from-purple-800 via-purple-500 to-cyan-300 shadow-[0_0_10px_rgba(160,80,255,0.9)]'
                    : 'bg-gradient-to-r from-cyan-900 via-cyan-600 to-blue-400 shadow-[0_0_8px_rgba(60,180,255,0.7)]'
                }`}
                style={{ width: `${veilPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Currency / Shard counters */}
        <div className="flex items-center gap-4 pt-1 font-serif text-xs text-gray-300">
          <div className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 border border-purple-900/40">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-semibold text-purple-200">{shards} Shards</span>
          </div>
          <div className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 border border-amber-900/40">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-amber-200">{coins} Coins</span>
          </div>
        </div>
      </div>

      {/* Top Center: Imposing Boss Health Bar */}
      {bossInfo && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center w-full max-w-lg animate-fade-in">
          <div className="text-center font-serif tracking-widest">
            <h2 className="text-lg font-bold text-red-100 uppercase drop-shadow-[0_0_8px_rgba(200,30,40,0.8)]">
              {bossInfo.name}
            </h2>
            <p className="text-[11px] text-gray-400 tracking-widest">{bossInfo.title}</p>
          </div>
          <div className="relative mt-1.5 h-3.5 w-full overflow-hidden rounded border border-red-800/80 bg-black/80 shadow-[0_0_20px_rgba(180,20,30,0.7)]">
            <div
              className="h-full bg-gradient-to-r from-red-950 via-red-600 to-orange-400 transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, (bossInfo.currentHealth / bossInfo.maxHealth) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Top Right: Utility Buttons (Pointer events active) */}
      <div className="pointer-events-auto absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={onOpenInventory}
          className="flex items-center gap-1.5 rounded border border-gray-700 bg-black/75 px-3 py-1.5 font-serif text-xs font-semibold text-gray-300 transition hover:border-cyan-500 hover:text-cyan-300 hover:bg-black/90 cursor-pointer shadow-lg"
        >
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span>INVENTORY [TAB]</span>
        </button>
        <button
          onClick={onPause}
          className="flex items-center gap-1.5 rounded border border-gray-700 bg-black/75 px-3 py-1.5 font-serif text-xs font-semibold text-gray-300 transition hover:border-gray-400 hover:text-white hover:bg-black/90 cursor-pointer shadow-lg"
        >
          <span>MENU [ESC]</span>
        </button>
      </div>

      {/* Center: Interaction Prompts */}
      {interactionPrompt && (
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
          <div className="flex items-center gap-2 rounded-lg border border-cyan-500/60 bg-black/85 px-4 py-2 text-center shadow-[0_0_20px_rgba(40,180,240,0.4)]">
            <span className="flex h-6 w-6 items-center justify-center rounded border border-cyan-400 bg-cyan-950/80 font-mono text-xs font-bold text-cyan-200">
              {interactionPrompt.key}
            </span>
            <div className="text-left font-serif">
              <div className="text-xs font-semibold text-gray-200">{interactionPrompt.title}</div>
              <div className="text-[11px] text-cyan-300">{interactionPrompt.action}</div>
            </div>
          </div>
        </div>
      )}

      {/* Center Top: World Notices */}
      {notice && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 max-w-md rounded border border-purple-500/50 bg-black/90 px-4 py-2 text-center font-serif text-xs text-purple-200 shadow-[0_0_15px_rgba(160,80,255,0.3)] animate-pulse">
          {notice}
        </div>
      )}

      {/* Bottom Center: Dimension Switcher Status */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center font-serif">
        <div
          className={`flex items-center gap-2.5 rounded-full px-5 py-1.5 border transition-all duration-500 ${
            isVeil
              ? 'border-purple-500/80 bg-purple-950/80 text-purple-200 shadow-[0_0_25px_rgba(180,60,255,0.7)]'
              : 'border-slate-600 bg-slate-950/80 text-slate-300 shadow-[0_0_15px_rgba(60,90,140,0.5)]'
          }`}
        >
          <div
            className={`h-2.5 w-2.5 rounded-full animate-ping ${
              isVeil ? 'bg-purple-400' : 'bg-cyan-400'
            }`}
          />
          <span className="text-xs font-bold tracking-widest uppercase">
            {isVeil ? 'THE VEIL' : 'THE WAKING WORLD'}
          </span>
          <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-gray-400 border border-gray-700">
            [Q] SHIFT
          </span>
        </div>
      </div>

      {/* Bottom Right: Weapon & Lantern Status */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3">
        {/* Grave Lantern Status */}
        <div
          className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2 transition-all ${
            lanternActive
              ? 'border-cyan-500/70 bg-black/80 shadow-[0_0_15px_rgba(80,200,255,0.5)]'
              : 'border-gray-800 bg-black/60 opacity-60'
          }`}
        >
          <Flame
            className={`h-5 w-5 ${lanternActive ? 'text-cyan-400' : 'text-gray-500'}`}
          />
          <span className="mt-1 font-serif text-[10px] tracking-wider text-cyan-200">
            LANTERN [RMB]
          </span>
        </div>

        {/* Veilblade Card */}
        <div className="flex flex-col rounded-lg border border-purple-900/60 bg-black/85 px-4 py-2 font-serif text-right shadow-[0_0_15px_rgba(80,20,120,0.5)]">
          <span className="text-[10px] tracking-widest text-purple-400">EQUIPPED BLADE</span>
          <span className="text-sm font-bold text-gray-100 tracking-wider">THE VEILBLADE</span>
          <span className="text-[10px] text-gray-400 font-sans">[LMB] Light &middot; [Hold] Heavy</span>
        </div>
      </div>

      {/* Floating Damage Text Popup over Canvas */}
      {recentHits.map((hit) => (
        <div
          key={hit.timestamp}
          className={`pointer-events-none absolute font-mono font-bold transition-all duration-700 animate-bounce ${
            hit.isCrit ? 'text-cyan-300 text-lg shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-red-400 text-sm'
          }`}
          style={{
            top: '42%',
            left: `${50 + (Math.sin(hit.timestamp) * 8)}%`
          }}
        >
          -{hit.damage}
        </div>
      ))}
    </div>
  );
};
