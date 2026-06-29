# AGENTS.md

This file is the development guide for agents and contributors working on Neon Reclaim. Keep the public README focused on the game; put implementation, verification, and workflow details here.

## Project Snapshot

Neon Reclaim is a browser-based sci-fi dungeon crawler built with Phaser, Vite, and TypeScript.

- Runtime: browser
- Game engine: Phaser 3
- Build tool: Vite
- Language: TypeScript with `strict` enabled
- Tests: Vitest
- Linting: ESLint flat config with type-aware TypeScript rules
- Formatting: Prettier
- Persistence: browser `localStorage`

## Requirements

Use a Node.js version supported by `package.json`:

```text
^20.19.0 || ^22.13.0 || >=24
```

No project-specific Node version manager is required. Do not add `.nvmrc`, Volta, asdf, or similar tool-specific version files unless explicitly requested.

## Install And Run

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

The Vite dev server binds to `127.0.0.1` and defaults to port `5173`.

## Project Structure

```text
.
├── index.html
├── src
│   ├── data.ts              # Static definitions for dungeons, enemies, bosses, items, and upgrades
│   ├── data.test.ts         # Static content integrity tests
│   ├── dungeon.ts           # Procedural room graph generation
│   ├── dungeon.test.ts      # Dungeon graph generation tests
│   ├── main.ts              # Phaser game bootstrap
│   ├── save.ts              # Browser save loading, migration, reset, and persistence helpers
│   ├── save.test.ts         # Save default and migration tests
│   ├── state.ts             # Current run and save state transitions
│   ├── state.test.ts        # Run state transition tests
│   ├── style.css            # Page-level styles
│   ├── types.ts             # Shared game types
│   └── scenes               # Phaser scenes for boot, menu, gameplay, vendor, upgrades, death, and victory
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Core Commands

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

## Verification Policy

Before pushing code, run:

```bash
npm run check
```

This runs linting, type checking, tests, and the production build.

The production build may report a Vite chunk-size warning because Phaser is a large dependency. Treat build failure as blocking; treat the chunk-size warning as informational unless the task is specifically about bundle size.

For documentation-only changes, at minimum run:

```bash
npx prettier --check README.md AGENTS.md
```

Run broader checks when the documentation change affects documented commands, supported versions, or project structure.

## Testing Strategy

Current automated tests focus on deterministic game logic that can run outside the Phaser renderer:

- Dungeon graph generation and reachability.
- Static content references between dungeons, enemies, bosses, vendors, items, weapons, and upgrades.
- Save defaults and migration behavior.
- Run state transitions.

Prefer adding tests around pure TypeScript modules before testing Phaser scenes directly. Good test targets include:

- New dungeon generation rules.
- Save schema changes and migrations.
- Item, weapon, enemy, vendor, and boss data references.
- Run state transitions such as starting runs, advancing dungeons, purchases, and retained progress.

Phaser scene behavior is currently verified manually in the browser. If a change touches scene rendering, input, physics, audio, or scene transitions, perform a browser smoke test in addition to automated tests.

## Manual Smoke Test

Use this flow after gameplay or scene changes:

1. Start the dev server with `npm run dev`.
2. Open the local Vite URL in a browser.
3. Start a run from the main menu.
4. Move with `W`, `A`, `S`, `D`.
5. Aim and fire with the mouse.
6. Dodge with `Space`.
7. Clear a room and transition through a door.
8. Interact with a vendor or upgrade screen if available.
9. Toggle pause with `P`.
10. Toggle mute with `M`.
11. Refresh the browser and confirm save data loads as expected.

For mobile or touch-control changes, also run a landscape phone-sized smoke test:

1. Open the local Vite URL in a mobile browser or desktop browser device emulation.
2. Start a run from the main menu.
3. Move with the left virtual stick.
4. Aim and fire with the right virtual stick.
5. Dodge with the on-screen dodge button.
6. Interact with a vendor using the on-screen use button.
7. Return from vendor, upgrade, and settings screens using visible on-screen buttons.
8. Toggle pause and mute with the on-screen buttons.
9. Confirm the page does not scroll, zoom, or select text during play.

## Coding Guidelines

- Keep TypeScript strictness intact. Do not loosen `tsconfig.json` to bypass errors.
- Prefer explicit shared types in `src/types.ts` for game state, static definitions, and cross-module contracts.
- Keep deterministic game logic outside Phaser scenes when practical so it can be tested with Vitest.
- Keep Phaser scene code focused on rendering, input, physics, and scene orchestration.
- Use structured data in `src/data.ts` for game content instead of duplicating constants across scenes.
- Preserve browser `localStorage` save compatibility. If the save shape changes, update `loadSave()` migration behavior and add tests.
- Keep generated build output such as `dist/` out of version control.
- Do not add GitHub Actions or other CI configuration unless explicitly requested.

## Formatting And Linting

Prettier owns formatting. ESLint owns code quality rules.

- Use `npm run format` for mechanical formatting changes.
- Use `npm run lint:fix` only when the automated fix is obviously safe.
- Keep `.prettierignore` and `.gitignore` aligned for generated output.
- Avoid unrelated formatting churn in files outside the requested change unless the task is specifically a formatting pass.

## Dependency Guidance

- Keep Phaser as the rendering/gameplay framework.
- Prefer small, well-maintained dependencies only when they remove meaningful complexity.
- Do not add runtime dependencies for simple utilities that TypeScript or the existing code can handle clearly.
- After dependency changes, commit both `package.json` and `package-lock.json`.

## Git Workflow

- Check the worktree before editing:

```bash
git status --short --branch
```

- Do not overwrite unrelated user changes.
- This project uses Conventional Commits for commit messages. Use subjects in the form `<type>[optional scope]: <description>`.
- Keep commits focused.
- Run the appropriate verification command before committing.
- When asked to push, push the current branch to its upstream unless the user specifies a different branch.

## Release Checklist

Before pushing a release branch:

1. Confirm `package.json` version is correct.
2. Run `npm run check`.
3. Perform the manual smoke test for gameplay changes.
4. Confirm `git status --short` contains only intended changes.
5. Commit with a clear Conventional Commit message.
6. Push the branch.

## AI Attribution

Preserve the AI attribution section in the README unless explicitly asked to change or remove it.
