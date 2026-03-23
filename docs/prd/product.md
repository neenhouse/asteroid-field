---
title: Asteroid Field Product Requirements
status: ACTIVE
last_updated: 2026-03-22
---

# Asteroid Field — Product Requirements

## Executive Summary

Browser-playable retro space game faithfully ported from the retro-pixel.neenhouse.com Asteroid Field demo. Mouse/touch controls, 3-layer parallax asteroid field, red lasers, rotating wireframe asteroids, and escalating difficulty. Canvas 2D at viewport/4 resolution with pixelated scaling. Deployed to Cloudflare Pages at asteroid-field.neenhouse.com.

## Feature Inventory

| Feature | Status | Notes |
|---------|--------|-------|
| Game Engine | COMPLETE | Canvas 2D loop, dynamic resolution (viewport/SCALE=4), parallax camera |
| Ship Controls | COMPLETE | Mouse/touch following with smooth lerp, ship rotates to face cursor |
| Asteroids | COMPLETE | 3-layer parallax, rotating, wrapping edges, splitting on destruction |
| Combat | COMPLETE | Red lasers fired toward cursor, click/hold auto-fire, 0.15s cooldown |
| Game Flow | COMPLETE | No menu — starts immediately, game over overlay, click/R to restart |
| Sound Effects | COMPLETE | Web Audio API retro sounds (shoot, explode, hit, game over) |
| High Scores | COMPLETE | localStorage persistence, shown on game over screen |
| CRT Overlay | COMPLETE | CSS scanlines + vignette |
| Deployment | COMPLETE | Cloudflare Pages via GitHub Actions, custom domain |

## Active Requirements

### Game Engine

- [x] **REQ-01**: Canvas 2D game loop with variable timestep `COMPLETE`
  - AC: requestAnimationFrame loop, dt capped at 50ms; dynamic resolution recalculated each frame
- [x] **REQ-02**: Dynamic resolution scaling at SCALE=4 `COMPLETE`
  - AC: Canvas internal size = viewport / 4; CSS scales to fill viewport with `image-rendering: pixelated`
- [x] **REQ-03**: 3-layer parallax system (far, mid, near) `COMPLETE`
  - AC: Parallax factors [0.15, 0.4, 1.0]; camera offset based on ship position; stars and asteroids shift per layer

### Ship Controls

- [x] **REQ-04**: Ship follows mouse/touch cursor with smooth lerp `COMPLETE`
  - AC: Ship interpolates toward cursor position; clamped to canvas bounds; deadzone of 2px
- [x] **REQ-05**: Ship rotates to face cursor direction `COMPLETE`
  - AC: Ship angle = atan2(dy, dx) from ship to cursor; triangle rendered at computed angle
- [x] **REQ-06**: Ship wireframe with accent line and engine glow `COMPLETE`
  - AC: Cyan (#00eeff) outline triangle, accent center line (#0088aa), pulsing engine pixel

### Asteroids

- [x] **REQ-07**: Asteroids spawn from edges with random velocity `COMPLETE`
  - AC: Spawn from random edge, safe distance from ship; periodic spawning on timer
- [x] **REQ-08**: 3 asteroid tiers with splitting `COMPLETE`
  - AC: Large (r=14, 20pts) → 3 medium (r=8, 50pts) → 2 small (r=4, 100pts) → destroyed
- [x] **REQ-09**: Asteroids rotate independently and wrap edges `COMPLETE`
  - AC: Random rotation speed per asteroid; wrap around screen boundaries (not despawn)
- [x] **REQ-10**: Parallax depth layers with per-layer rendering `COMPLETE`
  - AC: Far (alpha 0.3), mid (alpha 0.55), near (alpha 1.0 + dark fill); only near-layer collides

### Combat

- [x] **REQ-11**: Red lasers fired toward cursor on click/hold `COMPLETE`
  - AC: Laser speed 200, life 1.2s; drawn as line + glow pixel; muzzle flash particles
- [x] **REQ-12**: Laser-asteroid collision (near layer only) `COMPLETE`
  - AC: Circle-circle collision; asteroid splits; orange + blue particle burst; score awarded
- [x] **REQ-13**: Ship-asteroid collision with invulnerability `COMPLETE`
  - AC: Near-layer only; 2s invulnerability with flicker; ship particles on hit

### Game Flow

- [x] **REQ-14**: No menu — game starts immediately `COMPLETE`
  - AC: Initial asteroid field spawned (5 large near, 4 medium mid, 8 medium far); controls hint fades after 5s
- [x] **REQ-15**: Scoring, lives, difficulty display `COMPLETE`
  - AC: HUD: "SCORE" left, diamond lives center, "LV" right; 7px monospace font
- [x] **REQ-16**: Escalating difficulty every 15 seconds `COMPLETE`
  - AC: Difficulty counter increments every 15s; spawn interval decreases from 2.5s to 0.8s minimum
- [x] **REQ-17**: Game over overlay with restart `COMPLETE`
  - AC: Semi-transparent overlay; shows score, high score; click or R to restart
- [x] **REQ-18**: High score persistence `COMPLETE`
  - AC: Saved to localStorage; displayed on game over; "NEW HIGH SCORE!" callout
- [x] **REQ-19**: Retro sound effects `COMPLETE`
  - AC: Web Audio API — square wave shoot, sawtooth explosion sweep, descending game over tones
- [x] **REQ-20**: CRT scanline overlay `COMPLETE`
  - AC: CSS repeating-gradient scanlines + vignette; subtle opacity to preserve readability

## Intent Backlog

- **Twinkling star parallax**: Stars already twinkle; could add slow drift for more immersion.
- **Power-ups**: Shield, rapid fire, bomb — dropped from destroyed asteroids.
- **Leaderboard**: Cloud-stored high scores with player names.
- **Screen shake**: On ship hit and large asteroid destruction (was implemented, removed in rewrite — could re-add).

## Technical Reference

### Key Files
- `src/App.tsx` — React component: canvas + CRT overlay
- `src/game/engine.ts` — GameEngine class: state, update loop, spawning, collision, rendering orchestration
- `src/game/types.ts` — Constants, interfaces, colors, utility functions (hexToRgba, lerp, clamp, wrap, dist)
- `src/game/renderer.ts` — Canvas 2D drawing: stars, asteroids (per-layer), ship, lasers, particles, HUD
- `src/game/input.ts` — Mouse/touch input manager with click/drag tracking
- `src/game/sound.ts` — Web Audio API retro sound effects
- `src/App.css` — Full-viewport canvas scaling, CRT scanlines/vignette
- `src/index.css` — Dark background, viewport setup

### Architecture Notes
- Faithful port of retro-pixel.neenhouse.com/viewer#asteroid-field (490-line original)
- GameEngine class owns all game state; React only provides the canvas element
- Dynamic resolution: canvas = viewport / SCALE (4); recalculated each frame for resize support
- 3-layer parallax: entities tagged with layer 0/1/2; rendered back-to-front; only layer 2 collides
- Asteroids wrap edges (not despawn); stars wrap with parallax offset
- Ship follows mouse via lerp with exponential smoothing; rotates to face cursor
- Red laser lines with glow pixel + muzzle flash particles
- Entity lifecycle uses `active` flag + array filter cleanup (matching original's pattern)
