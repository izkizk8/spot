/**
 * AsyncStorage Jest mock (feature 020 — T012).
 *
 * The project-wide setup at `test/setup.ts` already mocks
 * `@react-native-async-storage/async-storage` via the official
 * `@react-native-async-storage/async-storage/jest/async-storage-mock`
 * helper. This file re-exports that same in-memory backend so any test
 * that imports the mock directly (rather than relying on the global
 * setup hook) gets identical behavior.
 *
 * Tests that need throw-injection (e.g. mood-store.test.ts) override
 * this with an inline `jest.mock(...)` block — that pattern is
 * unaffected by this file.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mock = require('@react-native-async-storage/async-storage/jest/async-storage-mock');

module.exports = mock;
