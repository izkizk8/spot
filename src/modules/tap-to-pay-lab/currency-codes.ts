/**
 * Currency Codes Catalog
 * Feature: 051-tap-to-pay
 *
 * ISO 4217 currency catalog for payment composer.
 * Minimum 20 common currencies with correct minor units.
 */

export interface CurrencyEntry {
  code: string; // ISO 4217 (e.g., 'USD')
  name: string; // display name
  minorUnits: number; // decimal places (0, 2, or 3)
}

export const CURRENCIES: readonly CurrencyEntry[] = [
  { code: 'USD', name: 'US Dollar', minorUnits: 2 },
  { code: 'EUR', name: 'Euro', minorUnits: 2 },
  { code: 'GBP', name: 'British Pound', minorUnits: 2 },
  { code: 'JPY', name: 'Japanese Yen', minorUnits: 0 },
  { code: 'CAD', name: 'Canadian Dollar', minorUnits: 2 },
  { code: 'AUD', name: 'Australian Dollar', minorUnits: 2 },
  { code: 'CHF', name: 'Swiss Franc', minorUnits: 2 },
  { code: 'CNY', name: 'Chinese Yuan', minorUnits: 2 },
  { code: 'SEK', name: 'Swedish Krona', minorUnits: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', minorUnits: 2 },
  { code: 'MXN', name: 'Mexican Peso', minorUnits: 2 },
  { code: 'SGD', name: 'Singapore Dollar', minorUnits: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', minorUnits: 2 },
  { code: 'NOK', name: 'Norwegian Krone', minorUnits: 2 },
  { code: 'KRW', name: 'South Korean Won', minorUnits: 0 },
  { code: 'INR', name: 'Indian Rupee', minorUnits: 2 },
  { code: 'BRL', name: 'Brazilian Real', minorUnits: 2 },
  { code: 'ZAR', name: 'South African Rand', minorUnits: 2 },
  { code: 'DKK', name: 'Danish Krone', minorUnits: 2 },
  { code: 'PLN', name: 'Polish Złoty', minorUnits: 2 },
];
