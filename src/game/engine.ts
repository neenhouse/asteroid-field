import type { GameState } from './types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FIRE_COOLDOWN,
  INVINCIBILITY_DURATION,
  BASE_SPAWN_INTERVAL,
  DIFFICULTY_RAMP_INTERVAL,
  ASTEROID_CONFIG,
} from './types';
import { InputManager } from './input';
import {
  createShip,
  createAsteroid,
  createProjectile,
  splitAsteroid,
  updateShip,
  updateAsteroids,
  updateProjectiles,
  updateParticles,
  spawnExplosion,
} from './entities';
import { shipAsteroidCollision, projectileAsteroidCollisions } from './collision';
import { renderMenu, renderPlaying, renderGameOver } from './renderer';
import { playShoot, playExplosion, playShipHit, playGameOver } from './sound';

const MAX_DT = 0.05;
const LS_KEY = 'asteroid-field-highscore';

function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(LS_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number): void {
  try {
    localStorage.setItem(LS_KEY, String(score));
  } catch {
    /* storage unavailable */
  }
}

function initMenuState(highScore: number): GameState {
  const asteroids = [];
  for (let i = 0; i < 8; i++) asteroids.push(createAsteroid('large'));
  for (let i = 0; i < 4; i++) asteroids.push(createAsteroid('medium'));
  for (let i = 0; i < 4; i++) asteroids.push(createAsteroid('small'));
  return {
    phase: 'menu',
    ship: createShip(),
    asteroids,
    projectiles: [],
    particles: [],
    score: 0,
    highScore,
    level: 1,
    difficulty: 1,
    lastSpawnTime: 0,
    elapsedTime: 0,
    shake: { intensity: 0, offsetX: 0, offsetY: 0 },
  };
}

function initPlayingState(highScore: number): GameState {
  const asteroids = [];
  for (let i = 0; i < 3; i++) asteroids.push(createAsteroid('large'));
  return {
    phase: 'playing',
    ship: createShip(),
    asteroids,
    projectiles: [],
    particles: [],
    score: 0,
    highScore,
    level: 1,
    difficulty: 1,
    lastSpawnTime: 0,
    elapsedTime: 0,
    shake: { intensity: 0, offsetX: 0, offsetY: 0 },
  };
}

function updateShake(state: GameState) {
  const s = state.shake;
  if (s.intensity > 0) {
    s.offsetX = (Math.random() - 0.5) * s.intensity * 2;
    s.offsetY = (Math.random() - 0.5) * s.intensity * 2;
    s.intensity *= 0.88;
    if (s.intensity < 0.3) {
      s.intensity = 0;
      s.offsetX = 0;
      s.offsetY = 0;
    }
  }
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private state: GameState;
  private animId = 0;
  private lastTime = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;

    this.input = new InputManager();
    this.state = initMenuState(loadHighScore());
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animId);
    this.input.destroy();
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    const dt = Math.min((now - this.lastTime) / 1000, MAX_DT);
    this.lastTime = now;

    this.update(dt);
    this.render();
    this.input.clearFrame();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    switch (this.state.phase) {
      case 'menu':
        this.updateMenu(dt);
        break;
      case 'playing':
        this.updatePlaying(dt);
        break;
      case 'gameOver':
        this.updateGameOver(dt);
        break;
    }
  }

  private updateMenu(dt: number): void {
    const s = this.state;
    s.elapsedTime += dt;
    updateAsteroids(s.asteroids, dt);

    // Keep menu asteroid field populated
    if (s.asteroids.length < 10) {
      s.asteroids.push(createAsteroid(Math.random() < 0.5 ? 'large' : 'medium'));
    }

    if (this.input.wasPressed('Space')) {
      this.state = initPlayingState(s.highScore);
    }
  }

  private updatePlaying(dt: number): void {
    const s = this.state;
    s.elapsedTime += dt;

    // Level & difficulty
    s.level = 1 + Math.floor(s.elapsedTime / DIFFICULTY_RAMP_INTERVAL);
    s.difficulty = 1 + (s.level - 1) * 0.15;
    const speedMul = Math.sqrt(s.difficulty);

    // Ship movement
    let dx = 0;
    let dy = 0;
    if (this.input.isDown('ArrowLeft') || this.input.isDown('KeyA')) dx -= 1;
    if (this.input.isDown('ArrowRight') || this.input.isDown('KeyD')) dx += 1;
    if (this.input.isDown('ArrowUp') || this.input.isDown('KeyW')) dy -= 1;
    if (this.input.isDown('ArrowDown') || this.input.isDown('KeyS')) dy += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    updateShip(s.ship, dx, dy, dt);

    // Shooting
    if (this.input.isDown('Space') && s.elapsedTime - s.ship.lastShotTime >= FIRE_COOLDOWN) {
      s.projectiles.push(createProjectile(s.ship));
      s.ship.lastShotTime = s.elapsedTime;
      playShoot();
    }

    // Entity updates
    updateAsteroids(s.asteroids, dt);
    updateProjectiles(s.projectiles, dt);
    updateParticles(s.particles, dt);

    // Asteroid spawning
    const spawnInterval = BASE_SPAWN_INTERVAL / s.difficulty;
    if (s.elapsedTime - s.lastSpawnTime >= spawnInterval) {
      s.asteroids.push(createAsteroid('large', undefined, speedMul));
      s.lastSpawnTime = s.elapsedTime;
    }

    // Screen shake decay
    updateShake(s);

    // Projectile-asteroid collisions
    const hits = projectileAsteroidCollisions(s.projectiles, s.asteroids);
    const pIdxs = hits.map((h) => h.projectileIdx).sort((a, b) => b - a);
    const aIdxs = hits.map((h) => h.asteroidIdx).sort((a, b) => b - a);

    for (const h of hits) {
      const asteroid = s.asteroids[h.asteroidIdx];
      s.score += ASTEROID_CONFIG[asteroid.size].score;
      s.particles.push(...spawnExplosion(asteroid.pos, 8));
      s.asteroids.push(...splitAsteroid(asteroid, speedMul));
      playExplosion(asteroid.size === 'large');
      // Screen shake on hit
      const shakeAmt = asteroid.size === 'large' ? 4 : asteroid.size === 'medium' ? 2 : 1;
      s.shake.intensity = Math.max(s.shake.intensity, shakeAmt);
    }
    for (const idx of aIdxs) s.asteroids.splice(idx, 1);
    for (const idx of pIdxs) s.projectiles.splice(idx, 1);

    // Ship-asteroid collision
    if (s.ship.invincibleUntil <= s.elapsedTime) {
      const hitIdx = shipAsteroidCollision(s.ship, s.asteroids);
      if (hitIdx >= 0) {
        s.ship.lives -= 1;
        s.ship.invincibleUntil = s.elapsedTime + INVINCIBILITY_DURATION;
        s.particles.push(...spawnExplosion(s.ship.pos, 12));
        s.shake.intensity = Math.max(s.shake.intensity, 8);
        playShipHit();

        if (s.ship.lives <= 0) {
          s.phase = 'gameOver';
          if (s.score > s.highScore) {
            s.highScore = s.score;
            saveHighScore(s.score);
          }
          playGameOver();
        }
      }
    }
  }

  private updateGameOver(dt: number): void {
    const s = this.state;
    s.elapsedTime += dt;
    updateAsteroids(s.asteroids, dt);
    updateParticles(s.particles, dt);
    updateShake(s);

    if (this.input.wasPressed('Space')) {
      this.state = initPlayingState(this.state.highScore);
    }
  }

  private render(): void {
    switch (this.state.phase) {
      case 'menu':
        renderMenu(this.ctx, this.state);
        break;
      case 'playing':
        renderPlaying(this.ctx, this.state);
        break;
      case 'gameOver':
        renderGameOver(this.ctx, this.state);
        break;
    }
  }
}
