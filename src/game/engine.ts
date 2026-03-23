import type { GameState } from './types';
import { GAME_WIDTH, GAME_HEIGHT, FIRE_COOLDOWN, INVINCIBILITY_DURATION, BASE_SPAWN_INTERVAL, DIFFICULTY_RAMP_INTERVAL, ASTEROID_CONFIG } from './types';
import { InputManager } from './input';
import { createShip, createAsteroid, createProjectile, splitAsteroid, updateShip, updateAsteroids, updateProjectiles, updateParticles, spawnExplosion } from './entities';
import { shipAsteroidCollision, projectileAsteroidCollisions } from './collision';
import { renderMenu, renderPlaying, renderGameOver } from './renderer';

const MAX_DT = 0.05; // cap to prevent physics tunneling

function initMenuState(): GameState {
  const asteroids = [];
  for (let i = 0; i < 6; i++) {
    asteroids.push(createAsteroid('large'));
  }
  return {
    phase: 'menu',
    ship: createShip(),
    asteroids,
    projectiles: [],
    particles: [],
    score: 0,
    difficulty: 1,
    lastSpawnTime: 0,
    elapsedTime: 0,
  };
}

function initPlayingState(): GameState {
  return {
    phase: 'playing',
    ship: createShip(),
    asteroids: [],
    projectiles: [],
    particles: [],
    score: 0,
    difficulty: 1,
    lastSpawnTime: 0,
    elapsedTime: 0,
  };
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
    this.state = initMenuState();
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

  // ── Update ──

  private update(dt: number): void {
    const s = this.state;

    switch (s.phase) {
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

    // Respawn menu asteroids that drifted off
    if (s.asteroids.length < 5) {
      s.asteroids.push(createAsteroid('large'));
    }

    if (this.input.wasPressed('Space')) {
      this.state = initPlayingState();
    }
  }

  private updatePlaying(dt: number): void {
    const s = this.state;
    s.elapsedTime += dt;

    // Difficulty ramp
    s.difficulty = 1 + Math.floor(s.elapsedTime / DIFFICULTY_RAMP_INTERVAL) * 0.15;
    const speedMul = Math.sqrt(s.difficulty);

    // ── Ship movement ──
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

    // ── Shooting ──
    if (
      this.input.isDown('Space') &&
      s.elapsedTime - s.ship.lastShotTime >= FIRE_COOLDOWN
    ) {
      s.projectiles.push(createProjectile(s.ship));
      s.ship.lastShotTime = s.elapsedTime;
    }

    // ── Entity updates ──
    updateAsteroids(s.asteroids, dt);
    updateProjectiles(s.projectiles, dt);
    updateParticles(s.particles, dt);

    // ── Asteroid spawning ──
    const spawnInterval = BASE_SPAWN_INTERVAL / s.difficulty;
    if (s.elapsedTime - s.lastSpawnTime >= spawnInterval) {
      s.asteroids.push(createAsteroid('large', undefined, speedMul));
      s.lastSpawnTime = s.elapsedTime;
    }

    // ── Projectile-asteroid collisions ──
    const hits = projectileAsteroidCollisions(s.projectiles, s.asteroids);
    // Process in reverse index order so splicing doesn't shift indices
    const pIdxs = hits.map((h) => h.projectileIdx).sort((a, b) => b - a);
    const aIdxs = hits.map((h) => h.asteroidIdx).sort((a, b) => b - a);

    for (const h of hits) {
      const asteroid = s.asteroids[h.asteroidIdx];
      s.score += ASTEROID_CONFIG[asteroid.size].score;
      s.particles.push(...spawnExplosion(asteroid.pos, 6));
      s.asteroids.push(...splitAsteroid(asteroid, speedMul));
    }
    for (const idx of aIdxs) s.asteroids.splice(idx, 1);
    for (const idx of pIdxs) s.projectiles.splice(idx, 1);

    // ── Ship-asteroid collision ──
    if (s.ship.invincibleUntil <= s.elapsedTime) {
      const hitIdx = shipAsteroidCollision(s.ship, s.asteroids);
      if (hitIdx >= 0) {
        s.ship.lives -= 1;
        s.ship.invincibleUntil = s.elapsedTime + INVINCIBILITY_DURATION;
        s.particles.push(...spawnExplosion(s.ship.pos, 10));

        if (s.ship.lives <= 0) {
          s.phase = 'gameOver';
        }
      }
    }
  }

  private updateGameOver(dt: number): void {
    const s = this.state;
    s.elapsedTime += dt;
    updateAsteroids(s.asteroids, dt);
    updateParticles(s.particles, dt);

    if (this.input.wasPressed('Space')) {
      this.state = initPlayingState();
    }
  }

  // ── Render ──

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
