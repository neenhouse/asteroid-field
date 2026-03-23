import type { GameState, Ship, Asteroid, Projectile, Particle } from './types';
import { GAME_WIDTH, GAME_HEIGHT, SHIP_SIZE } from './types';

// ── Colors (matching retro-pixel original) ──

const COL_BG = '#0a0a14';
const COL_SHIP = '#00eedd';
const COL_ASTEROID = '#aa9944';
const COL_PROJECTILE = '#00eedd';
const COL_HUD = '#00eedd';
const COL_SUBTITLE = '#667788';
const COL_GAMEOVER = '#ff4444';

// ── Starfield (dense, multi-colored pixel noise) ──

const STAR_PALETTE = [
  '#111133', '#1a1a44', '#222255', '#2a2a66',
  '#333377', '#3a3a88', '#444499', '#4a4aaa',
  '#5555bb', '#5a5acc', '#6666dd', '#7777ee',
  '#5533aa', '#6644bb', '#7755cc', '#8866dd',
  '#666688', '#777799', '#8888aa', '#99aabb',
];

interface Star {
  x: number;
  y: number;
  color: string;
}

const stars: Star[] = [];
for (let i = 0; i < 400; i++) {
  stars.push({
    x: Math.floor(Math.random() * GAME_WIDTH),
    y: Math.floor(Math.random() * GAME_HEIGHT),
    color: STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)],
  });
}

// ── Drawing helpers ──

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COL_BG;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  for (const s of stars) {
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, s.y, 1, 1);
  }
}

function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, flicker: boolean) {
  if (flicker) return;
  const { x, y } = ship.pos;
  const s = SHIP_SIZE;

  // Wireframe triangle (matching original)
  ctx.strokeStyle = COL_SHIP;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x - s * 0.8, y + s * 0.6);
  ctx.lineTo(x, y + s * 0.2);
  ctx.lineTo(x + s * 0.8, y + s * 0.6);
  ctx.closePath();
  ctx.stroke();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, asteroid: Asteroid) {
  const { pos, vertices } = asteroid;

  // Wireframe only — no fill (matching original)
  ctx.strokeStyle = COL_ASTEROID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pos.x + vertices[0].x, pos.y + vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(pos.x + vertices[i].x, pos.y + vertices[i].y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  ctx.fillStyle = COL_PROJECTILE;
  ctx.fillRect(Math.floor(proj.pos.x - 1), Math.floor(proj.pos.y - 2), 2, 4);
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = Math.max(0, p.life);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.floor(p.pos.x), Math.floor(p.pos.y), 1, 1);
  ctx.globalAlpha = 1;
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.7, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size * 0.7, cy);
  ctx.closePath();
  ctx.fill();
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, lives: number, level: number) {
  ctx.fillStyle = COL_HUD;
  ctx.font = '10px monospace';
  ctx.textBaseline = 'top';

  // Score (top-left)
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 8, 8);

  // Lives as diamonds (top-center)
  const diamondSize = 4;
  const gap = 12;
  const startX = GAME_WIDTH / 2 - ((lives - 1) * gap) / 2;
  for (let i = 0; i < lives; i++) {
    drawDiamond(ctx, startX + i * gap, 14, diamondSize);
  }

  // Level (top-right)
  ctx.textAlign = 'right';
  ctx.fillText(`LV ${level}`, GAME_WIDTH - 8, 8);
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, GAME_WIDTH / 2, y);
}

// ── Public render functions ──

export function renderMenu(ctx: CanvasRenderingContext2D, state: GameState) {
  drawBackground(ctx);

  for (const a of state.asteroids) drawAsteroid(ctx, a);

  drawCenteredText(ctx, 'ASTEROID FIELD', GAME_HEIGHT * 0.3, '20px monospace', COL_HUD);
  drawCenteredText(ctx, 'PRESS SPACE TO START', GAME_HEIGHT * 0.48, '8px monospace', COL_SUBTITLE);
  drawCenteredText(
    ctx,
    'WASD / ARROWS to move   SPACE to shoot',
    GAME_HEIGHT * 0.56,
    '7px monospace',
    COL_SUBTITLE,
  );

  if (state.highScore > 0) {
    drawCenteredText(
      ctx,
      `HIGH SCORE  ${state.highScore}`,
      GAME_HEIGHT * 0.68,
      '10px monospace',
      COL_HUD,
    );
  }
}

export function renderPlaying(ctx: CanvasRenderingContext2D, state: GameState) {
  drawBackground(ctx);

  // Apply screen shake to game world
  ctx.save();
  ctx.translate(state.shake.offsetX, state.shake.offsetY);

  for (const a of state.asteroids) drawAsteroid(ctx, a);
  for (const p of state.projectiles) drawProjectile(ctx, p);
  for (const p of state.particles) drawParticle(ctx, p);

  const invincible = state.ship.invincibleUntil > state.elapsedTime;
  const flicker = invincible && Math.floor(state.elapsedTime * 10) % 2 === 0;
  drawShip(ctx, state.ship, flicker);

  ctx.restore();

  // HUD drawn without shake
  drawHUD(ctx, state.score, state.ship.lives, state.level);
}

export function renderGameOver(ctx: CanvasRenderingContext2D, state: GameState) {
  drawBackground(ctx);

  for (const a of state.asteroids) drawAsteroid(ctx, a);
  for (const p of state.particles) drawParticle(ctx, p);

  drawCenteredText(ctx, 'GAME OVER', GAME_HEIGHT * 0.3, '20px monospace', COL_GAMEOVER);
  drawCenteredText(ctx, `SCORE  ${state.score}`, GAME_HEIGHT * 0.43, '12px monospace', COL_HUD);

  if (state.score >= state.highScore && state.score > 0) {
    drawCenteredText(ctx, 'NEW HIGH SCORE!', GAME_HEIGHT * 0.53, '10px monospace', COL_HUD);
  } else if (state.highScore > 0) {
    drawCenteredText(
      ctx,
      `HIGH SCORE  ${state.highScore}`,
      GAME_HEIGHT * 0.53,
      '10px monospace',
      COL_SUBTITLE,
    );
  }

  drawCenteredText(
    ctx,
    'PRESS SPACE TO RESTART',
    GAME_HEIGHT * 0.67,
    '8px monospace',
    COL_SUBTITLE,
  );
}
