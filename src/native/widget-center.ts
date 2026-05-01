// src/native/widget-center.ts (iOS implementation)
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { WidgetCenterBridge, WidgetConfig, LockConfig } from './widget-center.types';
import { WidgetCenterNotSupportedError, WidgetCenterBridgeError } from './widget-center.types';

interface NativeModule {
  getCurrentConfig(): Promise<WidgetConfig>;
  setConfig(config: WidgetConfig): Promise<void>;
  reloadAllTimelines(): Promise<void>;
  reloadTimelinesByKind(kind: string): Promise<void>;
  getLockConfig(): Promise<LockConfig>;
  setLockConfig(config: LockConfig): Promise<void>;
}

const nativeModule = requireOptionalNativeModule<NativeModule>('SpotWidgetCenter');

function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const versionString = Platform.Version?.toString() ?? '0';
  const major = parseInt(versionString.split('.')[0] ?? '0', 10);
  return major;
}

const bridge: WidgetCenterBridge = {
  isAvailable(): boolean {
    return Platform.OS === 'ios' && getIOSVersion() >= 14 && nativeModule !== null;
  },

  async getCurrentConfig(): Promise<WidgetConfig> {
    if (!bridge.isAvailable()) {
      throw new WidgetCenterNotSupportedError();
    }
    try {
      return await nativeModule!.getCurrentConfig();
    } catch (err: any) {
      if (err?.code === 'NOT_SUPPORTED') {
        throw new WidgetCenterNotSupportedError(err.message);
      }
      throw new WidgetCenterBridgeError(err?.message ?? String(err));
    }
  },

  async setConfig(config: WidgetConfig): Promise<void> {
    if (!bridge.isAvailable()) {
      throw new WidgetCenterNotSupportedError();
    }
    try {
      await nativeModule!.setConfig(config);
    } catch (err: any) {
      if (err?.code === 'NOT_SUPPORTED') {
        throw new WidgetCenterNotSupportedError(err.message);
      }
      throw new WidgetCenterBridgeError(err?.message ?? String(err));
    }
  },

  async reloadAllTimelines(): Promise<void> {
    if (!bridge.isAvailable()) {
      throw new WidgetCenterNotSupportedError();
    }
    try {
      await nativeModule!.reloadAllTimelines();
    } catch (err: any) {
      if (err?.code === 'NOT_SUPPORTED') {
        throw new WidgetCenterNotSupportedError(err.message);
      }
      throw new WidgetCenterBridgeError(err?.message ?? String(err));
    }
  },

  async reloadTimelinesByKind(kind: string): Promise<void> {
    // Lock screen widgets require iOS 16+
    if (Platform.OS !== 'ios' || getIOSVersion() < 16 || nativeModule === null) {
      throw new WidgetCenterNotSupportedError('Lock screen widgets require iOS 16+');
    }
    try {
      await nativeModule.reloadTimelinesByKind(kind);
    } catch (err: any) {
      if (err?.code === 'NOT_SUPPORTED') {
        throw new WidgetCenterNotSupportedError(err.message);
      }
      throw new WidgetCenterBridgeError(err?.message ?? String(err));
    }
  },

  async getLockConfig(): Promise<LockConfig> {
    // Lock screen widgets require iOS 16+
    if (Platform.OS !== 'ios' || getIOSVersion() < 16 || nativeModule === null) {
      throw new WidgetCenterNotSupportedError('Lock screen widgets require iOS 16+');
    }
    try {
      return await nativeModule.getLockConfig();
    } catch (err: any) {
      if (err?.code === 'NOT_SUPPORTED') {
        throw new WidgetCenterNotSupportedError(err.message);
      }
      throw new WidgetCenterBridgeError(err?.message ?? String(err));
    }
  },

  async setLockConfig(config: LockConfig): Promise<void> {
    // Lock screen widgets require iOS 16+
    if (Platform.OS !== 'ios' || getIOSVersion() < 16 || nativeModule === null) {
      throw new WidgetCenterNotSupportedError('Lock screen widgets require iOS 16+');
    }
    try {
      await nativeModule.setLockConfig(config);
    } catch (err: any) {
      if (err?.code === 'NOT_SUPPORTED') {
        throw new WidgetCenterNotSupportedError(err.message);
      }
      throw new WidgetCenterBridgeError(err?.message ?? String(err));
    }
  },
};

export default bridge;
