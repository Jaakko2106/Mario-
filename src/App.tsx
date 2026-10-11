/**
 * Super Mario Bros 8-Bit Retro Edition
 * Authentic NES style clone with responsive canvas scaling, precise momentum physics,
 * Web Audio chiptune synthesis, CRT scanlines, and mobile touch gamepad.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Settings, Volume2, VolumeX, Maximize2, RotateCcw, Play, Trophy } from 'lucide-react';
import { GameEngine } from './game/engine';
import { SpriteRenderer } from './game/sprites';
import { soundEngine } from './game/audio';
import { InputState, GameState } from './game/types';
import { VirtualGamepad } from './components/VirtualGamepad';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // User configurable states
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('smb_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [coins, setCoins] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(400);
  const [currentWorld, setCurrentWorld] = useState<string>('1-1');
  const [marioPower, setMarioPower] = useState<'small' | 'super' | 'fire'>('small');

  // UI & Settings states
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [crtFilter, setCrtFilter] = useState<boolean>(true);
  const [touchMode, setTouchMode] = useState<'auto' | 'always' | 'never'>('auto');
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Active inputs
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    down: false,
    up: false,
    jump: false,
    run: false,
    pause: false,
  });

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    const engine = new GameEngine();
    engine.onStateChange = (newState) => {
      setGameState(newState);
    };
    engineRef.current = engine;

    return () => {
      soundEngine.stopMusic();
    };
  }, []);

  // Save High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('smb_highscore', score.toString());
      } catch {
        // localStorage unavailable
      }
    }
  }, [score, highScore]);

  // Handle Input updates from Gamepad / Touch / Keyboard
  const updateInput = useCallback((key: keyof InputState, value: boolean) => {
    inputRef.current[key] = value;
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // First key unlocks audio context
      soundEngine.resume();

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inputRef.current.left = true;
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          inputRef.current.right = true;
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          inputRef.current.down = true;
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
        case 'KeyZ':
          inputRef.current.jump = true;
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyX':
        case 'KeyJ':
          inputRef.current.run = true;
          e.preventDefault();
          break;
        case 'KeyP':
        case 'Escape':
          togglePause();
          e.preventDefault();
          break;
        case 'Enter':
          if (engineRef.current?.state === 'TITLE') {
            startGame();
          } else if (engineRef.current?.state === 'GAME_OVER' || engineRef.current?.state === 'VICTORY') {
            startGame();
          }
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inputRef.current.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          inputRef.current.right = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          inputRef.current.down = false;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
        case 'KeyZ':
          inputRef.current.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyX':
        case 'KeyJ':
          inputRef.current.run = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Physical Gamepad API polling loop
  useEffect(() => {
    let gpAnimId: number;
    const pollGamepad = () => {
      if (typeof navigator.getGamepads === 'function') {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0];
        if (gp) {
          // D-Pad or Left Stick
          const leftStickX = gp.axes[0] || 0;
          const leftStickY = gp.axes[1] || 0;
          const dpadLeft = gp.buttons[14]?.pressed || leftStickX < -0.4;
          const dpadRight = gp.buttons[15]?.pressed || leftStickX > 0.4;
          const dpadDown = gp.buttons[13]?.pressed || leftStickY > 0.4;

          inputRef.current.left = dpadLeft;
          inputRef.current.right = dpadRight;
          inputRef.current.down = dpadDown;

          // A button (index 0) or B button (index 1 / X button index 2)
          inputRef.current.jump = gp.buttons[0]?.pressed || gp.buttons[1]?.pressed;
          inputRef.current.run = gp.buttons[2]?.pressed || gp.buttons[3]?.pressed;

          // Start / Pause (index 9)
          if (gp.buttons[9]?.pressed) {
            togglePause();
          }
        }
      }
      gpAnimId = requestAnimationFrame(pollGamepad);
    };
    gpAnimId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(gpAnimId);
  }, []);

  // Start Game Handler
  const startGame = (world: string = '1-1') => {
    soundEngine.resume();
    if (engineRef.current) {
      engineRef.current.startGame(world);
      setGameState('PLAYING');
      setCurrentWorld(world);
    }
  };

  const togglePause = () => {
    soundEngine.resume();
    if (!engineRef.current) return;
    if (engineRef.current.state === 'PLAYING') {
      engineRef.current.state = 'PAUSED';
      soundEngine.stopMusic();
      setGameState('PAUSED');
    } else if (engineRef.current.state === 'PAUSED') {
      engineRef.current.state = 'PLAYING';
      soundEngine.playMusic(engineRef.current.level.theme);
      setGameState('PLAYING');
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMute(nextMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Main Canvas Render Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const render = () => {
      const engine = engineRef.current;
      if (!engine) return;

      // Update engine physics
      engine.update(inputRef.current);

      // Sync React state for HUD
      setScore(engine.score);
      setCoins(engine.coins);
      setLives(engine.lives);
      setTimeLeft(engine.timeLeft);
      setCurrentWorld(engine.currentWorld);
      setMarioPower(engine.mario.power);

      // --- Draw Canvas ---
      // 1. Background sky/cavern
      ctx.fillStyle = engine.level.bgColor;
      ctx.fillRect(0, 0, 256, 240);

      // 2. Castle Lava animation (if in castle)
      if (engine.level.theme === 'castle') {
        ctx.fillStyle = '#b82000';
        ctx.fillRect(0, 208, 256, 32);
        // Lava bubbles
        ctx.fillStyle = '#fcb040';
        for (let bx = 0; bx < 256; bx += 16) {
          const wave = Math.sin((engine.globalAnimTimer / 10) + bx) * 2;
          ctx.fillRect(bx, 206 + wave, 12, 4);
        }
      }

      // Save transform for camera offset
      ctx.save();
      ctx.translate(-Math.round(engine.cameraX), 0);

      // 3. Render Scenery (clouds, hills, bushes, castle)
      for (const sc of engine.level.scenery) {
        if (sc.x + 120 >= engine.cameraX && sc.x - 40 <= engine.cameraX + 256) {
          SpriteRenderer.renderScenery(ctx, sc);
        }
      }

      // 4. Render Blocks (ground, bricks, ? blocks, pipes)
      for (const block of engine.blocks) {
        if (block.x + 16 >= engine.cameraX && block.x <= engine.cameraX + 256) {
          SpriteRenderer.renderBlock(ctx, block, engine.level.theme, engine.globalAnimTimer);
        }
      }

      // 5. Render Flag on flagpole
      if (engine.level.flagpoleX) {
        const flagY = engine.mario.flagpoleSlide ? engine.mario.y - 4 : engine.level.flagpoleY;
        ctx.fillStyle = '#58d838';
        ctx.beginPath();
        ctx.moveTo(engine.level.flagpoleX - 12, flagY + 2);
        ctx.lineTo(engine.level.flagpoleX, flagY + 8);
        ctx.lineTo(engine.level.flagpoleX - 12, flagY + 14);
        ctx.fill();
      }

      // 6. Render Items (mushrooms, fire flowers, coins)
      for (const item of engine.items) {
        if (item.x + 16 >= engine.cameraX && item.x <= engine.cameraX + 256) {
          SpriteRenderer.renderItem(ctx, item);
        }
      }

      // 7. Render Enemies (Goombas, Koopas, Bowser, Piranhas)
      for (const enemy of engine.enemies) {
        if (enemy.x + enemy.width >= engine.cameraX && enemy.x <= engine.cameraX + 256) {
          SpriteRenderer.renderEnemy(ctx, enemy);
        }
      }

      // 8. Render Projectiles
      for (const fb of engine.fireballs) {
        SpriteRenderer.renderFireball(ctx, fb);
      }
      for (const bf of engine.bowserFires) {
        SpriteRenderer.renderBowserFire(ctx, bf);
      }

      // 9. Render Mario
      SpriteRenderer.renderMario(ctx, engine.mario);

      // 10. Render Particles & Floating Scores
      for (const p of engine.particles) {
        SpriteRenderer.renderParticle(ctx, p);
      }

      ctx.restore();

      // --- Draw Authentic 8-Bit NES HUD on top of screen ---
      drawNesHud(ctx, engine);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Authentic NES HUD Drawing function
  const drawNesHud = (ctx: CanvasRenderingContext2D, engine: GameEngine) => {
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';

    // Column 1: MARIO & SCORE
    ctx.fillText('MARIO', 16, 16);
    const scoreStr = engine.score.toString().padStart(6, '0');
    ctx.fillText(scoreStr, 16, 26);

    // Column 2: COINS
    // Animated coin icon
    SpriteRenderer.drawSpinningCoin(ctx, Math.floor(engine.globalAnimTimer / 12));
    ctx.fillText(`x${engine.coins.toString().padStart(2, '0')}`, 92, 26);

    // Column 3: WORLD
    ctx.fillText('WORLD', 144, 16);
    ctx.fillText(engine.currentWorld, 152, 26);

    // Column 4: TIME
    ctx.fillText('TIME', 208, 16);
    const timeStr = engine.timeLeft.toString().padStart(3, '0');
    ctx.fillText(timeStr, 212, 26);

    ctx.restore();
  };

  const showTouchGamepad =
    touchMode === 'always' || (touchMode === 'auto' && isTouchDevice);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-between items-center text-white select-none">
      {/* Top Bar: Clean Three-Zone Contract */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-8 px-6 py-3 border-b border-neutral-800">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="font-pixel text-xs sm:text-sm text-red-500 tracking-wider">
            SUPER MARIO BROS.
          </span>
          <span className="hidden sm:inline font-pixel text-[9px] text-amber-400">
            8-BIT
          </span>
        </div>

        {/* Zone 2: Navigation & Status */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-pixel text-[10px]">HI: {highScore.toString().padStart(6, '0')}</span>
          </div>
          <span className="font-pixel text-[10px] text-neutral-300">LIVES: {lives}</span>
          <span className="font-pixel text-[10px] text-neutral-300">STAGE: {currentWorld}</span>
          <span className={`font-pixel text-[10px] ${
            marioPower === 'fire' ? 'text-red-400' : marioPower === 'super' ? 'text-amber-400' : 'text-neutral-400'
          }`}>
            POWER: {marioPower.toUpperCase()}
          </span>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleMute}
            className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={() => setCrtFilter(!crtFilter)}
            className={`px-2.5 py-1.5 rounded font-pixel text-[9px] border transition-colors ${
              crtFilter
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-neutral-700 text-neutral-400 bg-neutral-900'
            }`}
            title="Toggle CRT Scanline Effect"
          >
            CRT
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Settings & Level Select"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Arcade Cabinet Centerpiece */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-5xl">
        <div className="relative w-full max-w-3xl aspect-[256/240] max-h-[70vh] bg-black rounded-lg border-4 border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center">
          {/* CRT Overlay Effect */}
          <div className={`absolute inset-0 pointer-events-none z-20 ${crtFilter ? 'crt-overlay' : ''}`} />

          {/* Canvas Screen */}
          <canvas
            ref={canvasRef}
            width={256}
            height={240}
            className="w-full h-full pixelated block object-contain"
          />

          {/* TITLE SCREEN OVERLAY */}
          {gameState === 'TITLE' && (
            <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4">
                <h1 className="font-pixel text-xl sm:text-2xl text-red-500 drop-shadow-[3px_3px_0px_#000] tracking-wide mb-2">
                  SUPER MARIO BROS.
                </h1>
                <p className="font-pixel text-[10px] text-amber-400">
                  © 1985 NINTENDO HOMAGE
                </p>
              </div>

              {/* High Score */}
              <div className="mb-6 flex items-center gap-2 font-pixel text-xs text-neutral-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>TOP - {highScore.toString().padStart(6, '0')}</span>
              </div>

              {/* Start Buttons */}
              <div className="flex flex-col gap-3 w-full max-w-xs mb-6">
                <button
                  onClick={() => startGame('1-1')}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-pixel text-xs rounded border-2 border-red-800 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>START 1 PLAYER GAME</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => startGame('1-2')}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 font-pixel text-[9px] text-neutral-300 rounded border border-neutral-600 transition-colors"
                  >
                    WARP 1-2
                  </button>
                  <button
                    onClick={() => startGame('1-4')}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 font-pixel text-[9px] text-neutral-300 rounded border border-neutral-600 transition-colors"
                  >
                    CASTLE 1-4
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="font-pixel text-[9px] text-neutral-400 leading-relaxed max-w-sm space-y-1">
                <div>[ARROWS/WASD] WALK · [DOWN] DUCK/WARP</div>
                <div>[SPACE/Z] JUMP · [SHIFT/X] RUN & FIREBALL</div>
                <div className="text-amber-400">🍄 MUSHROOM: GROW & BREAK BRICKS</div>
                <div className="text-red-400">🔥 FLOWER: SHOOT BOUNCING FIREBALLS</div>
              </div>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <h2 className="font-pixel text-2xl text-amber-400 mb-6 drop-shadow-[2px_2px_0_#000]">
                PAUSED
              </h2>
              <div className="flex flex-col gap-3 w-48 font-pixel text-xs">
                <button
                  onClick={togglePause}
                  className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded shadow transition-transform active:scale-95"
                >
                  CONTINUE
                </button>
                <button
                  onClick={() => startGame(currentWorld)}
                  className="py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-600 transition-colors"
                >
                  RETRY
                </button>
              </div>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <h2 className="font-pixel text-2xl sm:text-3xl text-red-600 mb-4 drop-shadow-[3px_3px_0_#000]">
                GAME OVER
              </h2>
              <p className="font-pixel text-xs text-neutral-300 mb-2">
                FINAL SCORE: {score.toString().padStart(6, '0')}
              </p>
              <p className="font-pixel text-[10px] text-amber-400 mb-6">
                BEST: {highScore.toString().padStart(6, '0')}
              </p>
              <button
                onClick={() => startGame('1-1')}
                className="py-3 px-6 bg-red-600 hover:bg-red-500 font-pixel text-xs text-white rounded border-2 border-red-800 shadow-xl active:scale-95 transition-all"
              >
                PLAY AGAIN
              </button>
            </div>
          )}

          {/* VICTORY OVERLAY (WORLD 1-4 CLEAR) */}
          {gameState === 'VICTORY' && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center">
              <h2 className="font-pixel text-xl sm:text-2xl text-amber-400 mb-3 drop-shadow-[2px_2px_0_#000]">
                THANK YOU MARIO!
              </h2>
              <p className="font-pixel text-[11px] text-white mb-2">
                YOUR QUEST IS COMPLETE!
              </p>
              <p className="font-pixel text-xs text-amber-300 mb-6">
                TOTAL SCORE: {score.toString().padStart(6, '0')}
              </p>
              <button
                onClick={() => startGame('1-1')}
                className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-pixel text-xs rounded border-2 border-amber-600 shadow-xl active:scale-95 transition-all"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Section: Virtual Gamepad for Touch Screens or Quick Keyboard Hint */}
      <footer className="w-full max-w-4xl px-4 py-2 flex flex-col items-center">
        {showTouchGamepad ? (
          <VirtualGamepad
            input={inputRef.current}
            onUpdateInput={updateInput}
            onTogglePause={togglePause}
            isPaused={gameState === 'PAUSED'}
          />
        ) : (
          <div className="hidden sm:flex items-center gap-6 py-2 text-xs text-neutral-500 font-sans">
            <div><span className="text-neutral-400 font-pixel text-[10px]">A / D / ◄ ►</span> Walk</div>
            <div><span className="text-neutral-400 font-pixel text-[10px]">S / ▼</span> Duck / Warp</div>
            <div><span className="text-neutral-400 font-pixel text-[10px]">SPACE / Z</span> Jump</div>
            <div><span className="text-neutral-400 font-pixel text-[10px]">SHIFT / X</span> Sprint / Fireball</div>
            <div><span className="text-neutral-400 font-pixel text-[10px]">P / ESC</span> Pause</div>
          </div>
        )}
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        crtFilter={crtFilter}
        onToggleCrt={() => setCrtFilter(!crtFilter)}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        touchControlMode={touchMode}
        onChangeTouchMode={setTouchMode}
        onSelectLevel={(lvl) => startGame(lvl)}
        onResetGame={() => startGame(currentWorld)}
        currentWorld={currentWorld}
      />
    </div>
  );
}
