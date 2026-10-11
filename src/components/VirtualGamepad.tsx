/**
 * Virtual Retro NES Gamepad for Mobile / Touch Screens
 * Handles multi-touch simultaneous input for D-Pad, B (Run/Fire), and A (Jump).
 */

import React, { useRef } from 'react';
import { InputState } from '../game/types';

interface VirtualGamepadProps {
  input: InputState;
  onUpdateInput: (key: keyof InputState, value: boolean) => void;
  onTogglePause: () => void;
  isPaused: boolean;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onUpdateInput,
  onTogglePause,
  isPaused,
}) => {
  const dpadRef = useRef<HTMLDivElement>(null);

  // Handle D-pad directional drag / touch
  const handleDpadTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!dpadRef.current) return;
    const rect = dpadRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;

    const relX = touch.clientX - (rect.left + rect.width / 2);
    const relY = touch.clientY - (rect.top + rect.height / 2);

    const deadzone = 12;
    const isLeft = relX < -deadzone;
    const isRight = relX > deadzone;
    const isDown = relY > deadzone && Math.abs(relY) > Math.abs(relX);

    onUpdateInput('left', isLeft);
    onUpdateInput('right', isRight);
    onUpdateInput('down', isDown);
  };

  const handleDpadEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onUpdateInput('left', false);
    onUpdateInput('right', false);
    onUpdateInput('down', false);
  };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-2 select-none pointer-events-auto touch-none">
      {/* Left: Classic Cross D-Pad */}
      <div className="flex flex-col items-center">
        <div
          ref={dpadRef}
          onTouchStart={(e) => {
            triggerHaptic();
            handleDpadTouch(e);
          }}
          onTouchMove={handleDpadTouch}
          onTouchEnd={handleDpadEnd}
          onTouchCancel={handleDpadEnd}
          className="relative w-36 h-36 bg-neutral-900/90 rounded-full border border-neutral-700/80 shadow-2xl flex items-center justify-center p-2 backdrop-blur-sm"
        >
          {/* Cross D-Pad Shape */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Horizontal Bar */}
            <div className="absolute w-28 h-10 bg-neutral-800 rounded-md border border-neutral-600 flex justify-between items-center px-1 shadow-inner">
              <span className="text-neutral-400 font-pixel text-[10px]">◀</span>
              <span className="text-neutral-400 font-pixel text-[10px]">▶</span>
            </div>
            {/* Vertical Bar */}
            <div className="absolute w-10 h-28 bg-neutral-800 rounded-md border border-neutral-600 flex flex-col justify-between items-center py-1 shadow-inner">
              <span className="text-neutral-400 font-pixel text-[10px]">▲</span>
              <span className="text-neutral-400 font-pixel text-[10px]">▼</span>
            </div>
            {/* Center Indent */}
            <div className="relative z-10 w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700" />
          </div>
        </div>
      </div>

      {/* Middle: Select & Start */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onTogglePause();
            }}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-12 h-3.5 bg-neutral-700 rounded-full border border-neutral-600 shadow-md group-active:bg-neutral-500" />
            <span className="font-pixel text-[9px] text-neutral-400 mt-1.5 uppercase">
              {isPaused ? 'RESUME' : 'PAUSE'}
            </span>
          </button>
        </div>
      </div>

      {/* Right: Retro Action Buttons B & A (Angled NES Layout) */}
      <div className="flex items-center gap-4 pr-1">
        {/* Button B (Sprint / Fireball) */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic();
              onUpdateInput('run', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onUpdateInput('run', false);
            }}
            onMouseDown={() => onUpdateInput('run', true)}
            onMouseUp={() => onUpdateInput('run', false)}
            className="w-16 h-16 rounded-full bg-red-700 active:bg-red-600 border-2 border-red-900 shadow-lg flex items-center justify-center text-white font-pixel text-lg active:scale-95 transition-transform"
          >
            B
          </button>
          <span className="font-pixel text-[9px] text-neutral-400 mt-1 uppercase">RUN</span>
        </div>

        {/* Button A (Jump) */}
        <div className="flex flex-col items-center mb-6">
          <button
            type="button"
            onTouchStart={(e) => {
              e.preventDefault();
              triggerHaptic();
              onUpdateInput('jump', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onUpdateInput('jump', false);
            }}
            onMouseDown={() => onUpdateInput('jump', true)}
            onMouseUp={() => onUpdateInput('jump', false)}
            className="w-16 h-16 rounded-full bg-red-700 active:bg-red-600 border-2 border-red-900 shadow-lg flex items-center justify-center text-white font-pixel text-lg active:scale-95 transition-transform"
          >
            A
          </button>
          <span className="font-pixel text-[9px] text-neutral-400 mt-1 uppercase">JUMP</span>
        </div>
      </div>
    </div>
  );
};
