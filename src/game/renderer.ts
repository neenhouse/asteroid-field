import type { GameState, Ship, Asteroid, Projectile, Particle } from './types';
import { GAME_WIDTH, GAME_HEIGHT, SHIP_SIZE } from './types';

// ── Starfield (generated once) ──

interface Star {
  x: number;
  y: number;
  brightness: number;
}

const stars: Star[] = [];
for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    brightness: 0.3 + Math.random() * 0.7,
  });
}

// ── Colors ──

const COL_BG = '#0b0b1a';
const COL_SHIP = '#00ffcc';
const COL_SHIP_THRUST = '#ff6633';
const COL_ASTEROID = '#aaaaaa';
const COL_ASTEROID_STROKE = '#cccccc';
const COL_PROJECTILE = '#ffee55';
const COL_PARTICLE = '#ff9944';
const COL_HUD = '#ffffff';
const COL_TITLE = '#00ffcc';
const COL_SUBTITLE = '#8888aa';

// ── Drawing helpers ──

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COL_BG;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  for (const s of stars) {
    ctx.globalAlpha = s.brightness;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
  }
  ctx.globalAlpha = 1;
}

function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, flicker: boolean) {
  if (flicker) return; // invisible on flicker frames

  const { x, y } = ship.pos;
  const s = SHIP_SIZE;

  // Main body (triangle)
  ctx.fillStyle = COL_SHIP;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x - s * 0.8, y + s * 0.6);
  ctx.lineTo(x, y + s * 0.2);
  ctx.lineTo(x + s * 0.8, y + s * 0.6);
  ctx.closePath();
  ctx.fill();

  // Thruster glow
  ctx.fillStyle = COL_SHIP_THRUST;
  ctx.fillRect(Math.floor(x - 2), Math.floor(y + s * 0.4), 4, 2);
}

function drawAsteroid(ctx: CanvasRenderingContext2D, asteroid: Asteroid) {
  const { pos, vertices } = asteroid;

  ctx.strokeStyle = COL_ASTEROID_STROKE;
  ctx.fillStyle = COL_ASTEROID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pos.x + vertices[0].x, pos.y + vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(pos.x + vertices[i].x, pos.y + vertices[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  ctx.fillStyle = COL_PROJECTILE;
  ctx.fillRect(Math.floor(proj.pos.x - 1), Math.floor(proj.pos.y - 2), 3, 5);
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = Math.max(0, p.life);
  ctx.fillStyle = COL_PARTICLE;
  ctx.fillRect(Math.floor(p.pos.x), Math.floor(p.pos.y), 2, 2);
  ctx.globalAlpha = 1;
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, lives: number) {
  // Score (top-left)
  ctx.fillStyle = COL_HUD;
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE ${score}`, 8, 8);

  // Lives as small ship icons (top-right)
  for (let i = 0; i < lives; i++) {
    const lx = GAME_WIDTH - 16 - i * 16;
    const ly = 14;
    const sz = 5;
    ctx.fillStyle = COL_SHIP;
    ctx.beginPath();
    ctx.moveTo(lx, ly - sz);
    ctx.lineTo(lx - sz * 0.7, ly + sz * 0.5);
    ctx.lineTo(lx + sz * 0.7, ly + sz * 0.5);
    ctx.closePath();
    ctx.fill();
  }
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

  // Background asteroids
  for (const a of state.asteroids) drawAsteroid(ctx, a);

  drawCenteredText(ctx, 'ASTEROID FIELD', GAME_HEIGHT * 0.35, '24px monospace', COL_TITLE);
  drawCenteredText(
    ctx,
    'PRESS SPACE TO START',
    GAME_HEIGHT * 0.55,
    '10px monospace',
    COL_SUBTITLE,
  );
  drawCenteredText(
    ctx,
    'WASD / ARROWS to move   SPACE to shoot',
    GAME_HEIGHT * 0.65,
    '8px monospace',
    COL_SUBTITLE,
  );
}

export function renderPlaying(ctx: CanvasRenderingContext2D, state: GameState) {
  drawBackground(ctx);

  for (const a of state.asteroids) drawAsteroid(ctx, a);
  for (const p of state.projectiles) drawProjectile(ctx, p);
  for (const p of state.particles) drawParticle(ctx, p);

  // Ship flicker during invincibility
  const invincible = state.ship.invincibleUntil > state.elapsedTime;
  const flicker = invincible && Math.floor(state.elapsedTime * 10) % 2 === 0;
  drawShip(ctx, state.ship, flicker);

  drawHUD(ctx, state.score, state.ship.lives);
}

export function renderGameOver(ctx: CanvasRenderingContext2D, state: GameState) {
  drawBackground(ctx);

  for (const a of state.asteroids) drawAsteroid(ctx, a);
  for (const p of state.particles) drawParticle(ctx, p);

  drawCenteredText(ctx, 'GAME OVER', GAME_HEIGHT * 0.35, '24px monospace', '#ff4444');
  drawCenteredText(
    ctx,
    `SCORE  ${state.score}`,
    GAME_HEIGHT * 0.48,
    '14px monospace',
    COL_HUD,
  );
  drawCenteredText(
    ctx,
    'PRESS SPACE TO RESTART',
    GAME_HEIGHT * 0.62,
    '10px monospace',
    COL_SUBTITLE,
  );
}
