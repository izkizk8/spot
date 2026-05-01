/**
 * weather-symbols — frozen lookup mapping WeatherKit
 * `WeatherCondition` codes to iOS SF Symbols. Unknown codes fall
 * back to `cloud.fill` with a stable emoji glyph.
 *
 * Pure module — no React, no native imports.
 */

import type { WeatherCondition } from '@/native/weatherkit.types';

export interface WeatherSymbol {
  readonly sfSymbol: string;
  readonly emoji: string;
  readonly label: string;
}

export const FALLBACK_SYMBOL: WeatherSymbol = Object.freeze({
  sfSymbol: 'cloud.fill',
  emoji: '☁️',
  label: 'Unknown',
});

const TABLE: Readonly<Record<WeatherCondition, WeatherSymbol>> = Object.freeze({
  clear: { sfSymbol: 'sun.max.fill', emoji: '☀️', label: 'Clear' },
  cloudy: { sfSymbol: 'cloud.fill', emoji: '☁️', label: 'Cloudy' },
  mostlyClear: { sfSymbol: 'sun.max.fill', emoji: '🌤️', label: 'Mostly Clear' },
  mostlyCloudy: { sfSymbol: 'cloud.fill', emoji: '☁️', label: 'Mostly Cloudy' },
  partlyCloudy: { sfSymbol: 'cloud.sun.fill', emoji: '⛅', label: 'Partly Cloudy' },
  foggy: { sfSymbol: 'cloud.fog.fill', emoji: '🌫️', label: 'Foggy' },
  haze: { sfSymbol: 'sun.haze.fill', emoji: '🌫️', label: 'Haze' },
  smoky: { sfSymbol: 'smoke.fill', emoji: '💨', label: 'Smoky' },
  breezy: { sfSymbol: 'wind', emoji: '🍃', label: 'Breezy' },
  windy: { sfSymbol: 'wind', emoji: '💨', label: 'Windy' },
  drizzle: { sfSymbol: 'cloud.drizzle.fill', emoji: '🌦️', label: 'Drizzle' },
  rain: { sfSymbol: 'cloud.rain.fill', emoji: '🌧️', label: 'Rain' },
  heavyRain: { sfSymbol: 'cloud.heavyrain.fill', emoji: '🌧️', label: 'Heavy Rain' },
  isolatedThunderstorms: {
    sfSymbol: 'cloud.bolt.fill',
    emoji: '⛈️',
    label: 'Isolated Thunderstorms',
  },
  scatteredThunderstorms: {
    sfSymbol: 'cloud.bolt.fill',
    emoji: '⛈️',
    label: 'Scattered Thunderstorms',
  },
  strongStorms: { sfSymbol: 'cloud.bolt.rain.fill', emoji: '⛈️', label: 'Strong Storms' },
  thunderstorms: { sfSymbol: 'cloud.bolt.rain.fill', emoji: '⛈️', label: 'Thunderstorms' },
  frigid: { sfSymbol: 'thermometer.snowflake', emoji: '🥶', label: 'Frigid' },
  hail: { sfSymbol: 'cloud.hail.fill', emoji: '🧊', label: 'Hail' },
  hot: { sfSymbol: 'thermometer.sun.fill', emoji: '🥵', label: 'Hot' },
  flurries: { sfSymbol: 'snowflake', emoji: '🌨️', label: 'Flurries' },
  sleet: { sfSymbol: 'cloud.sleet.fill', emoji: '🌨️', label: 'Sleet' },
  snow: { sfSymbol: 'cloud.snow.fill', emoji: '❄️', label: 'Snow' },
  sunFlurries: { sfSymbol: 'sun.snow.fill', emoji: '🌨️', label: 'Sun Flurries' },
  sunShowers: { sfSymbol: 'cloud.sun.rain.fill', emoji: '🌦️', label: 'Sun Showers' },
  wintryMix: { sfSymbol: 'cloud.sleet.fill', emoji: '🌨️', label: 'Wintry Mix' },
  blizzard: { sfSymbol: 'wind.snow', emoji: '❄️', label: 'Blizzard' },
  blowingSnow: { sfSymbol: 'wind.snow', emoji: '❄️', label: 'Blowing Snow' },
  freezingDrizzle: { sfSymbol: 'cloud.drizzle.fill', emoji: '🌧️', label: 'Freezing Drizzle' },
  freezingRain: { sfSymbol: 'cloud.rain.fill', emoji: '🌧️', label: 'Freezing Rain' },
  heavySnow: { sfSymbol: 'cloud.snow.fill', emoji: '❄️', label: 'Heavy Snow' },
  hurricane: { sfSymbol: 'hurricane', emoji: '🌀', label: 'Hurricane' },
  tropicalStorm: { sfSymbol: 'tropicalstorm', emoji: '🌀', label: 'Tropical Storm' },
});

export const WEATHER_SYMBOLS: Readonly<Record<WeatherCondition, WeatherSymbol>> = TABLE;

export function symbolFor(condition: string): WeatherSymbol {
  return (TABLE as Record<string, WeatherSymbol>)[condition] ?? FALLBACK_SYMBOL;
}
