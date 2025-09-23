import { useEffect, useRef, useState, type JSX } from 'react';

type Box = { x: number; y: number; velocity: number };
type Pipe = { x: number; height: number };

const GRAVITY = 0.2;
const JUMP = -6;
const PIPE_WIDTH = 60;
const PIPE_GAP = 140;
const PIPE_INTERVAL = 180; // frames

export default function FlappyBox(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const boxRef = useRef<Box>({ x: 80, y: 200, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef(0);

  // game loop
  useEffect(() => {
    if (!running || gameOver) return; // 🚀 dừng loop nếu gameOver hoặc chưa chạy
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const W = 400;
    const H = 500;

    function loop() {
      if (!ctx) return;
      frameRef.current++;

      // update box
      const box = boxRef.current;
      box.velocity += GRAVITY;
      box.y += box.velocity;

      // spawn pipes
      if (frameRef.current % PIPE_INTERVAL === 0) {
        const topHeight = Math.random() * (H - PIPE_GAP - 100) + 50;
        pipesRef.current.push({ x: W, height: topHeight });
      }

      // move pipes
      pipesRef.current.forEach((p) => (p.x -= 2));

      // remove offscreen pipes
      pipesRef.current = pipesRef.current.filter((p) => p.x + PIPE_WIDTH > 0);

      // check collision
      for (const p of pipesRef.current) {
        if (
          box.x < p.x + PIPE_WIDTH &&
          box.x + 24 > p.x && // box width
          (box.y < p.height || box.y + 24 > p.height + PIPE_GAP) // box height
        ) {
          setGameOver(true);
          setRunning(false);
          return; // 🚀 stop loop ngay lập tức
        }
        // score when pipe passes box
        if (p.x + PIPE_WIDTH === box.x) {
          setScore((s) => s + 1);
        }
      }

      // check ground / ceiling
      if (box.y < 0 || box.y + 24 > H) {
        setGameOver(true);
        setRunning(false);
        return; // 🚀 stop loop
      }

      // draw background
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, 0, W, H);

      // draw pipes
      ctx.fillStyle = '#22c55e';
      for (const p of pipesRef.current) {
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.height);
        ctx.fillRect(p.x, p.height + PIPE_GAP, PIPE_WIDTH, H);
      }

      // draw box
      ctx.fillStyle = '#facc15';
      ctx.fillRect(box.x, box.y, 24, 24);

      // draw score
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}`, 10, 30);

      if (running && !gameOver) requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, gameOver]);

  function resetGame() {
    boxRef.current = { x: 80, y: 200, velocity: 0 };
    pipesRef.current = [];
    frameRef.current = 0;
    setScore(0);
    setGameOver(false);
    setRunning(false);
  }

  function flap() {
    if (!running) {
      setRunning(true);
    }

    boxRef.current.velocity = JUMP;
  }

  // controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        flap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, gameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h2 className="text-xl font-semibold mb-2">Flappy Box — React + TS</h2>

      <canvas
        ref={canvasRef}
        width={400}
        height={500}
        onClick={flap}
        style={{ border: '2px solid white', borderRadius: '8px' }}
      />

      {/* Game Over overlay */}
      {gameOver && (
        <div className="mt-3 flex flex-col items-center">
          <p className="text-red-400 text-lg font-bold">Game Over!</p>
          <p className="text-white mb-2">Score: {score}</p>
          <button
            onClick={() => {
              resetGame();
              setRunning(true);
            }}
            className="mt-2 px-4 py-2 bg-yellow-400 text-black rounded"
          >
            Restart
          </button>
        </div>
      )}

      {/* Start button */}
      {!running && !gameOver && (
        <button onClick={() => setRunning(true)} className="mt-3 px-4 py-2 bg-emerald-500 text-black rounded">
          Start Game
        </button>
      )}

      {/* Pause / Resume buttons */}
      {running && !gameOver && (
        <button onClick={() => setRunning(false)} className="mt-3 px-4 py-2 bg-yellow-300 text-black rounded">
          Pause
        </button>
      )}
      {!running && !gameOver && (
        <button onClick={() => setRunning(true)} className="mt-3 px-4 py-2 bg-green-400 text-black rounded">
          Resume
        </button>
      )}
    </div>
  );
}
