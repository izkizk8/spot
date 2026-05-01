/**
 * PencilKit Bridge Types
 * Feature: 082-pencilkit
 *
 * Shared type definitions for the PencilKit bridge. iOS 17+
 * `PKCanvasView`, `PKDrawing`, and `PKToolPicker` exposed through an
 * Expo Module surface.
 */

export const NATIVE_MODULE_NAME = 'PencilKit' as const;

/**
 * Tool kind — mirrors the PKInkingTool / PKEraserTool / PKLassoTool
 * variants available on iOS 17+.
 */
export type ToolType = 'pen' | 'pencil' | 'marker' | 'crayon' | 'eraser' | 'lasso';

/**
 * Drawing input policy — controls which input devices may draw.
 * Mirrors PKCanvasView.drawingPolicy.
 */
export type DrawingPolicy = 'default' | 'anyInput' | 'pencilOnly';

/**
 * Currently-selected tool snapshot surfaced to JS.
 */
export interface ToolInfo {
  type: ToolType;
  width: number;
  color: string;
  opacity: number;
}

/**
 * Drawing summary — used by the StatsCard.
 */
export interface DrawingStats {
  strokeCount: number;
  dataLength: number;
  boundingWidth: number;
  boundingHeight: number;
}

/**
 * Canvas capability info surfaced by `getCanvasInfo` — used by the
 * CapabilityCard.
 */
export interface CanvasInfo {
  available: boolean;
  supportsPencil: boolean;
  drawingPolicy: DrawingPolicy;
}

export interface PencilKitBridge {
  getCanvasInfo(): Promise<CanvasInfo>;
  newDrawing(): Promise<void>;
  clearDrawing(): Promise<void>;
  getDrawingStats(): Promise<DrawingStats>;
  setTool(tool: ToolType, width: number, color: string): Promise<ToolInfo>;
  setDrawingPolicy(policy: DrawingPolicy): Promise<void>;
  exportDrawingData(): Promise<string>;
  importDrawingData(data: string): Promise<void>;
}

export class PencilKitNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PencilKitNotSupported';
  }
}
