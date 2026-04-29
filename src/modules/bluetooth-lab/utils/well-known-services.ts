/**
 * Well-known SIG GATT services and characteristics.
 * Feature: 035-core-bluetooth
 *
 * Frozen catalog of standard Bluetooth-SIG short-form UUIDs to
 * human-readable labels. Used by ServiceRow / CharacteristicRow to
 * decorate the discovered tree.
 */

const ENTRIES: Record<string, string> = {
  '1800': 'Generic Access',
  '1801': 'Generic Attribute',
  '180a': 'Device Information',
  '180d': 'Heart Rate',
  '180f': 'Battery Service',
  '1812': 'Human Interface Device',
  '181a': 'Environmental Sensing',
  '181c': 'User Data',
  '181d': 'Weight Scale',
  '181e': 'Bond Management',
  '1819': 'Location and Navigation',
  '1816': 'Cycling Speed and Cadence',
  '1818': 'Cycling Power',
  // common characteristics (subset)
  '2a00': 'Device Name',
  '2a01': 'Appearance',
  '2a19': 'Battery Level',
  '2a29': 'Manufacturer Name String',
  '2a24': 'Model Number String',
  '2a25': 'Serial Number String',
  '2a26': 'Firmware Revision String',
  '2a27': 'Hardware Revision String',
  '2a28': 'Software Revision String',
  '2a37': 'Heart Rate Measurement',
};

export const WELL_KNOWN_SERVICES: Readonly<Record<string, string>> = Object.freeze({ ...ENTRIES });

const FULL_UUID_PREFIX = '0000';
const FULL_UUID_SUFFIX = '-0000-1000-8000-00805f9b34fb';

/**
 * Look up a SIG-known label for a UUID (case-insensitive). Accepts both
 * 4-char short form (e.g. `'180f'`) and 36-char full form
 * (e.g. `'0000180f-0000-1000-8000-00805f9b34fb'`). Returns undefined if
 * the UUID is not in the catalog.
 */
export function lookup(uuid: string): string | undefined {
  if (!uuid) return undefined;
  const lower = uuid.toLowerCase();
  if (lower.length === 4) {
    return WELL_KNOWN_SERVICES[lower];
  }
  if (
    lower.length === 36 &&
    lower.startsWith(FULL_UUID_PREFIX) &&
    lower.endsWith(FULL_UUID_SUFFIX)
  ) {
    const short = lower.slice(4, 8);
    return WELL_KNOWN_SERVICES[short];
  }
  return undefined;
}
