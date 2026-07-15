# @cypher/engine — rules engine

Plain TypeScript implementation of Cypher System mechanics: pools, effort, ability costs, and related rules math.

## Rules for this package

- No framework imports. No React, no Next.js, no Astro, no DOM APIs — this package must be usable from either app (or a test runner) with zero UI dependencies. If a function needs a framework type to make sense, it belongs in `@cypher/ui` or the consuming app, not here.
- Pure functions only. Given the same inputs, a function here should always return the same output, with no hidden mutation of arguments and no reliance on ambient/global state.
- Test-first. Write the Vitest spec for a rule (e.g. effort cost math, pool depletion) before or alongside the implementation, not after. A rules engine is only trustworthy if its edge cases (zero pool, negative effort, etc.) are pinned down by tests.

## Current state

`src/index.ts` is a stub (`ENGINE_VERSION`, a placeholder `PoolName` type). Real modules for pools/effort/abilities don't exist yet — build them as separate files under `src/` rather than growing `index.ts` into a monolith, and re-export from there.
