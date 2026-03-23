import type { Asteroid, Laser, Particle, Star, PowerUp, PowerUpKind } from './types';
import type { LeaderboardEntry } from './leaderboard';
import {
  COL_BG, COL_SHIP, COL_SHIP_ACCENT, COL_LASER, COL_LASER_GLOW,
  COL_ASTEROID, COL_HUD, COL_STAR, COL_SHIELD, COL_RAPIDFIRE, COL_BOMB,
  ASTEROID_TIERS, PARALLAX, POWERUP_RADIUS,
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
    // Star drift
    s.x = wrap(s.x + s.dx * dt, W);
    s.y = wrap(s.y + s.dy * dt, H);
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
    ctx.lineWidth = layer === 2 ? 0.8 : 0.5;
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

function powerUpColor(kind: PowerUpKind): string {
  return kind === 'shield' ? COL_SHIELD : kind === 'rapidfire' ? COL_RAPIDFIRE : COL_BOMB;
}

export function drawPowerUps(ctx: CanvasRenderingContext2D, powerups: PowerUp[], totalTime: number) {
  for (const pu of powerups) {
    if (!pu.active) continue;
    const col = powerUpColor(pu.kind);
    const pulse = 0.6 + 0.4 * Math.sin(totalTime * 6);
    const r = POWERUP_RADIUS;
    ctx.strokeStyle = hexToRgba(col, pulse);
    ctx.lineWidth = 0.6;
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(pu.x, pu.y - r);
    ctx.lineTo(pu.x + r, pu.y);
    ctx.lineTo(pu.x, pu.y + r);
    ctx.lineTo(pu.x - r, pu.y);
    ctx.closePath();
    ctx.stroke();
    // Center dot
    ctx.fillStyle = hexToRgba(col, pulse);
    ctx.fillRect(Math.floor(pu.x), Math.floor(pu.y), 1, 1);
    // Label
    ctx.fillStyle = hexToRgba(col, 0.8);
    ctx.font = '3px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = pu.kind === 'shield' ? 'S' : pu.kind === 'rapidfire' ? 'F' : 'B';
    ctx.fillText(label, pu.x, pu.y - r - 1);
  }
}

export function drawShieldEffect(ctx: CanvasRenderingContext2D, x: number, y: number, totalTime: number) {
  const pulse = 0.2 + 0.15 * Math.sin(totalTime * 5);
  ctx.strokeStyle = hexToRgba(COL_SHIELD, pulse);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawCombo(
  ctx: CanvasRenderingContext2D,
  W: number,
  comboCount: number, comboDisplayTimer: number, lastComboScore: number,
) {
  if (comboCount <= 1 && comboDisplayTimer <= 0) return;
  const alpha = comboDisplayTimer > 0 ? clamp(comboDisplayTimer / 0.5, 0, 1) : 1;
  ctx.fillStyle = hexToRgba('#ffaa44', alpha);
  ctx.font = '7px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  if (comboCount > 1) {
    ctx.fillText(`x${comboCount} COMBO`, W - 4, 22);
  }
  if (comboDisplayTimer > 0 && lastComboScore > 0) {
    ctx.fillStyle = hexToRgba('#ffff44', alpha * 0.8);
    ctx.font = '5px monospace';
    ctx.fillText(`+${lastComboScore}`, W - 4, 30);
  }
}

export function drawWaveAnnounce(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  waveLevel: number, timer: number,
) {
  if (timer <= 0) return;
  const alpha = clamp(timer / 1.0, 0, 1);
  // Scale text up then settle
  const scale = timer > 2.0 ? 1.5 - (timer - 2.0) * 1.0 : 1.0;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = hexToRgba(COL_HUD, alpha * 0.7);
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`WAVE ${waveLevel}`, 0, 0);
  ctx.restore();
}

export function drawActivePowerUps(
  ctx: CanvasRenderingContext2D, W: number,
  shieldTimer: number, rapidfireTimer: number,
) {
  const x = W - 4;
  ctx.font = '5px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  if (shieldTimer > 0) {
    ctx.fillStyle = COL_SHIELD;
    ctx.fillText(`SHIELD ${Math.ceil(shieldTimer)}s`, x, 14);
  }
  if (rapidfireTimer > 0) {
    ctx.fillStyle = COL_RAPIDFIRE;
    ctx.fillText(`RAPID ${Math.ceil(rapidfireTimer)}s`, x, shieldTimer > 0 ? 21 : 14);
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
  ctx.lineWidth = 0.8;
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
  totalTime: number,
) {
  ctx.font = '7px monospace';
  ctx.textBaseline = 'top';

  // Score
  ctx.fillStyle = COL_HUD;
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 4, 3);

  // Lives as diamonds
  ctx.textAlign = 'center';
  const diamondSize = 3;
  const gap = 8;
  const startX = W / 2 - ((lives - 1) * gap) / 2;
  for (let i = 0; i < lives; i++) {
    const cx = Math.floor(startX + i * gap);
    const cy = 7;
    ctx.fillStyle = COL_HUD;
    ctx.beginPath();
    ctx.moveTo(cx, cy - diamondSize);
    ctx.lineTo(cx + diamondSize * 0.7, cy);
    ctx.lineTo(cx, cy + diamondSize);
    ctx.lineTo(cx - diamondSize * 0.7, cy);
    ctx.closePath();
    ctx.fill();
  }

  // Level
  ctx.fillStyle = COL_HUD;
  ctx.textAlign = 'right';
  ctx.fillText(`LV ${difficulty}`, W - 4, 3);

  // Fading controls hint
  if (totalTime < 5) {
    ctx.fillStyle = hexToRgba(COL_HUD, clamp(1 - totalTime / 5, 0, 1) * 0.7);
    ctx.textAlign = 'center';
    ctx.font = '6px monospace';
    ctx.fillText('MOVE: mouse   SHOOT: click   R: restart', W / 2, H - 12);
  }

  // Game over overlay is drawn separately via drawGameOver
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  score: number,
  initials: string, initialsMode: boolean, scoreSubmitted: boolean,
  leaderboard: LeaderboardEntry[],
  totalTime: number,
) {
  ctx.fillStyle = hexToRgba(COL_BG, 0.7);
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  let y = H * 0.15;

  // Title
  ctx.fillStyle = COL_HUD;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', cx, y);
  y += 14;

  // Score
  ctx.font = '7px monospace';
  ctx.fillStyle = hexToRgba(COL_STAR[0], 0.9);
  ctx.fillText(`SCORE: ${score}`, cx, y);
  y += 12;

  // Initials input or submitted confirmation
  if (initialsMode && !scoreSubmitted) {
    ctx.fillStyle = COL_HUD;
    ctx.font = '6px monospace';
    ctx.fillText('ENTER INITIALS:', cx, y);
    y += 10;
    // Draw initials with cursor
    const display = initials + (initials.length < 3 ? (Math.floor(totalTime * 3) % 2 === 0 ? '_' : ' ') : '');
    ctx.font = '10px monospace';
    ctx.fillStyle = COL_HUD;
    ctx.fillText(display, cx, y);
    y += 12;
  } else if (scoreSubmitted) {
    ctx.fillStyle = hexToRgba(COL_HUD, 0.8);
    ctx.font = '6px monospace';
    ctx.fillText('SCORE SUBMITTED!', cx, y);
    y += 12;
  }

  // Leaderboard
  if (leaderboard.length > 0) {
    y += 4;
    ctx.fillStyle = hexToRgba(COL_HUD, 0.7);
    ctx.font = '6px monospace';
    ctx.fillText('-- TOP SCORES --', cx, y);
    y += 8;

    ctx.font = '5px monospace';
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const rank = `${i + 1}`.padStart(2, ' ');
      const name = entry.name.padEnd(3, ' ');
      const pts = `${entry.score}`;

      // Highlight if this is the player's just-submitted score
      const isPlayer = scoreSubmitted && entry.name === initials && entry.score === score;
      ctx.fillStyle = isPlayer ? COL_HUD : hexToRgba(COL_STAR[0], 0.7);
      ctx.textAlign = 'center';
      ctx.fillText(`${rank}. ${name}  ${pts}`, cx, y);
      y += 7;
    }
  }

  // Restart hint
  y = H * 0.92;
  ctx.font = '5px monospace';
  ctx.fillStyle = hexToRgba(COL_STAR[0], 0.6);
  ctx.textAlign = 'center';
  ctx.fillText(scoreSubmitted || !initialsMode ? 'CLICK or R to restart' : '', cx, y);
}
