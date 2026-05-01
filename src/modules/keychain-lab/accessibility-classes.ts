/**
 * Accessibility class registry for Keychain Services (feature 023).
 *
 * Defines the five `kSecAttrAccessible*` constants exposed by the module,
 * with plain-language descriptions for the picker UI.
 */

export type AccessibilityClass =
  | 'whenUnlocked'
  | 'afterFirstUnlock'
  | 'whenUnlockedThisDeviceOnly'
  | 'afterFirstUnlockThisDeviceOnly'
  | 'whenPasscodeSetThisDeviceOnly';

export interface AccessibilityClassDescriptor {
  key: AccessibilityClass;
  label: string;
  description: string;
  secAttrConstant: string;
  deviceOnly: boolean;
  requiresPasscode: boolean;
}

export const DEFAULT_ACCESSIBILITY_CLASS: AccessibilityClass = 'whenUnlockedThisDeviceOnly';

export const ACCESSIBILITY_CLASSES: readonly AccessibilityClassDescriptor[] = [
  {
    key: 'whenUnlocked',
    label: 'When Unlocked',
    description: 'Accessible only while the device is unlocked.',
    secAttrConstant: 'kSecAttrAccessibleWhenUnlocked',
    deviceOnly: false,
    requiresPasscode: false,
  },
  {
    key: 'afterFirstUnlock',
    label: 'After First Unlock',
    description: 'Accessible after the first unlock following device boot.',
    secAttrConstant: 'kSecAttrAccessibleAfterFirstUnlock',
    deviceOnly: false,
    requiresPasscode: false,
  },
  {
    key: 'whenUnlockedThisDeviceOnly',
    label: 'When Unlocked (This Device)',
    description: 'Accessible while unlocked; never syncs via iCloud Keychain.',
    secAttrConstant: 'kSecAttrAccessibleWhenUnlockedThisDeviceOnly',
    deviceOnly: true,
    requiresPasscode: false,
  },
  {
    key: 'afterFirstUnlockThisDeviceOnly',
    label: 'After First Unlock (This Device)',
    description: 'Accessible after first unlock; never syncs via iCloud Keychain.',
    secAttrConstant: 'kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly',
    deviceOnly: true,
    requiresPasscode: false,
  },
  {
    key: 'whenPasscodeSetThisDeviceOnly',
    label: 'When Passcode Set (This Device)',
    description: 'Requires a device passcode; never syncs via iCloud Keychain.',
    secAttrConstant: 'kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly',
    deviceOnly: true,
    requiresPasscode: true,
  },
] as const;

export function getSecAttrConstant(key: AccessibilityClass): string {
  const descriptor = ACCESSIBILITY_CLASSES.find((ac) => ac.key === key);
  if (!descriptor) {
    throw new Error(`Unknown AccessibilityClass: ${key}`);
  }
  return descriptor.secAttrConstant;
}
