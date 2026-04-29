/**
 * Bluetooth Lab manifest — unit tests (T042).
 * Feature: 035-core-bluetooth
 */

import { manifest, MANIFEST_ID, MANIFEST_TITLE, MANIFEST_MIN_IOS } from '@/modules/bluetooth-lab';

describe('Bluetooth Lab manifest', () => {
  it('has id "bluetooth-lab"', () => {
    expect(manifest.id).toBe('bluetooth-lab');
    expect(MANIFEST_ID).toBe('bluetooth-lab');
  });

  it('has title "Bluetooth (BLE Central)"', () => {
    expect(manifest.title).toBe('Bluetooth (BLE Central)');
    expect(MANIFEST_TITLE).toBe('Bluetooth (BLE Central)');
  });

  it('declares all three platforms', () => {
    expect(manifest.platforms).toEqual(['ios', 'android', 'web']);
  });

  it('declares minIOS "7.0"', () => {
    expect(manifest.minIOS).toBe('7.0');
    expect(MANIFEST_MIN_IOS).toBe('7.0');
  });

  it('has a render function', () => {
    expect(typeof manifest.render).toBe('function');
  });

  it('has a non-empty description and icon', () => {
    expect(manifest.description?.length ?? 0).toBeGreaterThan(0);
    expect(manifest.icon?.fallback).toBeTruthy();
  });
});
