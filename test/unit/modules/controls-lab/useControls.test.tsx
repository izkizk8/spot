/**
 * useControls Hook Test
 * Feature: 087-controls
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { __setControlsBridgeForTests, useControls } from '@/modules/controls-lab/hooks/useControls';
import type {
  ControlActionResult,
  ControlInfo,
  ControlsBridge,
  ControlsCapabilities,
} from '@/native/controls.types';

const sampleCapabilities: ControlsCapabilities = {
  controlWidget: true,
  valueProvider: true,
  osVersion: '18.0',
};

const sampleControls: ControlInfo[] = [
  {
    id: 'com.example.flashlight',
    kind: 'button',
    title: 'Flashlight',
    systemImageName: 'flashlight.on.fill',
    isOn: null,
  },
  {
    id: 'com.example.mute',
    kind: 'toggle',
    title: 'Mute',
    systemImageName: 'speaker.slash.fill',
    isOn: false,
  },
];

const sampleResult: ControlActionResult = {
  controlId: 'com.example.flashlight',
  success: true,
  newValue: null,
  triggeredAt: '2024-06-01T12:00:00Z',
};

describe('useControls', () => {
  let bridge: ControlsBridge;

  beforeEach(() => {
    bridge = {
      getCapabilities: jest.fn(async (): Promise<ControlsCapabilities> => sampleCapabilities),
      getRegisteredControls: jest.fn(async (): Promise<readonly ControlInfo[]> => sampleControls),
      triggerControl: jest.fn(async (): Promise<ControlActionResult> => sampleResult),
    };
    __setControlsBridgeForTests(bridge);
  });

  afterEach(() => {
    __setControlsBridgeForTests(null);
  });

  it('initial state is empty / idle', () => {
    const { result } = renderHook(() => useControls());
    expect(result.current.capabilities).toBeNull();
    expect(result.current.controls).toHaveLength(0);
    expect(result.current.lastActionResult).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('refreshCapabilities populates capabilities', async () => {
    const { result } = renderHook(() => useControls());
    await act(async () => {
      await result.current.refreshCapabilities();
    });
    expect(bridge.getCapabilities).toHaveBeenCalledTimes(1);
    expect(result.current.capabilities?.controlWidget).toBe(true);
    expect(result.current.capabilities?.osVersion).toBe('18.0');
  });

  it('refreshControls populates controls list', async () => {
    const { result } = renderHook(() => useControls());
    await act(async () => {
      await result.current.refreshControls();
    });
    expect(bridge.getRegisteredControls).toHaveBeenCalledTimes(1);
    expect(result.current.controls).toHaveLength(2);
    expect(result.current.controls[0].id).toBe('com.example.flashlight');
  });

  it('triggerControl stores the action result', async () => {
    const { result } = renderHook(() => useControls());
    await act(async () => {
      await result.current.triggerControl('com.example.flashlight');
    });
    expect(bridge.triggerControl).toHaveBeenCalledWith('com.example.flashlight');
    expect(result.current.lastActionResult?.success).toBe(true);
    expect(result.current.lastActionResult?.controlId).toBe('com.example.flashlight');
  });

  it('triggerControl returns null and sets lastError on rejection', async () => {
    const err = new Error('trigger failed');
    (bridge.triggerControl as jest.Mock).mockRejectedValueOnce(err as never);
    const { result } = renderHook(() => useControls());
    let returned: unknown;
    await act(async () => {
      returned = await result.current.triggerControl('com.example.flashlight');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('trigger failed');
  });

  it('refreshCapabilities sets lastError on rejection', async () => {
    const err = new Error('not supported');
    (bridge.getCapabilities as jest.Mock).mockRejectedValueOnce(err as never);
    const { result } = renderHook(() => useControls());
    await act(async () => {
      await result.current.refreshCapabilities();
    });
    expect(result.current.lastError?.message).toBe('not supported');
    expect(result.current.capabilities).toBeNull();
  });
});
