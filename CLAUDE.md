# Asteroid Field

Retro pixel art space game — dodge asteroids, shoot them, and survive as long as possible. Canvas 2D, React 19, TypeScript.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Canvas 2D
- **Styling**: CSS (retro pixel aesthetic — dark space background, pixel-art sprites)
- **Deploy**: Cloudflare Pages via GitHub Actions
- **Tooling**: pnpm, mise

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm preview` — Preview production build

## Game Concept

Inspired by the asteroid-field scene from retro-pixel.neenhouse.com. The player controls a small ship in a dense asteroid field. Asteroids drift across the screen. The player can:
- Move in all directions (WASD or arrow keys)
- Shoot (spacebar)
- Dodge asteroids that break into smaller pieces when shot

The aesthetic is retro pixel art — low resolution, limited color palette, CRT-style scanlines optional.
