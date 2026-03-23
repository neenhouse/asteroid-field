import type { Ship, Asteroid, Projectile } from './types';
import { SHIP_HIT_RADIUS, PROJECTILE_RADIUS } from './types';

function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
}

/** Returns index of the asteroid the ship collided with, or -1. */
export function shipAsteroidCollision(ship: Ship, asteroids: Asteroid[]): number {
  for (let i = 0; i < asteroids.length; i++) {
    const a = asteroids[i];
    if (circlesOverlap(ship.pos.x, ship.pos.y, SHIP_HIT_RADIUS, a.pos.x, a.pos.y, a.radius)) {
      return i;
    }
  }
  return -1;
}

export interface HitPair {
  projectileIdx: number;
  asteroidIdx: number;
}

/** Returns all projectile-asteroid hit pairs (each index used at most once). */
export function projectileAsteroidCollisions(
  projectiles: Projectile[],
  asteroids: Asteroid[],
): HitPair[] {
  const hits: HitPair[] = [];
  const usedP = new Set<number>();
  const usedA = new Set<number>();

  for (let pi = 0; pi < projectiles.length; pi++) {
    if (usedP.has(pi)) continue;
    const p = projectiles[pi];
    for (let ai = 0; ai < asteroids.length; ai++) {
      if (usedA.has(ai)) continue;
      const a = asteroids[ai];
      if (circlesOverlap(p.pos.x, p.pos.y, PROJECTILE_RADIUS, a.pos.x, a.pos.y, a.radius)) {
        hits.push({ projectileIdx: pi, asteroidIdx: ai });
        usedP.add(pi);
        usedA.add(ai);
        break;
      }
    }
  }
  return hits;
}
