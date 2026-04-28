/**
 * Tests for standby-config module per contracts/standby-config.contract.ts
 *
 * @see specs/028-standby-mode/tasks.md T006
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG as DEFAULT_WIDGET_CONFIG } from '@/modules/widgets-lab/widget-config';

describe('standby-config module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DEFAULT_STANDBY_CONFIG equals { showcaseValue:"StandBy", counter:0, tint:<014-default>, mode:"fullColor" }', () => {
    const { DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(DEFAULT_STANDBY_CONFIG).toEqual({
      showcaseValue: 'StandBy',
      counter: 0,
      tint: DEFAULT_WIDGET_CONFIG.tint,
      mode: 'fullColor',
    });
  });

  it('SHADOW_STORE_KEY === "spot.widget.standbyConfig" and disjoint from 014 + 027', () => {
    const { SHADOW_STORE_KEY } = require('@/modules/standby-lab/standby-config');
    expect(SHADOW_STORE_KEY).toBe('spot.widget.standbyConfig');
    expect(SHADOW_STORE_KEY).not.toBe('widgets-lab:config');
    expect(SHADOW_STORE_KEY).not.toBe('spot.widget.lockConfig');
  });

  it('validate(undefined) returns DEFAULT_STANDBY_CONFIG', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate(undefined)).toEqual(DEFAULT_STANDBY_CONFIG);
  });

  it('validate(null) returns DEFAULT_STANDBY_CONFIG', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate(null)).toEqual(DEFAULT_STANDBY_CONFIG);
  });

  it('validate({}) returns DEFAULT_STANDBY_CONFIG', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate({})).toEqual(DEFAULT_STANDBY_CONFIG);
  });

  it('validate("not an object") returns DEFAULT_STANDBY_CONFIG', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate('not an object')).toEqual(DEFAULT_STANDBY_CONFIG);
  });

  it('validate({ showcaseValue: 42 }) falls back to default showcaseValue', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate({ showcaseValue: 42 }).showcaseValue).toBe(
      DEFAULT_STANDBY_CONFIG.showcaseValue,
    );
  });

  it('validate({ showcaseValue: "x".repeat(200) }) caps length at 64', () => {
    const { validate } = require('@/modules/standby-lab/standby-config');
    const result = validate({ showcaseValue: 'x'.repeat(200) });
    expect(result.showcaseValue.length).toBe(64);
  });

  it('validate({ counter: "abc" }) falls back to default counter', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate({ counter: 'abc' }).counter).toBe(DEFAULT_STANDBY_CONFIG.counter);
  });

  it('validate clamps counter to [-9999, 9999]', () => {
    const { validate } = require('@/modules/standby-lab/standby-config');
    expect(validate({ counter: 99999 }).counter).toBe(9999);
    expect(validate({ counter: -99999 }).counter).toBe(-9999);
  });

  it('validate({ tint: "magenta" }) falls back to default tint', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate({ tint: 'magenta' }).tint).toBe(DEFAULT_STANDBY_CONFIG.tint);
  });

  it('validate({ mode: "unknown" }) falls back to default mode "fullColor"', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    expect(validate({ mode: 'unknown' }).mode).toBe(DEFAULT_STANDBY_CONFIG.mode);
    expect(DEFAULT_STANDBY_CONFIG.mode).toBe('fullColor');
  });

  it('validate round-trips each of the three valid mode values', () => {
    const { validate } = require('@/modules/standby-lab/standby-config');
    expect(validate({ mode: 'fullColor' }).mode).toBe('fullColor');
    expect(validate({ mode: 'accented' }).mode).toBe('accented');
    expect(validate({ mode: 'vibrant' }).mode).toBe('vibrant');
  });

  it('validate(valid full config) returns input verbatim', () => {
    const { validate } = require('@/modules/standby-lab/standby-config');
    const input = { showcaseValue: 'Hi', counter: 7, tint: 'green', mode: 'accented' };
    expect(validate(input)).toEqual(input);
  });

  it('validate(JSON raw string) returns DEFAULT_STANDBY_CONFIG', () => {
    const { validate, DEFAULT_STANDBY_CONFIG } = require('@/modules/standby-lab/standby-config');
    const raw = JSON.parse('"raw string"');
    expect(validate(raw)).toEqual(DEFAULT_STANDBY_CONFIG);
  });

  it('AsyncStorage round-trip exercises every field including each mode', async () => {
    const {
      saveShadowStandByConfig,
      loadShadowStandByConfig,
    } = require('@/modules/standby-lab/standby-config');
    for (const mode of ['fullColor', 'accented', 'vibrant'] as const) {
      const cfg = { showcaseValue: `m-${mode}`, counter: 3, tint: 'orange', mode };
      await saveShadowStandByConfig(cfg);
      const loaded = await loadShadowStandByConfig();
      expect(loaded).toEqual(cfg);
    }
  });

  it('loadShadowStandByConfig() returns DEFAULT_STANDBY_CONFIG when key is missing', async () => {
    const {
      loadShadowStandByConfig,
      DEFAULT_STANDBY_CONFIG,
    } = require('@/modules/standby-lab/standby-config');
    await AsyncStorage.clear();
    const loaded = await loadShadowStandByConfig();
    expect(loaded).toEqual(DEFAULT_STANDBY_CONFIG);
  });

  it('loadShadowStandByConfig() returns DEFAULT when stored value is malformed JSON', async () => {
    const {
      loadShadowStandByConfig,
      DEFAULT_STANDBY_CONFIG,
    } = require('@/modules/standby-lab/standby-config');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json{');
    const loaded = await loadShadowStandByConfig();
    expect(loaded).toEqual(DEFAULT_STANDBY_CONFIG);
  });

  it('saveShadowStandByConfig() swallows AsyncStorage errors silently', async () => {
    const { saveShadowStandByConfig } = require('@/modules/standby-lab/standby-config');
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('write fail'));
    const cfg = { showcaseValue: 'x', counter: 1, tint: 'blue', mode: 'fullColor' };
    await expect(saveShadowStandByConfig(cfg)).resolves.toBeUndefined();
  });

  it('loadShadowStandByConfig() swallows AsyncStorage errors silently', async () => {
    const {
      loadShadowStandByConfig,
      DEFAULT_STANDBY_CONFIG,
    } = require('@/modules/standby-lab/standby-config');
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('read fail'));
    const loaded = await loadShadowStandByConfig();
    expect(loaded).toEqual(DEFAULT_STANDBY_CONFIG);
  });
});
