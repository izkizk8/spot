/**
 * @jest-environment node
 */

import {
  FALLBACK_SYMBOL,
  symbolFor,
  WEATHER_SYMBOLS,
} from '@/modules/weatherkit-lab/weather-symbols';

describe('weather-symbols', () => {
  it('FALLBACK_SYMBOL points at cloud.fill', () => {
    expect(FALLBACK_SYMBOL.sfSymbol).toBe('cloud.fill');
    expect(FALLBACK_SYMBOL.label).toBe('Unknown');
  });

  it('symbolFor("clear") maps to sun.max.fill', () => {
    expect(symbolFor('clear').sfSymbol).toBe('sun.max.fill');
  });

  it('symbolFor("partlyCloudy") maps to cloud.sun.fill', () => {
    expect(symbolFor('partlyCloudy').sfSymbol).toBe('cloud.sun.fill');
  });

  it('symbolFor("thunderstorms") maps to cloud.bolt.rain.fill', () => {
    expect(symbolFor('thunderstorms').sfSymbol).toBe('cloud.bolt.rain.fill');
  });

  it('symbolFor("hurricane") maps to hurricane', () => {
    expect(symbolFor('hurricane').sfSymbol).toBe('hurricane');
  });

  it('symbolFor with an unknown code returns FALLBACK_SYMBOL', () => {
    expect(symbolFor('not-a-condition')).toBe(FALLBACK_SYMBOL);
  });

  it('every entry has non-empty sfSymbol/emoji/label', () => {
    for (const value of Object.values(WEATHER_SYMBOLS)) {
      expect(value.sfSymbol.length).toBeGreaterThan(0);
      expect(value.emoji.length).toBeGreaterThan(0);
      expect(value.label.length).toBeGreaterThan(0);
    }
  });

  it('WEATHER_SYMBOLS includes coverage for the 33 documented conditions', () => {
    expect(Object.keys(WEATHER_SYMBOLS).length).toBe(33);
  });

  it('the table is frozen', () => {
    expect(Object.isFrozen(WEATHER_SYMBOLS)).toBe(true);
  });
});
