import React, { useRef, useState } from 'react';

type Direction = { x: number; y: number };

interface VirtualDPadTouchProps {
  onMove: (dir: Direction) => void;
  onRelease?: () => void;
}

export default function VirtualDPadTouch({ onMove, onRelease }: VirtualDPadTouchProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  function handleTouch(e: React.TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch || !areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) {
        setActive('right');
        onMove({ x: 1, y: 0 });
      } else if (dx < -20) {
        setActive('left');
        onMove({ x: -1, y: 0 });
      }
    } else {
      if (dy > 20) {
        setActive('down');
        onMove({ x: 0, y: 1 });
      } else if (dy < -20) {
        setActive('up');
        onMove({ x: 0, y: -1 });
      }
    }
  }

  function resetTouch(e: React.TouchEvent) {
    e.preventDefault();
    setActive(null);
    onRelease?.();
  }

  return (
    <div
      ref={areaRef}
      className={`relative w-48 h-48 rounded-full bg-black/30 border border-white/20 select-none touch-none`}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={resetTouch}
    >
      {/* Center circle */}
      <div className="absolute w-12 h-12 rounded-full border border-white/30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Up */}
      <div
        className={`absolute top-2 left-1/2 -translate-x-1/2 px-2 rounded ${
          active === 'up' ? 'bg-white text-black' : 'text-white/60'
        }`}
      >
        ▲
      </div>

      {/* Down */}
      <div
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 rounded ${
          active === 'down' ? 'bg-white text-black' : 'text-white/60'
        }`}
      >
        ▼
      </div>

      {/* Left */}
      <div
        className={`absolute left-2 top-1/2 -translate-y-1/2 px-2 rounded ${
          active === 'left' ? 'bg-white text-black' : 'text-white/60'
        }`}
      >
        ◄
      </div>

      {/* Right */}
      <div
        className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 rounded ${
          active === 'right' ? 'bg-white text-black' : 'text-white/60'
        }`}
      >
        ►
      </div>
    </div>
  );
}
