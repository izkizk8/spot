# Contract: Unit Test Examples

The unit test examples are executable documentation. They must pass in the normal unit test run and be easy to copy for future features.

## Required Example Coverage

| Example                       | Required Proof                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| TypeScript logic              | Imports project TypeScript code and asserts deterministic behavior.                                          |
| React Native component render | Uses `@testing-library/react-native` to render a project component and assert visible output or props.       |
| Path alias import             | Demonstrates `@/*` or `@/assets/*` resolution in tests.                                                      |
| Mocks/setup                   | Demonstrates or documents required setup for React Native, Expo modules, platform-specific files, or assets. |

## Test Harness Contract

- Jest uses the `jest-expo` preset.
- Setup file lives under `test/setup.ts`.
- Tests live under `test/unit/` unless a later feature adds another test class.
- Jest config maps project aliases consistently with `tsconfig.json`.
- The default `pnpm test` command runs the examples once and exits.

## Documentation Contract

Developer documentation must explain:

- where examples live;
- how to add a new unit test;
- how to render a React Native component;
- how to import code through aliases;
- how to add or update required mocks/setup.
