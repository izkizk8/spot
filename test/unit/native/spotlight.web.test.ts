/**
 * Tests for Spotlight bridge Web stub — feature 031 / T012.
 *
 * Uses jest.isolateModules + jest.doMock pattern per FR-123.
 * Additionally asserts no Platform or expo-modules-core import (FR-012/SC-007).
 */

import * as fs from 'fs';
import * as path from 'path';

type BridgeModule = typeof import('@/native/spotlight.web');

function loadWebBridge(): BridgeModule {
  let mod: BridgeModule | undefined;
  jest.isolateModules(() => {
    mod = require('@/native/spotlight.web') as BridgeModule;
  });
  if (!mod) throw new Error('failed to load Web bridge module');
  return mod;
}

describe('spotlight.web bridge stub', () => {
  it('isAvailable() returns false (FR-091)', () => {
    const b = loadWebBridge();
    expect(b.isAvailable()).toBe(false);
  });

  it('index([item]) rejects with SpotlightNotSupported', async () => {
    const b = loadWebBridge();
    await expect(
      b.index([
        {
          id: 'test',
          title: 'Test',
          contentDescription: 'desc',
          keywords: [],
          domainIdentifier: 'com.izkizk8.spot.modules',
        },
      ]),
    ).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('delete([id]) rejects with SpotlightNotSupported', async () => {
    const b = loadWebBridge();
    await expect(b.delete(['id1'])).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('deleteAll() rejects with SpotlightNotSupported', async () => {
    const b = loadWebBridge();
    await expect(b.deleteAll()).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('search(q, 25) rejects with SpotlightNotSupported', async () => {
    const b = loadWebBridge();
    await expect(b.search('query', 25)).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('markCurrentActivity rejects with SpotlightNotSupported', async () => {
    const b = loadWebBridge();
    await expect(
      b.markCurrentActivity({ title: 't', keywords: [], userInfo: {} }),
    ).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('clearCurrentActivity() rejects with SpotlightNotSupported', async () => {
    const b = loadWebBridge();
    await expect(b.clearCurrentActivity()).rejects.toBeInstanceOf(b.SpotlightNotSupported);
  });

  it('thrown error is instanceof SpotlightNotSupported AND instanceof Error (FR-092)', async () => {
    const b = loadWebBridge();
    let caught: unknown;
    try {
      await b.deleteAll();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(b.SpotlightNotSupported);
    expect(caught).toBeInstanceOf(Error);
  });

  it('file does NOT statically import react-native Platform or expo-modules-core (FR-012/SC-007)', () => {
    const filePath = path.resolve(__dirname, '../../../src/native/spotlight.web.ts');
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/from ['"]react-native['"]/);
    expect(src).not.toMatch(/from ['"]expo-modules-core['"]/);
    // Verify no actual require/import of the native module mechanism
    expect(src).not.toMatch(/requireOptional/);
  });
});
