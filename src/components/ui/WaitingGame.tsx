'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function WaitingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const playerY = useRef(0);
  const velocity = useRef(0);
  const isJumping = useRef(false);
  const obstacles = useRef<{ x: number; type: 'dislike' | 'play'; collected: boolean }[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const speedRef = useRef(3);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const groundOffset = useRef(0);

  const W = 600;
  const H = 150;
  const GROUND = H - 30;
  const PLAYER_SIZE = 22;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -11;
  const OBS_SIZE = 20;

  const resetGame = useCallback(() => {
    playerY.current = GROUND - PLAYER_SIZE;
    velocity.current = 0;
    isJumping.current = false;
    obstacles.current = [];
    scoreRef.current = 0;
    speedRef.current = 3;
    gameOverRef.current = false;
    groundOffset.current = 0;
    setScore(0);
    setGameOver(false);
  }, []);

  const jump = useCallback(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      setStarted(true);
      resetGame();
      return;
    }
    if (gameOverRef.current) {
      resetGame();
      return;
    }
    if (!isJumping.current) {
      velocity.current = JUMP_FORCE;
      isJumping.current = true;
    }
  }, [resetGame]);

  const handleClick = useCallback(() => {
    jump();
    canvasRef.current?.focus();
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    playerY.current = GROUND - PLAYER_SIZE;

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    canvas.addEventListener('keydown', handleKey);

    let spawnTimer = 0;

    const drawGround = () => {
      ctx.strokeStyle = 'rgba(99,102,241,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.lineTo(W, GROUND);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(99,102,241,0.08)';
      const spacing = 40;
      const off = groundOffset.current % spacing;
      for (let x = -off; x < W; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND);
        ctx.lineTo(x + 10, GROUND + 20);
        ctx.stroke();
      }
    };

    const drawPlayer = () => {
      const px = 60;
      const py = playerY.current;
      ctx.font = `${PLAYER_SIZE}px serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText('\uD83C\uDFAC', px, py + PLAYER_SIZE);

      // shadow
      ctx.fillStyle = 'rgba(99,102,241,0.15)';
      const shadowScale = 1 - (GROUND - PLAYER_SIZE - py) / 120;
      const sw = PLAYER_SIZE * Math.max(0.3, shadowScale);
      ctx.beginPath();
      ctx.ellipse(px + PLAYER_SIZE / 2, GROUND + 2, sw / 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawObstacles = () => {
      for (const obs of obstacles.current) {
        if (obs.collected) continue;
        ctx.font = `${OBS_SIZE}px serif`;
        ctx.textBaseline = 'bottom';
        if (obs.type === 'dislike') {
          ctx.fillText('\uD83D\uDC4E', obs.x, GROUND);
        } else {
          ctx.fillText('\u25B6\uFE0F', obs.x, GROUND - 10);
        }
      }
    };

    const drawScore = () => {
      ctx.fillStyle = 'rgba(99,102,241,0.9)';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${scoreRef.current}`, W - 12, 10);
      ctx.textAlign = 'left';
    };

    const drawStartScreen = () => {
      ctx.fillStyle = 'rgba(200,200,220,0.6)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Press Space / Tap to start', W / 2, H / 2 - 10);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(200,200,220,0.4)';
      ctx.fillText('\uD83C\uDFAC Creator Run — jump over \uD83D\uDC4E, collect \u25B6\uFE0F', W / 2, H / 2 + 12);
      ctx.textAlign = 'left';
    };

    const drawGameOver = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over!', W / 2, H / 2 - 14);
      ctx.fillStyle = 'rgba(200,200,220,0.7)';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Score: ${scoreRef.current}  —  Space / Tap to retry`, W / 2, H / 2 + 10);
      ctx.textAlign = 'left';
    };

    const gameLoop = () => {
      ctx.clearRect(0, 0, W, H);

      if (!startedRef.current) {
        drawGround();
        playerY.current = GROUND - PLAYER_SIZE;
        drawPlayer();
        drawStartScreen();
        frameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (gameOverRef.current) {
        drawGround();
        drawObstacles();
        drawPlayer();
        drawScore();
        drawGameOver();
        frameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Physics
      velocity.current += GRAVITY;
      playerY.current += velocity.current;
      if (playerY.current >= GROUND - PLAYER_SIZE) {
        playerY.current = GROUND - PLAYER_SIZE;
        velocity.current = 0;
        isJumping.current = false;
      }

      // Move ground
      groundOffset.current += speedRef.current;

      // Spawn obstacles
      spawnTimer++;
      const spawnInterval = Math.max(40, 80 - speedRef.current * 4);
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        const type = Math.random() < 0.35 ? 'play' : 'dislike';
        obstacles.current.push({ x: W + 10, type, collected: false });
      }

      // Move + collide obstacles
      const px = 60;
      const py = playerY.current;
      const playerBox = { x: px + 4, y: py + 4, w: PLAYER_SIZE - 8, h: PLAYER_SIZE - 8 };

      for (let i = obstacles.current.length - 1; i >= 0; i--) {
        const obs = obstacles.current[i];
        obs.x -= speedRef.current;

        if (obs.x < -OBS_SIZE) {
          obstacles.current.splice(i, 1);
          continue;
        }

        if (obs.collected) continue;

        const obsY = obs.type === 'play' ? GROUND - OBS_SIZE - 10 : GROUND - OBS_SIZE;
        const obsBox = { x: obs.x + 3, y: obsY + 3, w: OBS_SIZE - 6, h: OBS_SIZE - 6 };

        const hit =
          playerBox.x < obsBox.x + obsBox.w &&
          playerBox.x + playerBox.w > obsBox.x &&
          playerBox.y < obsBox.y + obsBox.h &&
          playerBox.y + playerBox.h > obsBox.y;

        if (hit) {
          if (obs.type === 'dislike') {
            gameOverRef.current = true;
            setGameOver(true);
            setScore(scoreRef.current);
          } else {
            obs.collected = true;
            scoreRef.current += 10;
            setScore(scoreRef.current);
          }
        }
      }

      // Speed up
      speedRef.current = 3 + Math.floor(scoreRef.current / 100) * 0.5;

      drawGround();
      drawObstacles();
      drawPlayer();
      drawScore();

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.removeEventListener('keydown', handleKey);
    };
  }, [jump]);

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
        Play while you wait! Press space or tap
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12,
          maxWidth: '100%',
          cursor: 'pointer',
          background: 'rgba(10,10,10,0.3)',
          outline: 'none',
        }}
        onClick={handleClick}
        tabIndex={0}
      />
      {score > 0 && (
        <div style={{ fontSize: 12, color: '#6366f1', marginTop: 4, fontWeight: 600 }}>
          Score: {score}
        </div>
      )}
    </div>
  );
}
