/**
 * Tests for Spotlight bridge shared types — feature 031 / T006.
 *
 * Covers type-level and value-level invariants from
 * contracts/spotlight-bridge.contract.ts.
 */

import type {
  ActivityState,
  IndexedState,
  SearchableItem,
  SpotlightBridge,
  UserActivityDescriptor,
} from '@/native/spotlight.types';
import {
  ACTIVITY_TYPE,
  DEFAULT_SEARCH_LIMIT,
  DOMAIN_IDENTIFIER,
  NATIVE_MODULE_NAME,
  SpotlightNotSupported,
} from '@/native/spotlight.types';

describe('spotlight.types: SpotlightNotSupported error class', () => {
  it('SpotlightNotSupported is a class whose instances pass instanceof SpotlightNotSupported (FR-091)', () => {
    const err = new SpotlightNotSupported('test message');
    expect(err).toBeInstanceOf(SpotlightNotSupported);
  });

  it('SpotlightNotSupported instances pass instanceof Error (FR-092)', () => {
    const err = new SpotlightNotSupported();
    expect(err).toBeInstanceOf(Error);
  });

  it('SpotlightNotSupported carries name === "SpotlightNotSupported"', () => {
    const err = new SpotlightNotSupported();
    expect(err.name).toBe('SpotlightNotSupported');
  });

  it('SpotlightNotSupported carries the provided message', () => {
    const err = new SpotlightNotSupported('custom message');
    expect(err.message).toBe('custom message');
  });

  it('SpotlightNotSupported defaults to sensible message when none provided', () => {
    const err = new SpotlightNotSupported();
    expect(err.message).toBe('SpotlightNotSupported');
  });
});

describe('spotlight.types: IndexedState', () => {
  it('IndexedState accepts exactly "indexed" and "not indexed" literals (FR-030/FR-031)', () => {
    const indexed: IndexedState = 'indexed';
    const notIndexed: IndexedState = 'not indexed';
    expect([indexed, notIndexed]).toEqual(['indexed', 'not indexed']);
  });
});

describe('spotlight.types: ActivityState', () => {
  it('ActivityState accepts exactly "active" and "inactive" literals (FR-060..063)', () => {
    const active: ActivityState = 'active';
    const inactive: ActivityState = 'inactive';
    expect([active, inactive]).toEqual(['active', 'inactive']);
  });
});

describe('spotlight.types: SearchableItem interface', () => {
  it('a SearchableItem with all required fields typechecks and is structurally valid', () => {
    const item: SearchableItem = {
      id: 'com.izkizk8.spot.modules.test',
      title: 'Test Module',
      contentDescription: 'A test module for demonstration',
      keywords: ['test', 'demo'],
      domainIdentifier: DOMAIN_IDENTIFIER,
    };
    expect(item.id).toBe('com.izkizk8.spot.modules.test');
    expect(item.title).toBe('Test Module');
    expect(item.contentDescription).toBe('A test module for demonstration');
    expect(item.keywords).toEqual(['test', 'demo']);
    expect(item.domainIdentifier).toBe('com.izkizk8.spot.modules');
  });

  it('keywords field is string[] — empty array is valid', () => {
    const item: SearchableItem = {
      id: 'com.izkizk8.spot.modules.empty',
      title: 'Empty Keywords',
      contentDescription: '',
      keywords: [],
      domainIdentifier: DOMAIN_IDENTIFIER,
    };
    expect(item.keywords).toEqual([]);
  });
});

describe('spotlight.types: UserActivityDescriptor interface', () => {
  it('a UserActivityDescriptor with all fields typechecks (FR-061/NFR-004)', () => {
    const desc: UserActivityDescriptor = {
      title: 'Spotlight Indexing Demo',
      keywords: ['spotlight', 'demo'],
      userInfo: { source: 'spotlight-lab' },
    };
    expect(desc.title).toBe('Spotlight Indexing Demo');
    expect(desc.keywords).toEqual(['spotlight', 'demo']);
    expect(desc.userInfo).toEqual({ source: 'spotlight-lab' });
  });

  it('userInfo is optional and may be omitted', () => {
    const desc: UserActivityDescriptor = {
      title: 'Minimal',
      keywords: [],
    };
    expect(desc.userInfo).toBeUndefined();
  });

  it('userInfo is an arbitrary JSON-serializable record', () => {
    const desc: UserActivityDescriptor = {
      title: 'With nested info',
      keywords: ['nested'],
      userInfo: {
        string: 'value',
        number: 42,
        nested: { key: 'val' },
      },
    };
    expect(desc.userInfo).toEqual({
      string: 'value',
      number: 42,
      nested: { key: 'val' },
    });
  });
});

describe('spotlight.types: constants', () => {
  it('NATIVE_MODULE_NAME === "Spotlight" (B1)', () => {
    expect(NATIVE_MODULE_NAME).toBe('Spotlight');
  });

  it('DOMAIN_IDENTIFIER === "com.izkizk8.spot.modules" (FR-022/B5)', () => {
    expect(DOMAIN_IDENTIFIER).toBe('com.izkizk8.spot.modules');
  });

  it('ACTIVITY_TYPE === "spot.showcase.activity" (FR-062/B6)', () => {
    expect(ACTIVITY_TYPE).toBe('spot.showcase.activity');
  });

  it('DEFAULT_SEARCH_LIMIT === 25 (FR-052/B7)', () => {
    expect(DEFAULT_SEARCH_LIMIT).toBe(25);
  });
});

describe('spotlight.types: SpotlightBridge interface shape', () => {
  it('SpotlightBridge interface has the expected method signatures', () => {
    // Type-level assertion: verifying that SpotlightBridge has the expected shape
    // via a structural check. We create a mock object and assign to the type.
    const mockBridge: SpotlightBridge = {
      isAvailable: () => true,
      index: async (_items) => {},
      delete: async (_ids) => {},
      deleteAll: async () => {},
      search: async (_query, _limit) => [],
      markCurrentActivity: async (_desc) => {},
      clearCurrentActivity: async () => {},
    };
    expect(typeof mockBridge.isAvailable).toBe('function');
    expect(typeof mockBridge.index).toBe('function');
    expect(typeof mockBridge.delete).toBe('function');
    expect(typeof mockBridge.deleteAll).toBe('function');
    expect(typeof mockBridge.search).toBe('function');
    expect(typeof mockBridge.markCurrentActivity).toBe('function');
    expect(typeof mockBridge.clearCurrentActivity).toBe('function');
  });
});
