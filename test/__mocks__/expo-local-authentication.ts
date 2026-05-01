/**
 * Jest mock for `expo-local-authentication` (feature 022).
 *
 * Exposes configurable `hasHardwareAsync`, `isEnrolledAsync`,
 * `supportedAuthenticationTypesAsync`, `getEnrolledLevelAsync`,
 * `authenticateAsync`, plus the `AuthenticationType` and `SecurityLevel`
 * enums.
 *
 * Usage in tests:
 *
 *   import * as LocalAuth from 'expo-local-authentication';
 *   const mock = require('expo-local-authentication') as typeof import('../../test/__mocks__/expo-local-authentication');
 *   mock.__reset();
 *   mock.__setHasHardware(true);
 *   mock.__setAuthenticateResult({ success: true });
 */

// Numeric enums matching the real SDK.
export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
} as const;

export const SecurityLevel = {
  NONE: 0,
  SECRET: 1,
  BIOMETRIC_WEAK: 2,
  BIOMETRIC_STRONG: 3,
} as const;

export type LocalAuthenticationError =
  | 'not_enrolled'
  | 'user_cancel'
  | 'app_cancel'
  | 'not_available'
  | 'lockout'
  | 'no_space'
  | 'timeout'
  | 'unable_to_process'
  | 'unknown'
  | 'system_cancel'
  | 'user_fallback'
  | 'invalid_context'
  | 'passcode_not_set'
  | 'authentication_failed';

export type LocalAuthenticationResult =
  | { success: true }
  | { success: false; error: LocalAuthenticationError; warning?: string };

export interface LocalAuthenticationOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

let hasHardware = true;
let isEnrolled = true;
let supportedTypes: number[] = [AuthenticationType.FACIAL_RECOGNITION];
let enrolledLevel: number = SecurityLevel.BIOMETRIC_STRONG;
let authenticateResult: LocalAuthenticationResult | Error = { success: true };
let throwOn: 'hasHardware' | 'isEnrolled' | 'types' | 'level' | null = null;

export const hasHardwareAsync = jest.fn(async (): Promise<boolean> => {
  if (throwOn === 'hasHardware') throw new Error('hasHardwareAsync failure');
  return hasHardware;
});

export const isEnrolledAsync = jest.fn(async (): Promise<boolean> => {
  if (throwOn === 'isEnrolled') throw new Error('isEnrolledAsync failure');
  return isEnrolled;
});

export const supportedAuthenticationTypesAsync = jest.fn(async (): Promise<number[]> => {
  if (throwOn === 'types') throw new Error('supportedAuthenticationTypesAsync failure');
  return supportedTypes;
});

export const getEnrolledLevelAsync = jest.fn(async (): Promise<number> => {
  if (throwOn === 'level') throw new Error('getEnrolledLevelAsync failure');
  return enrolledLevel;
});

export const authenticateAsync = jest.fn(
  async (_options?: LocalAuthenticationOptions): Promise<LocalAuthenticationResult> => {
    if (authenticateResult instanceof Error) {
      throw authenticateResult;
    }
    return authenticateResult;
  },
);

// Test helpers ------------------------------------------------------------

export function __reset() {
  hasHardware = true;
  isEnrolled = true;
  supportedTypes = [AuthenticationType.FACIAL_RECOGNITION];
  enrolledLevel = SecurityLevel.BIOMETRIC_STRONG;
  authenticateResult = { success: true };
  throwOn = null;
  hasHardwareAsync.mockClear();
  isEnrolledAsync.mockClear();
  supportedAuthenticationTypesAsync.mockClear();
  getEnrolledLevelAsync.mockClear();
  authenticateAsync.mockClear();
}

export function __setHasHardware(v: boolean) {
  hasHardware = v;
}

export function __setIsEnrolled(v: boolean) {
  isEnrolled = v;
}

export function __setSupportedTypes(v: number[]) {
  supportedTypes = v;
}

export function __setEnrolledLevel(v: number) {
  enrolledLevel = v;
}

export function __setAuthenticateResult(v: LocalAuthenticationResult | Error) {
  authenticateResult = v;
}

export function __setThrowOn(v: 'hasHardware' | 'isEnrolled' | 'types' | 'level' | null) {
  throwOn = v;
}
