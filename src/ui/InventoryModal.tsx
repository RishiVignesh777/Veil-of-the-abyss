import React, { useState } from 'react';
import { Inventory } from '../items/Inventory';
import { Nyra } from '../player/Nyra';
import { Sparkles, Coins, Heart, Flame, Shield, Sword, Zap, CheckCircle2 } from 'lucide-react';

interface InventoryModalProps {
  inventory: Inventory;
  nyra: Nyra;
  onClose: () => void;
  onRefresh: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  nyra,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'UPGRADES' | 'ITEMS'>('UPGRADES');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleUpgradeBlade = () => {
    if (inventory.upgradeVeilblade()) {
      setFeedback('Veilblade empowered! Damage and speed enhanced.');
      onRefresh();
    } else {
      setFeedback('Insufficient Veil Shards for this empowerment.');
    }
  };

  const handleUpgradeLantern = () => {
    if (inventory.upgradeLantern()) {
      setFeedback('Grave Lantern radiated! Radius and exorcism flame increased.');
      onRefresh();
    } else {
      setFeedback('Insufficient Veil Shards for this empowerment.');
    }
  };

  const handleUpgradeVeilborn = () => {
    if (inventory.upgradeVeilborn()) {
      nyra.maxHealth = inventory.upgrades.veilborn.maxHealth;
      nyra.heal(25);
      setFeedback('Veilborn vitality expanded! Maximum health and dodge increased.');
      onRefresh();
    } else {
      setFeedback('Insufficient Veil Shards for this empowerment.');
    }
  };

  const handleConsumeHeal = () => {
    if (inventory.useHealingEssence()) {
      nyra.heal(45);
      setFeedback('Drank silverwood dew. 45 Vitality restored.');
      onRefresh();
    } else {
      setFeedback('No Healing Essence remaining.');
    }
  };

  const itemsList = Array.from(inventory.items.values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md pointer-events-auto select-none font-serif">
      <div className="relative flex flex-col w-full max-w-2xl rounded-lg border border-purple-900/80 bg-zinc-950 p-6 text-gray-200 shadow-[0_0_50px_rgba(110,30,170,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_10px_rgba(40,180,240,0.5)]">
              SANCTUM OF SHADOWS
            </h2>
            <p className="text-xs text-gray-400 font-sans">Artifacts, Relics & Veil Transmutation</p>
          </div>

          {/* Shards & Coins balances */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 rounded bg-black/60 px-3 py-1 border border-purple-800/60">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-purple-200">{inventory.shards} SHARDS</span>
            </div>
            <div className="flex items-center gap-1.5 rounded bg-black/60 px-3 py-1 border border-amber-800/60">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-amber-200">{inventory.coins} COINS</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-4 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('UPGRADES')}
            className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold tracking-wider transition cursor-pointer ${
              activeTab === 'UPGRADES'
                ? 'bg-purple-950/80 text-purple-200 border border-purple-600/70 shadow-[0_0_15px_rgba(160,80,255,0.4)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-900'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            ARTIFACT UPGRADES
          </button>
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-bold tracking-wider transition cursor-pointer ${
              activeTab === 'ITEMS'
                ? 'bg-purple-950/80 text-purple-200 border border-purple-600/70 shadow-[0_0_15px_rgba(160,80,255,0.4)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-900'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            INVENTORY & RELICS
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="mt-3 rounded border border-cyan-800/60 bg-cyan-950/40 px-3 py-1.5 text-xs text-cyan-200 font-sans">
            {feedback}
          </div>
        )}

        {/* Tab 1: Upgrades */}
        {activeTab === 'UPGRADES' && (
          <div className="mt-4 flex flex-col gap-3 font-sans">
            {/* Veilblade upgrade */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-900/80 bg-purple-950/50">
                  <Sword className="h-5 w-5 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-gray-100">THE VEILBLADE</span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-900/60">
                      TIER {inventory.upgrades.veilblade.level} / {inventory.upgrades.veilblade.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Obsidian edge infused with void flame. Multiplies physical & ethereal strike damage.
                  </p>
                  <p className="text-[11px] text-cyan-300 font-mono mt-0.5">
                    +{Math.round((inventory.upgrades.veilblade.damageMultiplier - 1) * 100)}% Damage &middot; +{Math.round((inventory.upgrades.veilblade.attackSpeedMultiplier - 1) * 100)}% Speed
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpgradeBlade}
                disabled={inventory.upgrades.veilblade.level >= inventory.upgrades.veilblade.maxLevel || inventory.shards < inventory.upgrades.veilblade.cost}
                className="flex flex-col items-center justify-center rounded border border-purple-700/80 bg-purple-950/60 px-4 py-2 font-serif text-xs font-bold text-purple-200 hover:bg-purple-900/80 hover:shadow-[0_0_15px_rgba(160,80,255,0.4)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span>EMPOWER</span>
                <span className="text-[10px] font-mono text-purple-300">{inventory.upgrades.veilblade.cost} Shards</span>
              </button>
            </div>

            {/* Lantern upgrade */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-900/80 bg-cyan-950/50">
                  <Flame className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-gray-100">THE GRAVE LANTERN</span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-900/60">
                      TIER {inventory.upgrades.lantern.level} / {inventory.upgrades.lantern.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Ancient supernatural pyre. Pierces shadowy veil defenses and uncloaks ancient mechanisms.
                  </p>
                  <p className="text-[11px] text-cyan-300 font-mono mt-0.5">
                    Radius: {inventory.upgrades.lantern.lightRadius}m &middot; Shadow Exorcism: {inventory.upgrades.lantern.shadowBurn} DPS
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpgradeLantern}
                disabled={inventory.upgrades.lantern.level >= inventory.upgrades.lantern.maxLevel || inventory.shards < inventory.upgrades.lantern.cost}
                className="flex flex-col items-center justify-center rounded border border-cyan-700/80 bg-cyan-950/60 px-4 py-2 font-serif text-xs font-bold text-cyan-200 hover:bg-cyan-900/80 hover:shadow-[0_0_15px_rgba(80,200,255,0.4)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span>IGNITE</span>
                <span className="text-[10px] font-mono text-cyan-300">{inventory.upgrades.lantern.cost} Shards</span>
              </button>
            </div>

            {/* Veilborn upgrade */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-900/80 bg-red-950/50">
                  <Heart className="h-5 w-5 text-red-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-gray-100">VEILBORN ESSENCE</span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-red-300 border border-red-900/60">
                      TIER {inventory.upgrades.veilborn.level} / {inventory.upgrades.veilborn.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Nyra's inherent resistance to corruption. Expands maximum vitality and dodge stride.
                  </p>
                  <p className="text-[11px] text-red-300 font-mono mt-0.5">
                    Max Health: {inventory.upgrades.veilborn.maxHealth} &middot; Phase Distance: {inventory.upgrades.veilborn.dodgeDistance.toFixed(1)}m
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpgradeVeilborn}
                disabled={inventory.upgrades.veilborn.level >= inventory.upgrades.veilborn.maxLevel || inventory.shards < inventory.upgrades.veilborn.cost}
                className="flex flex-col items-center justify-center rounded border border-red-700/80 bg-red-950/60 px-4 py-2 font-serif text-xs font-bold text-red-200 hover:bg-red-900/80 hover:shadow-[0_0_15px_rgba(255,80,80,0.4)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span>ASCEND</span>
                <span className="text-[10px] font-mono text-red-300">{inventory.upgrades.veilborn.cost} Shards</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory Items */}
        {activeTab === 'ITEMS' && (
          <div className="mt-4 grid grid-cols-2 gap-3 font-sans max-h-72 overflow-y-auto pr-1">
            {itemsList.map((item) => (
              <div key={item.id} className="flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-gray-200">{item.name}</span>
                    <span className="font-mono text-xs font-semibold text-cyan-300">x{item.count}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">{item.description}</p>
                  <p className="mt-1 text-[10px] italic text-gray-500 font-serif">"{item.lore}"</p>
                </div>

                {item.type === 'essence' && item.count > 0 && (
                  <button
                    onClick={handleConsumeHeal}
                    className="mt-2 w-full rounded border border-green-800/80 bg-green-950/40 py-1 text-[10px] font-bold tracking-wider text-green-300 hover:bg-green-900/60 cursor-pointer"
                  >
                    CONSUME (RESTORE 45 HP)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="rounded border border-gray-700 bg-zinc-900 px-6 py-2 font-serif text-xs font-bold tracking-widest text-gray-300 hover:border-gray-500 hover:bg-zinc-800 cursor-pointer"
          >
            RETURN [TAB]
          </button>
        </div>
      </div>
    </div>
  );
};
