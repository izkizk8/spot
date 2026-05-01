/**
 * usePencilKit Hook
 * Feature: 082-pencilkit
 *
 * State machine for the PencilKit lab. Tracks canvas capability info,
 * the currently-selected tool, drawing stats, the loading flag, and
 * the last error. The native bridge is replaceable at the import
 * boundary via `__setPencilKitBridgeForTests` for unit tests.
 */

import { useCallback, useState } from 'react';

import pencilkitDefault from '@/native/pencilkit';
import type {
  CanvasInfo,
  DrawingPolicy,
  DrawingStats,
  PencilKitBridge,
  ToolInfo,
  ToolType,
} from '@/native/pencilkit.types';

let mockBridge: PencilKitBridge | null = null;

export function __setPencilKitBridgeForTests(bridge: PencilKitBridge | null) {
  mockBridge = bridge;
}

function getBridge(): PencilKitBridge {
  if (mockBridge) return mockBridge;
  return pencilkitDefault;
}

const DEFAULT_TOOL: ToolInfo = {
  type: 'pen',
  width: 4,
  color: '#000000',
  opacity: 1,
};

const DEFAULT_STATS: DrawingStats = {
  strokeCount: 0,
  dataLength: 0,
  boundingWidth: 0,
  boundingHeight: 0,
};

export interface PencilKitState {
  canvasInfo: CanvasInfo | null;
  currentTool: ToolInfo;
  drawingStats: DrawingStats;
  loading: boolean;
  lastError: Error | null;
}

export interface PencilKitActions {
  initCanvas: () => Promise<void>;
  clearCanvas: () => Promise<void>;
  setTool: (tool: ToolType, width: number, color: string) => Promise<ToolInfo | null>;
  setPolicy: (policy: DrawingPolicy) => Promise<void>;
  exportDrawing: () => Promise<string | null>;
  importDrawing: (data: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function usePencilKit(): PencilKitState & PencilKitActions {
  const [canvasInfo, setCanvasInfo] = useState<CanvasInfo | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolInfo>(DEFAULT_TOOL);
  const [drawingStats, setDrawingStats] = useState<DrawingStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const initCanvas = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const bridge = getBridge();
      const info = await bridge.getCanvasInfo();
      setCanvasInfo(info);
      try {
        await bridge.newDrawing();
        const stats = await bridge.getDrawingStats();
        setDrawingStats(stats);
      } catch {
        setDrawingStats(DEFAULT_STATS);
      }
    } catch (err) {
      setLastError(err as Error);
      setCanvasInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCanvas = useCallback(async () => {
    setLastError(null);
    try {
      const bridge = getBridge();
      await bridge.clearDrawing();
      setDrawingStats(DEFAULT_STATS);
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  const setTool = useCallback(
    async (tool: ToolType, width: number, color: string): Promise<ToolInfo | null> => {
      setLastError(null);
      try {
        const bridge = getBridge();
        const info = await bridge.setTool(tool, width, color);
        setCurrentTool(info);
        return info;
      } catch (err) {
        setLastError(err as Error);
        return null;
      }
    },
    [],
  );

  const setPolicy = useCallback(async (policy: DrawingPolicy) => {
    setLastError(null);
    try {
      const bridge = getBridge();
      await bridge.setDrawingPolicy(policy);
      setCanvasInfo((prev) => (prev ? { ...prev, drawingPolicy: policy } : prev));
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  const exportDrawing = useCallback(async (): Promise<string | null> => {
    setLastError(null);
    try {
      const bridge = getBridge();
      return await bridge.exportDrawingData();
    } catch (err) {
      setLastError(err as Error);
      return null;
    }
  }, []);

  const importDrawing = useCallback(async (data: string) => {
    setLastError(null);
    try {
      const bridge = getBridge();
      await bridge.importDrawingData(data);
      const stats = await bridge.getDrawingStats();
      setDrawingStats(stats);
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    setLastError(null);
    try {
      const bridge = getBridge();
      const stats = await bridge.getDrawingStats();
      setDrawingStats(stats);
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  return {
    canvasInfo,
    currentTool,
    drawingStats,
    loading,
    lastError,
    initCanvas,
    clearCanvas,
    setTool,
    setPolicy,
    exportDrawing,
    importDrawing,
    refreshStats,
  };
}
