/**
 * Tests for lock-config module per contracts/lock-config.contract.ts
 *
 * Covers:
 *  1. DEFAULT_LOCK_CONFIG shape (showcaseValue, counter, tint from 014)
 *  2. SHADOW_STORE_KEY literal + disjoint from 014's key
 *  3-8. validate() edge cases (undefined, null, {}, non-object, malformed fields, happy path)
 *  9-13. AsyncStorage round-trip + error handling
 *
 * @see specs/027-lock-screen-widgets/tasks.md T010
 * @see specs/027-lock-screen-widgets/contracts/lock-config.contract.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG as DEFAULT_WIDGET_CONFIG } from '@/modules/widgets-lab/widget-config';

describe('lock-config module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DEFAULT_LOCK_CONFIG has showcaseValue="Hello, Lock!" + counter=0 + tint from 014', () => {
    const { DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    expect(DEFAULT_LOCK_CONFIG).toEqual({
      showcaseValue: 'Hello, Lock!',
      counter: 0,
      tint: DEFAULT_WIDGET_CONFIG.tint,
    });
  });

  it('SHADOW_STORE_KEY === "spot.widget.lockConfig" and is disjoint from 014', () => {
    const { SHADOW_STORE_KEY } = require('@/modules/lock-widgets-lab/lock-config');
    expect(SHADOW_STORE_KEY).toBe('spot.widget.lockConfig');
    expect(SHADOW_STORE_KEY).not.toBe('widgets-lab:config');
  });

  it('validate(undefined) returns DEFAULT_LOCK_CONFIG', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    expect(validate(undefined)).toEqual(DEFAULT_LOCK_CONFIG);
  });

  it('validate(null) returns DEFAULT_LOCK_CONFIG', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    expect(validate(null)).toEqual(DEFAULT_LOCK_CONFIG);
  });

  it('validate({}) returns DEFAULT_LOCK_CONFIG', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    expect(validate({})).toEqual(DEFAULT_LOCK_CONFIG);
  });

  it('validate("not an object") returns DEFAULT_LOCK_CONFIG', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    expect(validate('not an object')).toEqual(DEFAULT_LOCK_CONFIG);
  });

  it('validate({ showcaseValue: 42 }) returns config with default showcaseValue', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    const result = validate({ showcaseValue: 42 });
    expect(result.showcaseValue).toBe(DEFAULT_LOCK_CONFIG.showcaseValue);
  });

  it('validate({ counter: "abc" }) returns config with default counter', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    const result = validate({ counter: 'abc' });
    expect(result.counter).toBe(DEFAULT_LOCK_CONFIG.counter);
  });

  it('validate({ tint: "magenta" }) returns config with default tint', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    const result = validate({ tint: 'magenta' });
    expect(result.tint).toBe(DEFAULT_LOCK_CONFIG.tint);
  });

  it('validate(valid config) returns input verbatim', () => {
    const { validate } = require('@/modules/lock-widgets-lab/lock-config');
    const input = { showcaseValue: 'Hi', counter: 7, tint: 'green' };
    const result = validate(input);
    expect(result).toEqual(input);
  });

  it('validate(JSON raw string) returns DEFAULT_LOCK_CONFIG', () => {
    const { validate, DEFAULT_LOCK_CONFIG } = require('@/modules/lock-widgets-lab/lock-config');
    const rawString = JSON.parse('"raw string"');
    expect(validate(rawString)).toEqual(DEFAULT_LOCK_CONFIG);
  });

  it('AsyncStorage round-trip: save then load returns saved config', async () => {
    const {
      saveShadowLockConfig,
      loadShadowLockConfig,
    } = require('@/modules/lock-widgets-lab/lock-config');
    const config = { showcaseValue: 'Test', counter: 42, tint: 'orange' };
    await saveShadowLockConfig(config);
    const loaded = await loadShadowLockConfig();
    expect(loaded).toEqual(config);
  });

  it('loadShadowLockConfig() returns DEFAULT_LOCK_CONFIG when key is missing', async () => {
    const { loadShadowLockConfig, DEFAULT_LOCK_CONFIG } =
      require('@/modules/lock-widgets-lab/lock-config');
    await AsyncStorage.clear();
    const loaded = await loadShadowLockConfig();
    expect(loaded).toEqual(DEFAULT_LOCK_CONFIG);
  });

  it('loadShadowLockConfig() returns DEFAULT_LOCK_CONFIG when stored value is malformed JSON', async () => {
    const { loadShadowLockConfig, DEFAULT_LOCK_CONFIG, SHADOW_STORE_KEY } =
      require('@/modules/lock-widgets-lab/lock-config');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json{');
    const loaded = await loadShadowLockConfig();
    expect(loaded).toEqual(DEFAULT_LOCK_CONFIG);
  });

  it('saveShadowLockConfig() swallows AsyncStorage errors silently', async () => {
    const { saveShadowLockConfig } = require('@/modules/lock-widgets-lab/lock-config');
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('write fail'));
    const config = { showcaseValue: 'Test', counter: 1, tint: 'blue' };
    await expect(saveShadowLockConfig(config)).resolves.toBeUndefined();
  });

  it('loadShadowLockConfig() swallows AsyncStorage errors silently', async () => {
    const { loadShadowLockConfig, DEFAULT_LOCK_CONFIG } =
      require('@/modules/lock-widgets-lab/lock-config');
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('read fail'));
    const loaded = await loadShadowLockConfig();
    expect(loaded).toEqual(DEFAULT_LOCK_CONFIG);
  });
});
