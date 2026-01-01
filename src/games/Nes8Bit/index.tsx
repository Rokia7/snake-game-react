import { Nostalgist } from 'nostalgist';
import { useEffect, useRef, useState } from 'react';

interface GameInfo {
  id: string;
  name: string;
  filename: string;
  image?: string;
}

// Danh sách game có sẵn trong dự án
const GAME_LIST: GameInfo[] = [
  {
    id: 'contra',
    name: 'Contra',
    filename: '/roms/Contra.nes',
    image: '🎮',
  },
  {
    id: 'topgun',
    name: 'Top Gun',
    filename: '/roms/Top-Gun.nes',
    image: '✈️',
  },
  {
    id: 'twine',
    name: 'Twin Bee',
    filename: '/roms/TwinBee.nes',
    image: '🐝',
  },
  {
    id: 'threeeyedone',
    name: 'Three Eyed One',
    filename: '/roms/Three-Eyed-One.nes',
    image: '👁️',
  },
];

export default function Nes8bitGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dpadRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nostalgist, setNostalgist] = useState<Awaited<ReturnType<typeof Nostalgist.launch>> | null>(null);
  const [gameName, setGameName] = useState<string>('');
  const [showGameList, setShowGameList] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [activeButtons, setActiveButtons] = useState<Set<string>>(new Set());
  const [activeDpadDirections, setActiveDpadDirections] = useState<Set<string>>(new Set());
  const [turboButtons, setTurboButtons] = useState<Set<string>>(new Set());
  const turboIntervalRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Detect mobile device or small screen
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice || isSmallScreen);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  const simulateKeyPress = (key: string, type: 'keydown' | 'keyup') => {
    // Update active buttons for visual feedback
    if (type === 'keydown') {
      setActiveButtons((prev) => new Set(prev).add(key));
    } else {
      setActiveButtons((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }

    // Check if nostalgist is available before sending commands
    if (!nostalgist) return;

    // Map keys to Nostalgist button names
    const keyMap: Record<string, string> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      z: 'a',
      x: 'b',
      a: 'a',
      s: 'b',
      Enter: 'start',
      Shift: 'select',
    };

    const buttonName = keyMap[key];
    if (buttonName) {
      try {
        if (type === 'keydown') {
          nostalgist.pressDown(buttonName);
        } else {
          nostalgist.pressUp(buttonName);
        }
      } catch (error) {
        console.warn('Button press error:', error);
      }
    }
  };

  const handleDpadTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only prevent default and stop propagation for this specific element
    e.preventDefault();
    e.stopPropagation();

    // If no touches, treat as release
    if (e.touches.length === 0) {
      activeDpadDirections.forEach((direction) => {
        simulateKeyPress(direction, 'keyup');
      });
      setActiveDpadDirections(new Set());
      return;
    }

    // Find the touch that is actually on the D-Pad
    let relevantTouch = null;
    if (dpadRef.current) {
      const rect = dpadRef.current.getBoundingClientRect();
      // Add padding to the bounds check to allow slight movement outside
      const padding = 20;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (
          touch.clientX >= rect.left - padding &&
          touch.clientX <= rect.right + padding &&
          touch.clientY >= rect.top - padding &&
          touch.clientY <= rect.bottom + padding
        ) {
          relevantTouch = touch;
          break;
        }
      }
    }

    if (!relevantTouch || !dpadRef.current) {
      // No touch on D-Pad, release all directions
      if (activeDpadDirections.size > 0) {
        activeDpadDirections.forEach((direction) => {
          simulateKeyPress(direction, 'keyup');
        });
        setActiveDpadDirections(new Set());
      }
      return;
    }

    const rect = dpadRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = relevantTouch.clientX - cx;
    const dy = relevantTouch.clientY - cy;

    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Maximum distance before releasing (radius + padding)
    const maxDistance = rect.width / 2 + 30;

    const newDirections = new Set<string>();

    // Only process if touch is within valid range
    if (distance > 10 && distance < maxDistance) {
      // Support diagonal directions by checking both axes
      const horizontalThreshold = 15;
      const verticalThreshold = 15;

      // Check horizontal direction
      if (Math.abs(dx) > horizontalThreshold) {
        if (dx > 0) {
          newDirections.add('ArrowRight');
        } else {
          newDirections.add('ArrowLeft');
        }
      }

      // Check vertical direction
      if (Math.abs(dy) > verticalThreshold) {
        if (dy > 0) {
          newDirections.add('ArrowDown');
        } else {
          newDirections.add('ArrowUp');
        }
      }
    }

    // Release directions that are no longer active
    activeDpadDirections.forEach((direction) => {
      if (!newDirections.has(direction)) {
        simulateKeyPress(direction, 'keyup');
      }
    });

    // Press new directions that weren't active before
    newDirections.forEach((direction) => {
      if (!activeDpadDirections.has(direction)) {
        simulateKeyPress(direction, 'keydown');
      }
    });

    setActiveDpadDirections(newDirections);
  };

  const handleDpadRelease = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Always release all directions on touchEnd or touchCancel
    activeDpadDirections.forEach((direction) => {
      simulateKeyPress(direction, 'keyup');
    });
    setActiveDpadDirections(new Set());
  };
  const handleTurboButtonStart = (key: string) => {
    setTurboButtons((prev) => new Set(prev).add(key));
    setActiveButtons((prev) => new Set(prev).add(key));
  };

  const handleTurboButtonEnd = (key: string) => {
    setTurboButtons((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setActiveButtons((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await loadGame(file, file.name);
  };

  const handleGameSelect = async (game: GameInfo) => {
    await loadGame(game.filename, game.name);
  };

  const loadGame = async (romSource: string | File, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setGameName(name);
      setShowGameList(false);

      // Exit previous game if exists
      if (nostalgist) {
        await nostalgist.exit();
      }

      // If romSource is a string (URL), fetch it first
      let rom: File | Blob = romSource as File;
      if (typeof romSource === 'string') {
        const response = await fetch(romSource);
        if (!response.ok) {
          throw new Error(`Failed to load ROM: ${response.statusText}`);
        }
        const blob = await response.blob();
        rom = new File([blob], name, { type: 'application/octet-stream' });
      }

      // Launch emulator with selected ROM file
      const emulator = await Nostalgist.launch({
        core: 'fceumm',
        retroarchConfig: {
          rewind_enable: true,
        },
        retroarchCoreConfig: {
          fceumm_turbo_enable: 'Both',
        },
        rom: rom,
      });

      setNostalgist(emulator);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading ROM:', err);
      setError('Không thể tải ROM. Vui lòng kiểm tra file và thử lại.');
      setIsLoading(false);
      setShowGameList(true);
    }
  };

  const handleResetGame = async () => {
    if (nostalgist) {
      await nostalgist.exit();
      setNostalgist(null);
    }
    setGameName('');
    setError(null);
    setIsLoading(false);
    setShowGameList(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && nostalgist) {
        handleResetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (nostalgist) {
        nostalgist.exit();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nostalgist]);

  // Auto-fire effect for turbo buttons
  useEffect(() => {
    turboButtons.forEach((key) => {
      if (!turboIntervalRef.current[key]) {
        // Start auto-fire: press and release rapidly
        turboIntervalRef.current[key] = setInterval(() => {
          if (nostalgist) {
            const keyMap: Record<string, string> = {
              a: 'a',
              s: 'b',
            };
            const buttonName = keyMap[key];
            if (buttonName) {
              try {
                nostalgist.pressDown(buttonName);
                setTimeout(() => {
                  nostalgist.pressUp(buttonName);
                }, 25);
              } catch {
                // Ignore errors
              }
            }
          }
        }, 50); // Fire every 50ms (approximately 20 times per second)
      }
    });

    // Clean up intervals for buttons that are no longer active
    Object.keys(turboIntervalRef.current).forEach((key) => {
      if (!turboButtons.has(key)) {
        clearInterval(turboIntervalRef.current[key]);
        delete turboIntervalRef.current[key];
      }
    });

    return () => {
      // Clean up all intervals on unmount
      Object.values(turboIntervalRef.current).forEach(clearInterval);
      turboIntervalRef.current = {};
    };
  }, [turboButtons, nostalgist]);

  // Safety effect: Release all D-pad buttons on visibility change or blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeDpadDirections.size > 0) {
        activeDpadDirections.forEach((direction) => {
          simulateKeyPress(direction, 'keyup');
        });
        setActiveDpadDirections(new Set());
      }
    };

    const handleBlur = () => {
      if (activeDpadDirections.size > 0) {
        activeDpadDirections.forEach((direction) => {
          simulateKeyPress(direction, 'keyup');
        });
        setActiveDpadDirections(new Set());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDpadDirections]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      {/* Landscape Warning for Mobile when game is playing */}
      {isMobile && nostalgist && !isLandscape && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8">
          <div className="text-center text-white">
            <div className="text-6xl mb-4 animate-pulse">📱➡️</div>
            <h2 className="text-2xl font-bold mb-2">Xoay ngang để chơi</h2>
            <p className="text-gray-400">Vui lòng xoay thiết bị sang chế độ ngang</p>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-bold text-white text-center mb-6">🎮 NES 8-Bit Emulator</h1>

      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl">
        {showGameList && !nostalgist && (
          <>
            {/* Game List Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4">📚 Danh sách game có sẵn:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {GAME_LIST.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleGameSelect(game)}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all transform hover:scale-105 text-white"
                  >
                    <span className="text-4xl">{game.image}</span>
                    <span className="text-lg font-semibold">{game.name}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-600 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">📂 Hoặc tải file ROM của bạn:</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".nes,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="rom-file-input"
                />
                <label
                  htmlFor="rom-file-input"
                  className="block w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg cursor-pointer transition-colors font-semibold text-lg"
                >
                  📁 Chọn file ROM từ máy tính (.nes, .zip)
                </label>
              </div>
            </div>
          </>
        )}

        {/* File Input Section - Show when game is playing */}
        {!showGameList && gameName && (
          <div className="mb-4">
            <p className="text-green-400 text-center text-lg">
              ▶️ Đang chơi: <span className="font-bold">{gameName}</span>
            </p>
          </div>
        )}

        <div
          className={`relative w-full bg-black rounded-lg overflow-hidden ${
            isMobile && nostalgist && isLandscape ? 'h-[70vh]' : 'aspect-[4/3]'
          }`}
        >
          {!nostalgist && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-xl text-center p-4">
                <p className="mb-2">👆 Chọn file ROM để bắt đầu chơi</p>
                <p className="text-sm text-gray-400">Hỗ trợ file .nes và .zip</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-xl">
                <div className="animate-pulse">Đang tải game...</div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-500 text-xl text-center p-4">{error}</div>
            </div>
          )}

          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {!showGameList && nostalgist && !isMobile && (
          <div className="mt-6 text-white">
            <h2 className="text-xl font-semibold mb-3">⌨️ Điều khiển:</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Di chuyển:</p>
                <ul className="space-y-1 text-gray-300">
                  <li>↑ ↓ ← → : Phím mũi tên</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Nút bấm:</p>
                <ul className="space-y-1 text-gray-300">
                  <li>Z hoặc K : Nút A</li>
                  <li>X hoặc J : Nút B</li>
                  <li>Enter : Start</li>
                  <li>Shift : Select</li>
                  <li className="text-yellow-400 font-semibold mt-2">ESC : Thoát game</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Gamepad for Mobile */}
      {isMobile && nostalgist && isLandscape && (
        <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-between items-end z-40">
          {/* D-Pad */}
          <div className="relative">
            <div
              ref={dpadRef}
              className="relative w-40 h-40 rounded-full bg-black/30 border border-white/20 touch-none select-none"
              onTouchStart={handleDpadTouch}
              onTouchMove={handleDpadTouch}
              onTouchEnd={handleDpadRelease}
              onTouchCancel={handleDpadRelease}
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
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                handleResetGame();
              }}
              className="px-3 py-1 rounded-full bg-yellow-600 text-white text-xs font-bold shadow-lg touch-none select-none transition-all hover:bg-yellow-700 active:scale-90 mb-1"
            >
              🔄 RESET
            </button>
            {/* Start & Select */}
            <div className="flex gap-2 mb-2">
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('Shift', 'keydown');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('Shift', 'keyup');
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  simulateKeyPress('Shift', 'keyup');
                }}
                className={`px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg touch-none select-none transition-all ${
                  activeButtons.has('Shift') ? 'bg-gray-600 scale-90' : 'bg-gray-700'
                }`}
              >
                SELECT
              </button>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('Enter', 'keydown');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('Enter', 'keyup');
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  simulateKeyPress('Enter', 'keyup');
                }}
                className={`px-4 py-2 rounded-full text-white text-xs font-bold shadow-lg touch-none select-none transition-all ${
                  activeButtons.has('Enter') ? 'bg-gray-600 scale-90' : 'bg-gray-700'
                }`}
              >
                START
              </button>
            </div>
            {/* A & B Buttons */}
            <div className="flex gap-3 mb-2">
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('x', 'keydown');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('x', 'keyup');
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  simulateKeyPress('x', 'keyup');
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-2xl border-2 border-red-800 touch-none select-none transition-all ${
                  activeButtons.has('x') ? 'bg-red-700 scale-90' : 'bg-red-600'
                }`}
              >
                B
              </button>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTurboButtonStart('a');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTurboButtonEnd('a');
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  handleTurboButtonEnd('a');
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xl border-2 border-orange-800 touch-none select-none transition-all ${
                  activeButtons.has('a') ? 'bg-orange-700 scale-90' : 'bg-orange-600'
                }`}
              >
                AA
              </button>
            </div>
            {/* Turbo BA & AA Buttons */}
            <div className="flex gap-3">
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTurboButtonStart('s');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTurboButtonEnd('s');
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  handleTurboButtonEnd('s');
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xl border-2 border-orange-800 touch-none select-none transition-all ${
                  activeButtons.has('s') ? 'bg-orange-700 scale-90' : 'bg-orange-600'
                }`}
              >
                BA
              </button>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('z', 'keydown');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  simulateKeyPress('z', 'keyup');
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  simulateKeyPress('z', 'keyup');
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-2xl border-2 border-red-800 touch-none select-none transition-all ${
                  activeButtons.has('z') ? 'bg-red-700 scale-90' : 'bg-red-600'
                }`}
              >
                A
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
