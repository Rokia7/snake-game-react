import { useRef } from 'react';
import ActionButton from '../ActionButton';

interface VirtualControllerProps {
  activeButtons: Set<string>;
  onDpadTouch: (e: React.TouchEvent<HTMLDivElement>) => void;
  onDpadRelease: (e: React.TouchEvent<HTMLDivElement>) => void;
  onKeyPress: (key: string, type: 'keydown' | 'keyup') => void;
  onTurboStart: (key: string) => void;
  onTurboEnd: (key: string) => void;
  onReset: () => void;
  dpadRef?: React.RefObject<HTMLDivElement | null>;
}

export default function VirtualController({
  activeButtons,
  onDpadTouch,
  onDpadRelease,
  onKeyPress,
  onTurboStart,
  onTurboEnd,
  onReset,
  dpadRef: externalDpadRef,
}: VirtualControllerProps) {
  const internalDpadRef = useRef<HTMLDivElement>(null);
  const dpadRef = externalDpadRef || internalDpadRef;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-end z-40">
      {/* D-Pad */}
      <div className="relative">
        <div
          ref={dpadRef}
          className="relative w-40 h-40 rounded-full bg-black/30 border border-white/20 touch-none select-none"
          onTouchStart={(e) => onDpadTouch(e)}
          onTouchMove={(e) => onDpadTouch(e)}
          onTouchEnd={onDpadRelease}
          onTouchCancel={onDpadRelease}
          style={{ touchAction: 'none' }}
        >
          {/* Up */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-t-full flex items-center justify-center text-white text-xl shadow-lg touch-none select-none transition-colors ${
              activeButtons.has('ArrowUp') ? 'bg-blue-600 scale-95' : 'bg-gray-700'
            }`}
          >
            ▲
          </div>
          {/* Down */}
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-b-full flex items-center justify-center text-white text-xl shadow-lg touch-none select-none transition-colors ${
              activeButtons.has('ArrowDown') ? 'bg-blue-600 scale-95' : 'bg-gray-700'
            }`}
          >
            ▼
          </div>
          {/* Left */}
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-l-full flex items-center justify-center text-white text-xl shadow-lg touch-none select-none transition-colors ${
              activeButtons.has('ArrowLeft') ? 'bg-blue-600 scale-95' : 'bg-gray-700'
            }`}
          >
            ◀
          </div>
          {/* Right */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-r-full flex items-center justify-center text-white text-xl shadow-lg touch-none select-none transition-colors ${
              activeButtons.has('ArrowRight') ? 'bg-blue-600 scale-95' : 'bg-gray-700'
            }`}
          >
            ▶
          </div>
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-gray-900 rounded-full"></div>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="flex flex-col items-end gap-3 pr-5 pb-5">
        {/* Reset Button */}
        <ActionButton
          onPress={() => {}}
          onRelease={onReset}
          isActive={false}
          label="🔄 RESET"
          size="small"
          color="yellow"
          className="px-3 py-1 mb-1"
        />
        {/* Start & Select */}
        <div className="flex gap-2 mb-2">
          <ActionButton
            onPress={() => onKeyPress('Shift', 'keydown')}
            onRelease={() => onKeyPress('Shift', 'keyup')}
            isActive={activeButtons.has('Shift')}
            label="SELECT"
            size="small"
            color="gray"
            className="px-4 py-2"
          />
          <ActionButton
            onPress={() => onKeyPress('Enter', 'keydown')}
            onRelease={() => onKeyPress('Enter', 'keyup')}
            isActive={activeButtons.has('Enter')}
            label="START"
            size="small"
            color="gray"
            className="px-4 py-2"
          />
        </div>
        {/* A & B Buttons */}
        <div className="flex gap-3 mb-2">
          <ActionButton
            onPress={() => onKeyPress('x', 'keydown')}
            onRelease={() => onKeyPress('x', 'keyup')}
            isActive={activeButtons.has('x')}
            label="B"
            size="medium"
            color="red"
          />
          <ActionButton
            onPress={() => onTurboStart('a')}
            onRelease={() => onTurboEnd('a')}
            isActive={activeButtons.has('a')}
            label="AA"
            size="small"
            color="orange"
          />
        </div>
        {/* Turbo BA & A Buttons */}
        <div className="flex gap-3">
          <ActionButton
            onPress={() => onTurboStart('s')}
            onRelease={() => onTurboEnd('s')}
            isActive={activeButtons.has('s')}
            label="BA"
            size="small"
            color="orange"
          />
          <ActionButton
            onPress={() => onKeyPress('z', 'keydown')}
            onRelease={() => onKeyPress('z', 'keyup')}
            isActive={activeButtons.has('z')}
            label="A"
            size="medium"
            color="red"
          />
        </div>
      </div>
    </div>
  );
}
