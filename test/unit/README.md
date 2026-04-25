# Unit Test Examples

The executable examples in `test/unit/examples/` are the starting point for new local tests.
They run through `pnpm test` and are included in the full `pnpm check` gate.

## Examples

| File                                                 | Pattern                 | What to copy                                                                                      |
| ---------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `test/unit/examples/typescript-logic.test.ts`        | TypeScript logic        | Import project constants or helpers through `@/*` and assert deterministic output.                |
| `test/unit/examples/react-native-component.test.tsx` | React Native rendering  | Render a project component with `@testing-library/react-native` and assert visible text or props. |
| `test/unit/examples/alias-and-mocks.test.tsx`        | Aliases and setup mocks | Use `@/*` imports and rely on shared Expo mocks from `test/setup.ts`.                             |

## Adding A Test

1. Add a `*.test.ts` or `*.test.tsx` file under `test/unit/`.
2. Import app code with `@/*` or assets with `@/assets/*`, matching `tsconfig.json` and `jest.config.js`.
3. Use `render` and `screen` from `@testing-library/react-native` for component tests.
4. Add shared native or Expo mocks to `test/setup.ts` only when more than one test needs them.
5. Run `pnpm test`, then `pnpm check` before handing off changes.

Keep examples small and deterministic so they stay useful as copyable documentation.
