/**
 * PencilKit Bridge — Android stub (feature 082).
 *
 * PencilKit is iOS-only. All methods reject with
 * `PencilKitNotSupported`. MUST NOT import the iOS variant.
 */

import {
  PencilKitNotSupported,
  type CanvasInfo,
  type DrawingPolicy,
  type DrawingStats,
  type PencilKitBridge,
  type ToolInfo,
  type ToolType,
} from './pencilkit.types';

export { PencilKitNotSupported };

const ERR = (): PencilKitNotSupported =>
  new PencilKitNotSupported('PencilKit is not available on Android');

export function getCanvasInfo(): Promise<CanvasInfo> {
  return Promise.reject(ERR());
}

export function newDrawing(): Promise<void> {
  return Promise.reject(ERR());
}

export function clearDrawing(): Promise<void> {
  return Promise.reject(ERR());
}

export function getDrawingStats(): Promise<DrawingStats> {
  return Promise.reject(ERR());
}

export function setTool(_tool: ToolType, _width: number, _color: string): Promise<ToolInfo> {
  return Promise.reject(ERR());
}

export function setDrawingPolicy(_policy: DrawingPolicy): Promise<void> {
  return Promise.reject(ERR());
}

export function exportDrawingData(): Promise<string> {
  return Promise.reject(ERR());
}

export function importDrawingData(_data: string): Promise<void> {
  return Promise.reject(ERR());
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
