import { useEffect, useRef, useState, type JSX } from 'react';

type Bird = { x: number; y: number; velocity: number };
type Pipe = { x: number; height: number };

const GRAVITY = 0.01;
const JUMP = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 140;
const PIPE_INTERVAL = 180; // frames

export default function FlappyBird(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const birdRef = useRef<Bird>({ x: 80, y: 200, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef(0);

  // game loop
  useEffect(() => {
    if (!running) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const W = 400;
    const H = 500;

    function loop() {
      if (!ctx) return;
      frameRef.current++;

      // update bird
      const bird = birdRef.current;
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;

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
          bird.x < p.x + PIPE_WIDTH &&
          bird.x + 24 > p.x && // bird width
          (bird.y < p.height || bird.y + 24 > p.height + PIPE_GAP) // bird height
        ) {
          setGameOver(true);
          setRunning(false);
        }
        // score when pipe passes bird
        if (p.x + PIPE_WIDTH === bird.x) {
          setScore((s) => s + 1);
        }
      }

      // check ground / ceiling
      if (bird.y < 0 || bird.y + 24 > H) {
        setGameOver(true);
        setRunning(false);
      }

      // draw
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, 0, W, H);

      // pipes
      ctx.fillStyle = '#22c55e';
      for (const p of pipesRef.current) {
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.height);
        ctx.fillRect(p.x, p.height + PIPE_GAP, PIPE_WIDTH, H);
      }

      // bird
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bird.x, bird.y, 24, 24);

      // score
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Score: ${score}`, 10, 30);

      if (running) requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }, [running]);

  function resetGame() {
    birdRef.current = { x: 80, y: 200, velocity: 0 };
    pipesRef.current = [];
    frameRef.current = 0;
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  function flap() {
    if (!running) {
      resetGame();
    }
    birdRef.current.velocity = JUMP;
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
  }, [running]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h2 className="text-xl font-semibold mb-2">Flappy Bird — React + TS</h2>
      <canvas
        ref={canvasRef}
        width={400}
        height={500}
        onClick={flap}
        style={{ border: '2px solid white', borderRadius: '8px' }}
      />
      {gameOver && (
        <div className="mt-3">
          <p className="text-red-400">Game Over! Score: {score}</p>
          <button onClick={resetGame} className="mt-2 px-4 py-2 bg-yellow-400 text-black rounded">
            Restart
          </button>
        </div>
      )}
      {!running && !gameOver && (
        <button onClick={resetGame} className="mt-3 px-4 py-2 bg-emerald-500 text-black rounded">
          Start Game
        </button>
      )}
    </div>
  );
}
