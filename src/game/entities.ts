import type { Ship, Asteroid, Projectile, Particle, AsteroidSize, Vec2 } from './types';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SHIP_SIZE,
  SHIP_SPEED,
  PROJECTILE_SPEED,
  ASTEROID_CONFIG,
  PARTICLE_DURATION,
} from './types';

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ── Ship ──

export function createShip(): Ship {
  return {
    pos: { x: GAME_WIDTH / 2, y: GAME_HEIGHT * 0.75 },
    size: SHIP_SIZE,
    lives: 3,
    invincibleUntil: 0,
    lastShotTime: 0,
  };
}

export function updateShip(ship: Ship, dx: number, dy: number, dt: number): void {
  ship.pos.x += dx * SHIP_SPEED * dt;
  ship.pos.y += dy * SHIP_SPEED * dt;
  ship.pos.x = Math.max(ship.size, Math.min(GAME_WIDTH - ship.size, ship.pos.x));
  ship.pos.y = Math.max(ship.size, Math.min(GAME_HEIGHT - ship.size, ship.pos.y));
}

// ── Asteroids ──

function generateVertices(radius: number, count: number): Vec2[] {
  const verts: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius * rand(0.7, 1.3);
    verts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  return verts;
}

export function createAsteroid(
  size: AsteroidSize = 'large',
  pos?: Vec2,
  speedMultiplier = 1,
): Asteroid {
  const cfg = ASTEROID_CONFIG[size];

  let spawnPos: Vec2;
  if (pos) {
    spawnPos = { x: pos.x, y: pos.y };
  } else {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0:
        spawnPos = { x: rand(0, GAME_WIDTH), y: -cfg.radius };
        break;
      case 1:
        spawnPos = { x: GAME_WIDTH + cfg.radius, y: rand(0, GAME_HEIGHT) };
        break;
      case 2:
        spawnPos = { x: rand(0, GAME_WIDTH), y: GAME_HEIGHT + cfg.radius };
        break;
      default:
        spawnPos = { x: -cfg.radius, y: rand(0, GAME_HEIGHT) };
        break;
    }
  }

  // Aim roughly toward center
  const tx = GAME_WIDTH / 2 + rand(-100, 100);
  const ty = GAME_HEIGHT / 2 + rand(-100, 100);
  const angle = Math.atan2(ty - spawnPos.y, tx - spawnPos.x) + rand(-0.5, 0.5);
  const speed = rand(cfg.speedMin, cfg.speedMax) * speedMultiplier;

  const vertCount = size === 'large' ? 10 : size === 'medium' ? 8 : 6;

  return {
    pos: spawnPos,
    vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
    size,
    radius: cfg.radius,
    vertices: generateVertices(cfg.radius, vertCount),
  };
}

export function splitAsteroid(asteroid: Asteroid, speedMultiplier = 1): Asteroid[] {
  const nextSize: AsteroidSize | null =
    asteroid.size === 'large' ? 'medium' : asteroid.size === 'medium' ? 'small' : null;
  if (!nextSize) return [];

  const count = 2 + Math.floor(Math.random() * 2); // 2–3
  const pieces: Asteroid[] = [];
  for (let i = 0; i < count; i++) {
    const offset: Vec2 = {
      x: asteroid.pos.x + rand(-5, 5),
      y: asteroid.pos.y + rand(-5, 5),
    };
    pieces.push(createAsteroid(nextSize, offset, speedMultiplier));
  }
  return pieces;
}

export function updateAsteroids(asteroids: Asteroid[], dt: number): void {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.pos.x += a.vel.x * dt;
    a.pos.y += a.vel.y * dt;

    const margin = a.radius + 60;
    if (
      a.pos.x < -margin ||
      a.pos.x > GAME_WIDTH + margin ||
      a.pos.y < -margin ||
      a.pos.y > GAME_HEIGHT + margin
    ) {
      asteroids.splice(i, 1);
    }
  }
}

// ── Projectiles ──

export function createProjectile(ship: Ship): Projectile {
  return {
    pos: { x: ship.pos.x, y: ship.pos.y - ship.size },
    vel: { x: 0, y: -PROJECTILE_SPEED },
  };
}

export function updateProjectiles(projectiles: Projectile[], dt: number): void {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;

    if (p.pos.y < -10 || p.pos.y > GAME_HEIGHT + 10) {
      projectiles.splice(i, 1);
    }
  }
}

// ── Particles ──

export function spawnExplosion(pos: Vec2, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 80;
    particles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      life: 1.0,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.life -= dt / PARTICLE_DURATION;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
