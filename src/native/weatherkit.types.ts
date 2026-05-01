/**
 * WeatherKit bridge — shared type surface (feature 046).
 *
 * Types referenced by all four `src/native/weatherkit*.ts` siblings
 * and by the `useWeather` hook. Pure module: no React, no native
 * imports.
 */

export const NATIVE_MODULE_NAME = 'WeatherKitBridge' as const;

/** WeatherKit unit system. Mirrors `UnitsUsage` defaults at JS level. */
export type UnitSystem = 'metric' | 'imperial' | 'scientific';

/**
 * Coarse condition codes covering the WeatherKit `WeatherCondition`
 * enum. The bridge returns the raw camelCase string from the iOS
 * SDK; unknown strings are accepted and fall back at the symbol
 * layer.
 */
export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'mostlyClear'
  | 'mostlyCloudy'
  | 'partlyCloudy'
  | 'foggy'
  | 'haze'
  | 'smoky'
  | 'breezy'
  | 'windy'
  | 'drizzle'
  | 'rain'
  | 'heavyRain'
  | 'isolatedThunderstorms'
  | 'scatteredThunderstorms'
  | 'strongStorms'
  | 'thunderstorms'
  | 'frigid'
  | 'hail'
  | 'hot'
  | 'flurries'
  | 'sleet'
  | 'snow'
  | 'sunFlurries'
  | 'sunShowers'
  | 'wintryMix'
  | 'blizzard'
  | 'blowingSnow'
  | 'freezingDrizzle'
  | 'freezingRain'
  | 'heavySnow'
  | 'hurricane'
  | 'tropicalStorm';

export interface CurrentWeather {
  readonly temperature: number;
  readonly apparentTemperature: number;
  readonly condition: WeatherCondition | string;
  readonly conditionLabel: string;
  readonly humidity: number;
  readonly windSpeed: number;
  readonly windDirection: number;
  readonly uvIndex: number;
  readonly isDaylight: boolean;
}

export interface HourlyForecastEntry {
  readonly date: string;
  readonly temperature: number;
  readonly condition: WeatherCondition | string;
  readonly precipitationChance: number;
}

export interface DailyForecastEntry {
  readonly date: string;
  readonly highTemperature: number;
  readonly lowTemperature: number;
  readonly condition: WeatherCondition | string;
  readonly precipitationChance: number;
}

export type AlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';

export interface WeatherAlert {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly severity: AlertSeverity;
  readonly source: string;
  readonly issuedAt: string;
  readonly expiresAt: string | null;
  readonly detailsUrl: string | null;
}

export interface WeatherAttribution {
  readonly serviceName: string;
  readonly logoLightUrl: string;
  readonly logoDarkUrl: string;
  readonly legalPageUrl: string;
}

export interface WeatherKitBridge {
  isAvailable(): boolean;
  getCurrent(lat: number, lng: number, units: UnitSystem): Promise<CurrentWeather>;
  getHourly(lat: number, lng: number, units: UnitSystem): Promise<readonly HourlyForecastEntry[]>;
  getDaily(lat: number, lng: number, units: UnitSystem): Promise<readonly DailyForecastEntry[]>;
  getAlerts(lat: number, lng: number): Promise<readonly WeatherAlert[]>;
  getAttribution(): Promise<WeatherAttribution>;
}

/**
 * Typed error thrown by the Android / Web variants and by the iOS
 * variant when the native module is missing.
 */
export class WeatherKitNotSupported extends Error {
  public readonly code = 'WEATHERKIT_NOT_SUPPORTED' as const;

  constructor(message = 'WeatherKit is not available on this platform') {
    super(message);
    this.name = 'WeatherKitNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WeatherKitNotSupported);
    }
  }
}
