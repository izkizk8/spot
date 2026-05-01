/**
 * @jest-environment jsdom
 */

import {
  ACCESSIBILITY_CLASSES,
  DEFAULT_ACCESSIBILITY_CLASS,
  getSecAttrConstant,
} from '@/modules/keychain-lab/accessibility-classes';

describe('accessibility-classes', () => {
  it('exports exactly five AccessibilityClass entries', () => {
    expect(ACCESSIBILITY_CLASSES).toHaveLength(5);
  });

  it('includes all five required AccessibilityClass keys', () => {
    const keys = ACCESSIBILITY_CLASSES.map((ac) => ac.key);
    expect(keys).toContain('whenUnlocked');
    expect(keys).toContain('afterFirstUnlock');
    expect(keys).toContain('whenUnlockedThisDeviceOnly');
    expect(keys).toContain('afterFirstUnlockThisDeviceOnly');
    expect(keys).toContain('whenPasscodeSetThisDeviceOnly');
  });

  it('maps each class to the correct kSecAttrAccessible* constant', () => {
    const mapping = new Map(ACCESSIBILITY_CLASSES.map((ac) => [ac.key, ac.secAttrConstant]));

    expect(mapping.get('whenUnlocked')).toBe('kSecAttrAccessibleWhenUnlocked');
    expect(mapping.get('afterFirstUnlock')).toBe('kSecAttrAccessibleAfterFirstUnlock');
    expect(mapping.get('whenUnlockedThisDeviceOnly')).toBe(
      'kSecAttrAccessibleWhenUnlockedThisDeviceOnly',
    );
    expect(mapping.get('afterFirstUnlockThisDeviceOnly')).toBe(
      'kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly',
    );
    expect(mapping.get('whenPasscodeSetThisDeviceOnly')).toBe(
      'kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly',
    );
  });

  it('sets default to whenUnlockedThisDeviceOnly', () => {
    expect(DEFAULT_ACCESSIBILITY_CLASS).toBe('whenUnlockedThisDeviceOnly');
  });

  it('provides non-empty descriptions mentioning behavior', () => {
    for (const ac of ACCESSIBILITY_CLASSES) {
      expect(ac.description).toBeTruthy();
      expect(ac.description.length).toBeGreaterThan(10);
    }

    // Check specific behavior mentions
    const whenUnlocked = ACCESSIBILITY_CLASSES.find((ac) => ac.key === 'whenUnlocked')!;
    expect(whenUnlocked.description.toLowerCase()).toMatch(/unlock/);

    const afterFirstUnlock = ACCESSIBILITY_CLASSES.find((ac) => ac.key === 'afterFirstUnlock')!;
    expect(afterFirstUnlock.description.toLowerCase()).toMatch(/first unlock|boot/);

    const whenPasscodeSet = ACCESSIBILITY_CLASSES.find(
      (ac) => ac.key === 'whenPasscodeSetThisDeviceOnly',
    )!;
    expect(whenPasscodeSet.description.toLowerCase()).toMatch(/passcode/);
  });

  it('correctly flags deviceOnly for *ThisDeviceOnly variants', () => {
    const whenUnlocked = ACCESSIBILITY_CLASSES.find((ac) => ac.key === 'whenUnlocked')!;
    expect(whenUnlocked.deviceOnly).toBe(false);

    const afterFirstUnlock = ACCESSIBILITY_CLASSES.find((ac) => ac.key === 'afterFirstUnlock')!;
    expect(afterFirstUnlock.deviceOnly).toBe(false);

    const whenUnlockedThisDevice = ACCESSIBILITY_CLASSES.find(
      (ac) => ac.key === 'whenUnlockedThisDeviceOnly',
    )!;
    expect(whenUnlockedThisDevice.deviceOnly).toBe(true);

    const afterFirstUnlockThisDevice = ACCESSIBILITY_CLASSES.find(
      (ac) => ac.key === 'afterFirstUnlockThisDeviceOnly',
    )!;
    expect(afterFirstUnlockThisDevice.deviceOnly).toBe(true);

    const whenPasscodeSet = ACCESSIBILITY_CLASSES.find(
      (ac) => ac.key === 'whenPasscodeSetThisDeviceOnly',
    )!;
    expect(whenPasscodeSet.deviceOnly).toBe(true);
  });

  it('correctly flags requiresPasscode only for whenPasscodeSetThisDeviceOnly', () => {
    for (const ac of ACCESSIBILITY_CLASSES) {
      const expected = ac.key === 'whenPasscodeSetThisDeviceOnly';
      expect(ac.requiresPasscode).toBe(expected);
    }
  });

  it('provides non-empty labels for UI display', () => {
    for (const ac of ACCESSIBILITY_CLASSES) {
      expect(ac.label).toBeTruthy();
      expect(ac.label.length).toBeGreaterThan(3);
    }
  });

  it('exports getSecAttrConstant helper that maps key to constant', () => {
    expect(getSecAttrConstant('whenUnlocked')).toBe('kSecAttrAccessibleWhenUnlocked');
    expect(getSecAttrConstant('afterFirstUnlock')).toBe('kSecAttrAccessibleAfterFirstUnlock');
    expect(getSecAttrConstant('whenUnlockedThisDeviceOnly')).toBe(
      'kSecAttrAccessibleWhenUnlockedThisDeviceOnly',
    );
    expect(getSecAttrConstant('afterFirstUnlockThisDeviceOnly')).toBe(
      'kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly',
    );
    expect(getSecAttrConstant('whenPasscodeSetThisDeviceOnly')).toBe(
      'kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly',
    );
  });
});
