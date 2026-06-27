# Neon Reclaim

Neon Reclaim is a browser-based sci-fi dungeon crawler built with Phaser, Vite, and TypeScript. You fight through machine-held city districts, salvage microchips, buy field upgrades, and invest in permanent improvements between runs.

## Game Overview

- Explore procedurally generated room graphs across three districts: Ruined Downtown, Abandoned Mall, and the Automated Data Core.
- Fight enemy archetypes with distinct behaviors, including swarmers, shield units, snipers, mine layers, support units, and hackers.
- Collect microchips from cleared rooms and spend them at field vendors during a run.
- Unlock and use weapons including the Pulse Pistol, Rail Rifle, Scatter Coil, and Arc Lancer.
- Defeat district bosses to advance deeper into the city.
- Keep retained microchips between runs and spend them on permanent upgrades.
- Save data is stored locally in the browser through `localStorage`.

## Controls

| Input               | Action                           |
| ------------------- | -------------------------------- |
| `W`, `A`, `S`, `D`  | Move                             |
| Mouse click         | Aim and fire                     |
| `Space`             | Dodge                            |
| `E`                 | Interact                         |
| `P`                 | Pause                            |
| `M`                 | Mute or unmute audio             |
| `Esc` / `Backspace` | Leave upgrade and vendor screens |

## Tech Stack

- [Phaser](https://phaser.io/) for rendering, input, scenes, and arcade physics.
- [Vite](https://vite.dev/) for the development server and production build.
- [TypeScript](https://www.typescriptlang.org/) for strict type checking.
- [Vitest](https://vitest.dev/) for logic tests.
- [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) for code quality and formatting.

## Requirements

Use a Node.js version supported by the project:

```bash
nvm use
```

The project targets:

```text
^20.19.0 || ^22.13.0 || >=24
```

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

The Vite dev server binds to `127.0.0.1` and defaults to port `5173`.

## Build And Quality Checks

Run the production build:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

Run TypeScript without emitting files:

```bash
npm run typecheck
```

Run ESLint:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

Format the project:

```bash
npm run format
```

Run the full local verification suite:

```bash
npm run check
```

## Project Structure

```text
.
├── index.html
├── src
│   ├── data.ts              # Static definitions for dungeons, enemies, bosses, items, and upgrades
│   ├── dungeon.ts           # Procedural room graph generation
│   ├── save.ts              # Browser save loading, migration, reset, and persistence helpers
│   ├── state.ts             # Current run and save state transitions
│   ├── style.css            # Page-level styles
│   ├── types.ts             # Shared game types
│   └── scenes               # Phaser scenes for boot, menu, gameplay, vendor, upgrades, death, and victory
├── eslint.config.js
├── vite.config.ts
└── tsconfig.json
```

## Testing Notes

The current tests focus on deterministic game logic that can run outside the Phaser renderer:

- Dungeon graph generation and reachability.
- Static content references between dungeons, enemies, bosses, vendors, items, weapons, and upgrades.
- Save defaults and migration behavior.

Phaser scene behavior is currently verified manually by running the game in the browser.

## Release Checklist

Before pushing a branch, run:

```bash
npm run check
```

For a quick manual smoke test:

1. Start the dev server with `npm run dev`.
2. Start a run from the main menu.
3. Move, fire, dodge, clear a room, and transition to another room.
4. Open a vendor or upgrade screen if available.
5. Toggle pause and mute.
6. Refresh the browser and confirm save data loads as expected.

## License

Neon Reclaim is licensed under the GNU General Public License v3.0. See [LICENSE](./LICENSE).

## AI Attribution (AIA)

AIA EAI Hin R Codex (gpt-5.5) v1.0
