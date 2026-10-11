/**
 * Retro Settings & Level Select Modal
 */

import React from 'react';
import { Volume2, VolumeX, Monitor, Gamepad2, X, RotateCcw } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  crtFilter: boolean;
  onToggleCrt: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  touchControlMode: 'auto' | 'always' | 'never';
  onChangeTouchMode: (mode: 'auto' | 'always' | 'never') => void;
  onSelectLevel: (world: string) => void;
  onResetGame: () => void;
  currentWorld: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  crtFilter,
  onToggleCrt,
  isMuted,
  onToggleMute,
  touchControlMode,
  onChangeTouchMode,
  onSelectLevel,
  onResetGame,
  currentWorld,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border-2 border-neutral-700 rounded-lg p-6 text-white shadow-2xl relative font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h2 className="font-pixel text-sm tracking-wide text-amber-400">
            GAME SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5">
          {/* Audio Setting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isMuted ? <VolumeX className="w-5 h-5 text-neutral-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
              <div>
                <div className="text-sm font-medium">8-Bit Chiptune Audio</div>
                <div className="text-xs text-neutral-400">Authentic NES sound synthesizer</div>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.resume();
                onToggleMute();
              }}
              className={`px-3 py-1.5 text-xs font-pixel rounded transition-colors ${
                !isMuted ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {!isMuted ? 'ON' : 'MUTED'}
            </button>
          </div>

          {/* CRT Scanline Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-medium">CRT Retro Display</div>
                <div className="text-xs text-neutral-400">Scanlines and vintage arcade vignette</div>
              </div>
            </div>
            <button
              onClick={onToggleCrt}
              className={`px-3 py-1.5 text-xs font-pixel rounded transition-colors ${
                crtFilter ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {crtFilter ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Touch Controls Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-medium">Touch Gamepad</div>
                <div className="text-xs text-neutral-400">On-screen D-Pad and B/A buttons</div>
              </div>
            </div>
            <div className="flex gap-1 bg-neutral-800 p-1 rounded">
              {(['auto', 'always', 'never'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChangeTouchMode(mode)}
                  className={`px-2 py-1 text-[11px] rounded transition-colors uppercase ${
                    touchControlMode === mode
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Level Warp Selector */}
          <div>
            <div className="text-xs font-pixel text-neutral-400 mb-2 uppercase">Warp Zone (Level Select)</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '1-1', label: '1-1 Overworld' },
                { id: '1-2', label: '1-2 Underground' },
                { id: '1-4', label: '1-4 Castle' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    onSelectLevel(lvl.id);
                    onClose();
                  }}
                  className={`py-2 px-2 text-center text-xs font-pixel rounded border transition-colors ${
                    currentWorld === lvl.id
                      ? 'border-amber-400 bg-amber-500/10 text-amber-400'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Controls Guide */}
          <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-xs">
            <div className="font-pixel text-[10px] text-amber-400 mb-2 uppercase">Controls Guide</div>
            <div className="grid grid-cols-2 gap-y-1.5 text-neutral-300">
              <div><span className="text-neutral-500">Walk:</span> Arrow Keys / A, D</div>
              <div><span className="text-neutral-500">Crouch / Warp:</span> Down / S</div>
              <div><span className="text-neutral-500">Jump:</span> Space / Z / Up / W</div>
              <div><span className="text-neutral-500">Sprint / Fire:</span> Shift / X</div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-neutral-900 grid grid-cols-1 gap-1 text-[11px] text-neutral-400">
              <div><span className="text-amber-400 font-pixel text-[9px]">🍄 MUSHROOM:</span> Grow & break brick blocks</div>
              <div><span className="text-red-400 font-pixel text-[9px]">🔥 FLOWER:</span> Shoot bouncing fireballs with Shift/X</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
          <button
            onClick={() => {
              onResetGame();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Game</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold font-pixel text-xs rounded transition-colors"
          >
            RESUME
          </button>
        </div>
      </div>
    </div>
  );
};
