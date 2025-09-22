/*
Simple Snake Game - React + TypeScript
- Copy this file into a React + TypeScript project (e.g. Vite, CRA with TS, or Next.js with TS).
- Tailwind CSS classes are used for styling. If you don't have Tailwind, the game still works with inline styles.

How to use:
- Place this component in a page (e.g. src/App.tsx) and render it.
- Controls: Arrow keys / WASD to move, Space to pause/start.
*/

import { useEffect, useRef, useState, type JSX } from 'react';
import VirtualDPadTouch from '../../components/Dpad/VirtualDPad';

const CELL_SIZE = 20; // px
const COLS = 20;
const ROWS = 20;
const TICK_MS = 120; // snake speed

type Position = { x: number; y: number };
type Direction = { x: number; y: number };

function randPosition(exclude: string[] = []): Position {
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    const key = `${x},${y}`;
    if (!exclude.includes(key)) return { x, y };
  }
}

export default function SnakeGame(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState<Position[]>([
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ]);
  const [dir, setDir] = useState<Direction>({ x: 1, y: 0 });
  const dirRef = useRef<Direction>(dir);
  const [food, setFood] = useState<Position>(() => randPosition(['8,10', '7,10', '6,10']));
  const [running, setRunning] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(TICK_MS);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [obstacles, setObstacles] = useState<Position[]>([]);

  // Keep refs in sync for interval
  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);
  const snakeRef = useRef<Position[]>(snake);
  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grid (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(canvas.width, r * CELL_SIZE);
      ctx.stroke();
    }

    // food
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    // obstacles
    ctx.fillStyle = '#9ca3af';
    obstacles.forEach((o) => {
      ctx.fillRect(o.x * CELL_SIZE + 2, o.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    });

    // snake
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      ctx.fillStyle = i === 0 ? '#10b981' : '#34d399';
      ctx.fillRect(s.x * CELL_SIZE + 1, s.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }

    // score
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 6, canvas.height - 6);
  }, [snake, food, score]);

  // Game loop
  useEffect(() => {
    if (!running) return;
    if (gameOver) return;

    const id = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        const nd = dirRef.current;
        const newHead: Position = { x: (head.x + nd.x + COLS) % COLS, y: (head.y + nd.y + ROWS) % ROWS };

        // collision with self
        if (prev.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          setRunning(false);
          setGameOver(true);
          return prev;
        }

        // collision with obstacle
        if (obstacles.some((o) => o.x === newHead.x && o.y === newHead.y)) {
          setRunning(false);
          setGameOver(true);
          return prev;
        }

        const ate = newHead.x === food.x && newHead.y === food.y;
        const newSnake = [newHead, ...prev];
        if (!ate) newSnake.pop();
        else {
          setScore((s) => s + 1);
          const exclude = [...newSnake.map((p) => `${p.x},${p.y}`), ...obstacles.map((o) => `${o.x},${o.y}`)];
          setFood(randPosition(exclude));
          const newObstacle = randPosition(exclude);
          setObstacles([...obstacles, newObstacle]);
          setSpeed((sp) => Math.max(40, Math.round(sp * 0.95)));
        }
        return newSnake;
      });
    }, speed);

    return () => clearInterval(id);
  }, [running, speed, food, gameOver]);

  // Keyboard
  useEffect(() => {
    const mapKeyToDir = (key: string): Direction | 'TOGGLE' | 'START' | 'RESET' | null => {
      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          return { x: 0, y: -1 };
        case 'ArrowDown':
        case 's':
        case 'S':
          return { x: 0, y: 1 };
        case 'ArrowLeft':
        case 'a':
        case 'A':
          return { x: -1, y: 0 };
        case 'ArrowRight':
        case 'd':
        case 'D':
          return { x: 1, y: 0 };
        case ' ':
          return 'TOGGLE';
        case 'Enter':
          return 'START';
        case 'r':
        case 'R':
          return 'RESET';
        default:
          return null;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const res = mapKeyToDir(e.key);
      if (!res) return;
      if (res === 'TOGGLE') {
        if (gameOver) resetGame();
        else setRunning((r) => !r);
        return;
      }
      if (res === 'START') {
        startGame();
        return;
      }
      if (res === 'RESET') {
        resetGame();
        return;
      }

      // prevent reverse
      const cur = dirRef.current;
      if (cur.x + res.x === 0 && cur.y + res.y === 0) return;
      setDir(res);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver]);

  function startGame(): void {
    if (gameOver) {
      resetGame();
      setRunning(true);
    } else {
      setRunning(true);
    }
  }

  function resetGame(): void {
    setSnake([
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ]);
    setDir({ x: 1, y: 0 });
    dirRef.current = { x: 1, y: 0 };
    setFood(randPosition(['8,10', '7,10', '6,10']));
    setObstacles([]);
    setRunning(false);
    setScore(0);
    setSpeed(TICK_MS);
    setGameOver(false);
  }

  // touch controls for mobile
  const handleDirectionButton = (d: Direction): void => {
    const cur = dirRef.current;
    if (cur.x + d.x === 0 && cur.y + d.y === 0) return; // no reverse
    setDir(d);
    setRunning(true);
  };

  return (
    <div className="p-4 min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Snake — Basic FE Game</h2>
          <div className="space-x-2">
            <button className="px-3 py-1 rounded bg-emerald-500 text-black" onClick={startGame}>
              Start
            </button>
            <button className="px-3 py-1 rounded bg-yellow-400 text-black" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button className="px-3 py-1 rounded bg-red-500 text-black" onClick={resetGame}>
              Reset
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex gap-4 flex-col md:flex-row">
          <div>
            <canvas
              ref={canvasRef}
              width={COLS * CELL_SIZE}
              height={ROWS * CELL_SIZE}
              style={{ width: '100%', maxWidth: `${COLS * CELL_SIZE}px`, height: 'auto', borderRadius: 8 }}
            />
            {gameOver && <div className="mt-2 text-red-300">Game Over — Score: {score}</div>}
          </div>

          <div className="flex-1">
            <div className="mb-3">
              <div>
                Score: <strong>{score}</strong>
              </div>
              <div>
                Speed: <strong>{Math.round(1000 / speed)} moves/sec (approx)</strong>
              </div>
              <div>Controls: Arrow keys / WASD / Touch buttons; Space to toggle pause.</div>
            </div>

            <div className="flex justify-center items-center">
              <VirtualDPadTouch onMove={(d) => handleDirectionButton(d)} />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2"></div>

            <div className="mt-4">
              <label className="block text-sm mb-1">Adjust speed (ms per tick)</label>
              <input type="range" min={40} max={300} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
            </div>

            <div className="mt-4 text-sm text-slate-300">
              Tip: the snake wraps around edges. The game speeds up each time you eat food.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
