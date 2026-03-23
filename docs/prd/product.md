---
title: Asteroid Field Product Requirements
status: ACTIVE
last_updated: 2026-03-22
---

# Asteroid Field — Product Requirements

## Executive Summary

Browser-playable retro space game where the player dodges and shoots asteroids in a dense field. Canvas 2D rendering with pixel art aesthetic, simple WASD + Spacebar controls, escalating difficulty. Deployed to Cloudflare Pages. All core gameplay features are implemented.

## Feature Inventory

| Feature | Status | Notes |
|---------|--------|-------|
| Game Engine | COMPLETE | Canvas 2D loop, state management, rendering pipeline |
| Player Ship | COMPLETE | Ship rendering, WASD/arrow movement, screen bounds |
| Asteroids | COMPLETE | Spawning, drifting, breaking into smaller pieces |
| Combat | COMPLETE | Shooting projectiles, asteroid-projectile collision |
| Game Flow | COMPLETE | Start screen, scoring, lives, game over, difficulty ramp |

## Active Requirements

### Game Engine

- [x] **REQ-01**: Canvas 2D game loop running at 60fps with variable timestep `COMPLETE`
  - AC: `requestAnimationFrame` loop with delta-time capping; game updates at consistent rate regardless of frame rate
- [x] **REQ-02**: Game state management (menu, playing, game over) `COMPLETE`
  - AC: Clean state transitions; game can be started, played, and restarted without page reload
- [x] **REQ-03**: Canvas fills viewport with retro resolution scaling `COMPLETE`
  - AC: Game renders at 480x360 scaled up to fill the browser window with nearest-neighbor interpolation for crisp pixels

### Player Ship

- [x] **REQ-04**: Pixel art ship rendered on canvas `COMPLETE`
  - AC: Ship is drawn as a triangle with thruster glow (coded, not loaded from image); faces upward
- [x] **REQ-05**: Ship movement via WASD or arrow keys `COMPLETE`
  - AC: Ship moves in 8 directions; diagonal normalized; ship clamped to canvas bounds
- [x] **REQ-06**: Ship-asteroid collision detection `COMPLETE`
  - AC: Circle-circle collision triggers life loss; 2-second invincibility with flashing effect

### Asteroids

- [x] **REQ-07**: Asteroids spawn from screen edges and drift across the field `COMPLETE`
  - AC: Asteroids enter from random edges aimed toward center; despawn when far off-screen
- [x] **REQ-08**: Multiple asteroid sizes (large, medium, small) `COMPLETE`
  - AC: 3 sizes with proportional radii (25/15/8); each has randomly generated polygon vertices
- [x] **REQ-09**: Asteroids break into smaller pieces when destroyed `COMPLETE`
  - AC: Large breaks into 2-3 medium; medium breaks into 2-3 small; small destroyed completely

### Combat

- [x] **REQ-10**: Player shoots projectiles with spacebar `COMPLETE`
  - AC: Projectiles fire upward from ship; 0.25s cooldown between shots
- [x] **REQ-11**: Projectile-asteroid collision destroys/splits asteroids `COMPLETE`
  - AC: Projectile removed on hit; asteroid splits per REQ-09; particle burst on destruction

### Game Flow

- [x] **REQ-12**: Start screen with title and "Press SPACE to start" `COMPLETE`
  - AC: Retro title screen with starfield; asteroids drift in background; controls hint shown
- [x] **REQ-13**: Score display and scoring system `COMPLETE`
  - AC: Score shown top-left; small=100, medium=50, large=25 points
- [x] **REQ-14**: Lives system with game over `COMPLETE`
  - AC: 3 lives displayed as ship icons top-right; game over shows final score with restart prompt
- [x] **REQ-15**: Escalating difficulty over time `COMPLETE`
  - AC: Spawn rate and asteroid speed increase every 30 seconds via difficulty multiplier

## Intent Backlog

- **High score persistence**: Store top scores in localStorage so players can track personal bests across sessions.
- **Screen shake**: Camera shake on ship hit and large asteroid destruction for juice.
- **Sound effects**: Retro bleeps and bloops for shooting, explosions, and game over.
- **CRT scanline overlay**: Optional CSS/canvas overlay for authentic retro CRT feel.
- **Mobile touch controls**: On-screen joystick and fire button for mobile play.

## Technical Reference

### Key Files
- `src/App.tsx` — React component hosting the game canvas
- `src/game/engine.ts` — GameEngine class: loop, state machine, spawning, difficulty
- `src/game/types.ts` — All interfaces, type aliases, and game constants
- `src/game/entities.ts` — Entity creation, update, splitting, and particle spawning
- `src/game/collision.ts` — Circle-circle collision detection for ship and projectiles
- `src/game/renderer.ts` — Canvas 2D drawing: entities, HUD, menu/game-over screens
- `src/game/input.ts` — Keyboard input manager with held/just-pressed tracking
- `src/App.css` — Canvas scaling with `image-rendering: pixelated`
- `src/index.css` — Dark background, viewport centering

### Architecture Notes
- GameEngine class manages the full lifecycle; React only provides the canvas element
- All game entities are plain objects updated each tick — no ECS needed at this scale
- Rendering uses Canvas 2D paths (ship triangle, asteroid polygons) and `fillRect` (projectiles, particles, stars)
- Collision detection uses circle-circle checks (SHIP_HIT_RADIUS, asteroid.radius, PROJECTILE_RADIUS)
- Internal resolution 480x360, CSS-scaled to viewport with aspect ratio preservation
