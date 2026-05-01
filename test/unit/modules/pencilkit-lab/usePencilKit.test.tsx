/**
 * usePencilKit Hook Test
 * Feature: 082-pencilkit
 */

import { renderHook, act } from '@testing-library/react-native';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';

import {
  __setPencilKitBridgeForTests,
  usePencilKit,
} from '@/modules/pencilkit-lab/hooks/usePencilKit';
import type {
  CanvasInfo,
  DrawingStats,
  PencilKitBridge,
  ToolInfo,
  ToolType,
} from '@/native/pencilkit.types';

describe('usePencilKit', () => {
  let bridge: PencilKitBridge;
  let info: CanvasInfo;
  let stats: DrawingStats;

  beforeEach(() => {
    info = { available: true, supportsPencil: true, drawingPolicy: 'default' };
    stats = { strokeCount: 0, dataLength: 0, boundingWidth: 0, boundingHeight: 0 };
    bridge = {
      getCanvasInfo: jest.fn(async (): Promise<CanvasInfo> => info),
      newDrawing: jest.fn(async (): Promise<void> => {}),
      clearDrawing: jest.fn(async (): Promise<void> => {}),
      getDrawingStats: jest.fn(async (): Promise<DrawingStats> => stats),
      setTool: jest.fn(
        async (type: ToolType, width: number, color: string): Promise<ToolInfo> => ({
          type,
          width,
          color,
          opacity: 1,
        }),
      ),
      setDrawingPolicy: jest.fn(async (): Promise<void> => {}),
      exportDrawingData: jest.fn(async (): Promise<string> => 'b64-data'),
      importDrawingData: jest.fn(async (): Promise<void> => {}),
    };
    __setPencilKitBridgeForTests(bridge);
  });

  afterEach(() => {
    __setPencilKitBridgeForTests(null);
  });

  it('initial state is empty / idle', () => {
    const { result } = renderHook(() => usePencilKit());
    expect(result.current.canvasInfo).toBeNull();
    expect(result.current.currentTool.type).toBe('pen');
    expect(result.current.drawingStats.strokeCount).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('initCanvas populates canvasInfo and stats', async () => {
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.initCanvas();
    });
    expect(bridge.getCanvasInfo).toHaveBeenCalledTimes(1);
    expect(bridge.newDrawing).toHaveBeenCalledTimes(1);
    expect(result.current.canvasInfo?.available).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('initCanvas error path', async () => {
    bridge.getCanvasInfo = jest.fn(async () => {
      throw new Error('init-failed');
    });
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.initCanvas();
    });
    expect(result.current.canvasInfo).toBeNull();
    expect(result.current.lastError?.message).toBe('init-failed');
    expect(result.current.loading).toBe(false);
  });

  it('clearCanvas resets stats', async () => {
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.clearCanvas();
    });
    expect(bridge.clearDrawing).toHaveBeenCalledTimes(1);
    expect(result.current.drawingStats.strokeCount).toBe(0);
  });

  it('clearCanvas error path', async () => {
    bridge.clearDrawing = jest.fn(async () => {
      throw new Error('clear-failed');
    });
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.clearCanvas();
    });
    expect(result.current.lastError?.message).toBe('clear-failed');
  });

  it('setTool updates the current tool', async () => {
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.setTool('marker', 8, '#FF0000');
    });
    expect(bridge.setTool).toHaveBeenCalledWith('marker', 8, '#FF0000');
    expect(result.current.currentTool.type).toBe('marker');
    expect(result.current.currentTool.width).toBe(8);
  });

  it('setTool error path returns null and records error', async () => {
    bridge.setTool = jest.fn(async () => {
      throw new Error('tool-failed');
    });
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    let returned: ToolInfo | null = { type: 'pen', width: 0, color: '', opacity: 0 };
    await act(async () => {
      returned = await result.current.setTool('pen', 4, '#000');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('tool-failed');
  });

  it('setPolicy updates canvasInfo.drawingPolicy', async () => {
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.initCanvas();
    });
    await act(async () => {
      await result.current.setPolicy('pencilOnly');
    });
    expect(bridge.setDrawingPolicy).toHaveBeenCalledWith('pencilOnly');
    expect(result.current.canvasInfo?.drawingPolicy).toBe('pencilOnly');
  });

  it('setPolicy error path', async () => {
    bridge.setDrawingPolicy = jest.fn(async () => {
      throw new Error('policy-failed');
    });
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.setPolicy('anyInput');
    });
    expect(result.current.lastError?.message).toBe('policy-failed');
  });

  it('exportDrawing returns the bridge data', async () => {
    const { result } = renderHook(() => usePencilKit());
    let data: string | null = null;
    await act(async () => {
      data = await result.current.exportDrawing();
    });
    expect(data).toBe('b64-data');
  });

  it('exportDrawing error returns null', async () => {
    bridge.exportDrawingData = jest.fn(async () => {
      throw new Error('export-failed');
    });
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    let data: string | null = 'placeholder';
    await act(async () => {
      data = await result.current.exportDrawing();
    });
    expect(data).toBeNull();
    expect(result.current.lastError?.message).toBe('export-failed');
  });

  it('importDrawing pulls fresh stats afterwards', async () => {
    stats = { strokeCount: 7, dataLength: 1024, boundingWidth: 320, boundingHeight: 240 };
    bridge.getDrawingStats = jest.fn(async () => stats);
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.importDrawing('blob');
    });
    expect(bridge.importDrawingData).toHaveBeenCalledWith('blob');
    expect(result.current.drawingStats.strokeCount).toBe(7);
  });

  it('importDrawing error path', async () => {
    bridge.importDrawingData = jest.fn(async () => {
      throw new Error('import-failed');
    });
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.importDrawing('blob');
    });
    expect(result.current.lastError?.message).toBe('import-failed');
  });

  it('refreshStats updates drawingStats', async () => {
    stats = { strokeCount: 3, dataLength: 100, boundingWidth: 10, boundingHeight: 20 };
    bridge.getDrawingStats = jest.fn(async () => stats);
    __setPencilKitBridgeForTests(bridge);
    const { result } = renderHook(() => usePencilKit());
    await act(async () => {
      await result.current.refreshStats();
    });
    expect(result.current.drawingStats.strokeCount).toBe(3);
  });
});
