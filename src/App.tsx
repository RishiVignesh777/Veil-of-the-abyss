import React, { useEffect, useRef, useState } from 'react';
import { Game, UIState } from './core/Game';
import { GameState, Dimension } from './types/game';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { PauseMenu } from './ui/PauseMenu';
import { InventoryModal } from './ui/InventoryModal';
import { GameOverModal } from './ui/GameOverModal';
import { SaveManager } from './items/SaveManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);

  const [uiState, setUiState] = useState<UIState>({
    gameState: GameState.MENU,
    health: 100,
    maxHealth: 100,
    veilEnergy: 100,
    maxVeilEnergy: 100,
    dimension: Dimension.WAKING,
    isShifting: false,
    shards: 30,
    coins: 15,
    interactionPrompt: null,
    notice: null,
    bossInfo: null,
    recentHits: [],
    lanternActive: true
  });

  const [isMuted, setIsMuted] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new Game(canvasRef.current);
    gameRef.current = game;

    // Check existing save
    const existing = SaveManager.load();
    if (existing) setHasSaveData(true);

    // Sync Game state to React
    game.onStateChange = (state: UIState) => {
      setUiState({ ...state });
    };

    game.start();

    return () => {
      game.destroy();
    };
  }, []);

  const handleStartGame = () => {
    if (gameRef.current) {
      gameRef.current.setGameState(GameState.PLAYING);
    }
  };

  const handlePause = () => {
    if (gameRef.current) {
      gameRef.current.setGameState(GameState.PAUSED);
    }
  };

  const handleResume = () => {
    if (gameRef.current) {
      gameRef.current.setGameState(GameState.PLAYING);
    }
  };

  const handleOpenInventory = () => {
    if (gameRef.current) {
      gameRef.current.setGameState(GameState.INVENTORY);
    }
  };

  const handleCloseInventory = () => {
    if (gameRef.current) {
      gameRef.current.setGameState(GameState.PLAYING);
    }
  };

  const handleRespawn = () => {
    if (gameRef.current) {
      gameRef.current.respawnAtShrine();
    }
  };

  const handleSaveGame = () => {
    if (gameRef.current) {
      const g = gameRef.current;
      SaveManager.save(
        g.nyra,
        g.inventory,
        g.worldManager.checkpointPos,
        [],
        []
      );
      setHasSaveData(true);
      g.playerController.interactionNotice = 'Journey recorded in the cosmic memory.';
    }
  };

  const handleMainMenu = () => {
    if (gameRef.current) {
      gameRef.current.setGameState(GameState.MENU);
    }
  };

  const handleToggleMute = () => {
    if (gameRef.current) {
      const muted = gameRef.current.audioManager.toggleMute();
      setIsMuted(muted);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full block cursor-crosshair"
      />

      {/* Main Menu Screen */}
      {uiState.gameState === GameState.MENU && (
        <MainMenu
          onStartGame={handleStartGame}
          hasSaveData={hasSaveData}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game HUD (visible during PLAYING, INVENTORY, PAUSED) */}
      {uiState.gameState === GameState.PLAYING && (
        <HUD
          health={uiState.health}
          maxHealth={uiState.maxHealth}
          veilEnergy={uiState.veilEnergy}
          maxVeilEnergy={uiState.maxVeilEnergy}
          dimension={uiState.dimension}
          isShifting={uiState.isShifting}
          shards={uiState.shards}
          coins={uiState.coins}
          interactionPrompt={uiState.interactionPrompt}
          notice={uiState.notice}
          bossInfo={uiState.bossInfo}
          recentHits={uiState.recentHits}
          lanternActive={uiState.lanternActive}
          onOpenInventory={handleOpenInventory}
          onPause={handlePause}
        />
      )}

      {/* Inventory & Upgrades Modal */}
      {uiState.gameState === GameState.INVENTORY && gameRef.current && (
        <InventoryModal
          inventory={gameRef.current.inventory}
          nyra={gameRef.current.nyra}
          onClose={handleCloseInventory}
          onRefresh={() => {
            if (gameRef.current) {
              setUiState((prev) => ({
                ...prev,
                shards: gameRef.current!.inventory.shards,
                coins: gameRef.current!.inventory.coins,
                health: gameRef.current!.nyra.health,
                maxHealth: gameRef.current!.nyra.maxHealth
              }));
            }
          }}
        />
      )}

      {/* Pause Menu */}
      {uiState.gameState === GameState.PAUSED && (
        <PauseMenu
          onResume={handleResume}
          onRespawnShrine={handleRespawn}
          onSave={handleSaveGame}
          onMainMenu={handleMainMenu}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Screen */}
      {uiState.gameState === GameState.GAME_OVER && (
        <GameOverModal onRespawn={handleRespawn} />
      )}
    </div>
  );
}
