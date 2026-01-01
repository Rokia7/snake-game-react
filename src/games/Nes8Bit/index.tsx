import { useEffect, useRef, useState } from 'react';
import { Nostalgist } from 'nostalgist';

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
    image: '🎮',
  },
  {
    id: 'twinbee',
    name: 'Twin Bee',
    filename: '/roms/TwinBee.nes',
    image: '🎮',
  },
  {
    id: 'threeeyedone',
    name: 'Three Eyed One',
    filename: '/roms/Three-Eyed-One.nes',
    image: '🎮',
  },
];

export default function Nes8bitGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nostalgist, setNostalgist] = useState<Awaited<ReturnType<typeof Nostalgist.launch>> | null>(null);
  const [gameName, setGameName] = useState<string>('');
  const [showGameList, setShowGameList] = useState(true);

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
  }, [nostalgist]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <h1 className="text-4xl font-bold text-white text-center mb-6">🎮 NES 8-Bit Emulator</h1>

      <div className="bg-gray-800 rounded-lg shadow-2xl p-6">
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
          <div className="mb-6">
            <p className="text-green-400 text-center text-lg">
              ▶️ Đang chơi: <span className="font-bold">{gameName}</span>
            </p>
          </div>
        )}

        <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
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

        {!showGameList && nostalgist && (
          <div className="mt-6 text-white">
            <h2 className="text-xl font-semibold mb-3">⌨️ Điều khiển:</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Di chuyển:</p>
                <ul className="space-y-1 text-gray-300">
                  <li>↑ ↓ ← → : Phím mũi tên</li>
                  <li>W A S D : Phím WASD</li>
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

      <div className="mt-4 text-center text-gray-400 text-sm">
        <p>Chọn game từ danh sách hoặc tải file ROM từ máy tính</p>
        <p className="mt-2">{nostalgist ? 'Nhấn ESC để về trang chọn game' : 'Hỗ trợ định dạng .nes và .zip'}</p>
      </div>
    </div>
  );
}
