# AGENTS

## Purpose
- Object helper functions and type utilities (single-file library).

## Commands
- `npm run build` - Build `lib/` output via `tsc`.
- `npm test` - Run Jest (passWithNoTests enabled).
- `npm run clean` - Remove `lib/` and coverage.

## Structure
- `src/obby.ts` defines all exported helpers, types, and the `obby` class.
- `lib/` is generated output.

## Conventions
- Prefer pure helpers; extend `src/obby.ts` instead of adding new modules.
- `mapObject` and `filterObject` work on `[key, value]` entries and return new objects.

## Gotchas
- Both a namespace `obby` and a class `obby` exist; be explicit to avoid name confusion.
- `AnyParameters` is tuned for rest parameter typing (`[] | [T] | T[]`).
