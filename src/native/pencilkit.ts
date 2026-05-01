/**
 * PencilKit Bridge — iOS variant (feature 082).
 *
 * Single seam where the `PencilKit` Expo Module is touched. Resolved
 * via `requireOptionalNativeModule` so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  PencilKitNotSupported,
  type CanvasInfo,
  type DrawingPolicy,
  type DrawingStats,
  type PencilKitBridge,
  type ToolInfo,
  type ToolType,
} from './pencilkit.types';

export { PencilKitNotSupported };

interface NativePencilKit {
  getCanvasInfo(): Promise<CanvasInfo>;
  newDrawing(): Promise<void>;
  clearDrawing(): Promise<void>;
  getDrawingStats(): Promise<DrawingStats>;
  setTool(tool: ToolType, width: number, color: string): Promise<ToolInfo>;
  setDrawingPolicy(policy: DrawingPolicy): Promise<void>;
  exportDrawingData(): Promise<string>;
  importDrawingData(data: string): Promise<void>;
}

function getNative(): NativePencilKit | null {
  return requireOptionalNativeModule<NativePencilKit>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativePencilKit {
  if (Platform.OS !== 'ios') {
    throw new PencilKitNotSupported(`PencilKit is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new PencilKitNotSupported('PencilKit native module is not registered');
  }
  return native;
}

export function getCanvasInfo(): Promise<CanvasInfo> {
  try {
    return ensureNative().getCanvasInfo();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function newDrawing(): Promise<void> {
  try {
    return ensureNative().newDrawing();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function clearDrawing(): Promise<void> {
  try {
    return ensureNative().clearDrawing();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function getDrawingStats(): Promise<DrawingStats> {
  try {
    return ensureNative().getDrawingStats();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function setTool(tool: ToolType, width: number, color: string): Promise<ToolInfo> {
  try {
    return ensureNative().setTool(tool, width, color);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function setDrawingPolicy(policy: DrawingPolicy): Promise<void> {
  try {
    return ensureNative().setDrawingPolicy(policy);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function exportDrawingData(): Promise<string> {
  try {
    return ensureNative().exportDrawingData();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function importDrawingData(data: string): Promise<void> {
  try {
    return ensureNative().importDrawingData(data);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const pencilkit: PencilKitBridge = {
  getCanvasInfo,
  newDrawing,
  clearDrawing,
  getDrawingStats,
  setTool,
  setDrawingPolicy,
  exportDrawingData,
  importDrawingData,
};

export default pencilkit;
