/**
 * App Intents bridge for iOS 16+.
 *
 * The single seam where the iOS-only `AppIntents` native symbol is
 * touched. Resolves to a no-op (rejecting) bridge on Android, Web,
 * and iOS < 16.
 *
 * Mirrors the live-activity.ts pattern.
 *
 * @see specs/013-app-intents/contracts/app-intents-bridge.md
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type { Mood } from '@/modules/app-intents-lab/mood-store';

/** Thrown by every bridge method (other than isAvailable) on
 *  non-iOS / iOS < 16 / when the native module is absent. */
export class AppIntentsNotSupported extends Error {
  constructor(message?: string) {
    super(message ?? 'AppIntentsNotSupported');
    this.name = 'AppIntentsNotSupported';
  }
}

export interface AppIntentsBridge {
  isAvailable(): boolean;
  logMood(mood: Mood): Promise<{ ok: true; logged: Mood; timestamp: number }>;
  getLastMood(): Promise<{ ok: true; mood: Mood | null }>;
  greetUser(name: string): Promise<{ ok: true; greeting: string }>;
}

interface NativeAppIntents {
  logMood(args: { mood: Mood }): Promise<{ logged: Mood; timestamp: number }>;
  getLastMood(): Promise<{ mood: Mood | null }>;
  greetUser(args: { name: string }): Promise<{ greeting: string }>;
}

const native = requireOptionalNativeModule<NativeAppIntents>('AppIntents');

function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const v = Platform.Version;
  return typeof v === 'string' ? parseFloat(v) : v;
}

function mapNativeError(err: unknown): Error {
  if (err instanceof Error) {
    const message = err.message;
    if (message === 'NOT_SUPPORTED' || message.includes('NOT_SUPPORTED')) {
      return new AppIntentsNotSupported();
    }
    return err;
  }
  return new Error(String(err));
}

const bridge: AppIntentsBridge = Object.freeze({
  isAvailable(): boolean {
    return Platform.OS === 'ios' && getIOSVersion() >= 16 && native != null;
  },

  async logMood(mood: Mood): Promise<{ ok: true; logged: Mood; timestamp: number }> {
    if (!bridge.isAvailable() || native == null) {
      throw new AppIntentsNotSupported();
    }
    try {
      const r = await native.logMood({ mood });
      return { ok: true, logged: r.logged, timestamp: r.timestamp };
    } catch (err) {
      throw mapNativeError(err);
    }
  },

  async getLastMood(): Promise<{ ok: true; mood: Mood | null }> {
    if (!bridge.isAvailable() || native == null) {
      throw new AppIntentsNotSupported();
    }
    try {
      const r = await native.getLastMood();
      return { ok: true, mood: r.mood };
    } catch (err) {
      throw mapNativeError(err);
    }
  },

  async greetUser(name: string): Promise<{ ok: true; greeting: string }> {
    if (!bridge.isAvailable() || native == null) {
      throw new AppIntentsNotSupported();
    }
    try {
      const r = await native.greetUser({ name });
      return { ok: true, greeting: r.greeting };
    } catch (err) {
      throw mapNativeError(err);
    }
  },
});

export default bridge;
