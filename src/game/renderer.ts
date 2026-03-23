import type { Asteroid, Laser, Particle, Star } from './types';
import {
  COL_BG, COL_SHIP, COL_SHIP_ACCENT, COL_LASER, COL_LASER_GLOW,
  COL_ASTEROID, COL_HUD, COL_STAR, ASTEROID_TIERS, PARALLAX,
  hexToRgba, clamp, wrap,
} from './types';

export function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = COL_BG;
  ctx.fillRect(0, 0, W, H);
}

export function drawStars(
  ctx: CanvasRenderingContext2D, stars: Star[], dt: number,
  layer: number, camOX: number, camOY: number, W: number, H: number,
) {
  const px = PARALLAX[layer];
  for (const s of stars) {
    if (s.layer !== layer) continue;
    s.twinklePhase += s.twinkleSpeed * dt;
    const alpha = s.brightness * (0.5 + 0.5 * Math.sin(s.twinklePhase));
    const sx = wrap(s.x - camOX * px, W);
    const sy = wrap(s.y - camOY * px, H);
    ctx.fillStyle = hexToRgba(COL_STAR[layer], clamp(alpha, 0.04, 1));
    ctx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
  }
}

export function drawAsteroidLayer(
  ctx: CanvasRenderingContext2D, asteroids: Asteroid[],
  layer: number, camOX: number, camOY: number,
) {
  const color = COL_ASTEROID[layer];
  const alphaBase = layer === 0 ? 0.3 : layer === 1 ? 0.55 : 1.0;

  for (const a of asteroids) {
    if (!a.active || a.layer !== layer) continue;
    const tier = ASTEROID_TIERS[a.tier];
    const pts = a.shape.length;
    const step = (Math.PI * 2) / pts;
    const offX = layer < 2 ? -camOX * PARALLAX[layer] : 0;
    const offY = layer < 2 ? -camOY * PARALLAX[layer] : 0;
    const dx = a.x + offX;
    const dy = a.y + offY;

    ctx.strokeStyle = hexToRgba(color, alphaBase);
    ctx.lineWidth = layer === 2 ? 0.6 : 0.4;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const idx = i % pts;
      const ang = a.rot + idx * step;
      const r = tier.radius * a.shape[idx];
      const px = dx + Math.cos(ang) * r;
      const py = dy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (layer === 2) {
      ctx.fillStyle = hexToRgba(COL_BG, 0.5);
      ctx.fill();
    }
  }
}

export function drawLasers(ctx: CanvasRenderingContext2D, lasers: Laser[]) {
  for (const l of lasers) {
    if (!l.active) continue;
    const tx = l.x - l.vx * 0.008;
    const ty = l.y - l.vy * 0.008;
    ctx.strokeStyle = COL_LASER;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.floor(tx), Math.floor(ty));
    ctx.lineTo(Math.floor(l.x), Math.floor(l.y));
    ctx.stroke();
    ctx.fillStyle = COL_LASER_GLOW;
    ctx.fillRect(Math.floor(l.x), Math.floor(l.y), 1, 1);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    if (!p.active) continue;
    ctx.fillStyle = hexToRgba(p.color, clamp(p.life / p.maxLife, 0, 1));
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
  }
}

export function drawShip(
  ctx: CanvasRenderingContext2D,
  shipX: number, shipY: number, shipAngle: number, totalTime: number,
) {
  const c = Math.cos;
  const s = Math.sin;
  const nX = shipX + c(shipAngle) * 4;
  const nY = shipY + s(shipAngle) * 4;
  const lX = shipX + c(shipAngle + 2.5) * 3.5;
  const lY = shipY + s(shipAngle + 2.5) * 3.5;
  const rX = shipX + c(shipAngle - 2.5) * 3.5;
  const rY = shipY + s(shipAngle - 2.5) * 3.5;

  // Wireframe triangle
  ctx.strokeStyle = COL_SHIP;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(nX, nY);
  ctx.lineTo(lX, lY);
  ctx.lineTo(rX, rY);
  ctx.closePath();
  ctx.stroke();

  // Accent center line
  ctx.strokeStyle = COL_SHIP_ACCENT;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(nX, nY);
  ctx.lineTo((lX + rX) / 2, (lY + rY) / 2);
  ctx.stroke();

  // Engine glow
  const eX = shipX - c(shipAngle) * 2.5;
  const eY = shipY - s(shipAngle) * 2.5;
  ctx.fillStyle = hexToRgba(COL_SHIP, 0.4 + 0.3 * Math.sin(totalTime * 8));
  ctx.fillRect(Math.floor(eX), Math.floor(eY), 1, 1);
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  score: number, lives: number, difficulty: number,
  totalTime: number, gameOver: boolean, highScore: number,
) {
  ctx.font = '5px monospace';
  ctx.textBaseline = 'top';

  // Score
  ctx.fillStyle = COL_HUD;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 4, 4);

  // Lives as diamonds
  ctx.textAlign = 'center';
  ctx.fillText(
    Array.from({ length: lives }, () => '\u25c6').join(' '),
    W / 2,
    4,
  );

  // Level
  ctx.textAlign = 'right';
  ctx.fillText(`LV ${difficulty}`, W - 4, 4);

  // Fading controls hint
  if (totalTime < 5) {
    ctx.fillStyle = hexToRgba(COL_HUD, clamp(1 - totalTime / 5, 0, 1) * 0.6);
    ctx.textAlign = 'center';
    ctx.fillText('MOVE: mouse   SHOOT: click   RESTART: R', W / 2, H - 10);
  }

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = hexToRgba(COL_BG, 0.6);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = hexToRgba(COL_HUD, 0.95);
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 8);
    ctx.font = '5px monospace';
    ctx.fillStyle = hexToRgba(COL_STAR[0], 0.8);
    ctx.fillText(`SCORE: ${score}`, W / 2, H / 2 + 2);
    if (highScore > 0 && score >= highScore) {
      ctx.fillStyle = hexToRgba(COL_HUD, 0.8);
      ctx.fillText('NEW HIGH SCORE!', W / 2, H / 2 + 9);
    } else if (highScore > 0) {
      ctx.fillStyle = hexToRgba(COL_STAR[1], 0.6);
      ctx.fillText(`HIGH: ${highScore}`, W / 2, H / 2 + 9);
    }
    ctx.fillStyle = hexToRgba(COL_STAR[0], 0.6);
    ctx.fillText('CLICK or R to restart', W / 2, H / 2 + 18);
  }
}
