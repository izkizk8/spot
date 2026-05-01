/**
 * useLiveText Hook Test
 * Feature: 080-live-text
 *
 * Exercises refreshCapabilities, recognizeText, startScanner, stopScanner, and error paths.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import {
  __setLiveTextBridgeForTests,
  useLiveText,
} from '@/modules/live-text-lab/hooks/useLiveText';
import type {
  LiveTextBridge,
  LiveTextCapabilities,
  OCRResult,
  ScanSession,
} from '@/native/live-text.types';

const sampleCapabilities: LiveTextCapabilities = {
  visionOCR: true,
  dataScanner: true,
  imageAnalysis: true,
  osVersion: '16.4',
};

const sampleResult: OCRResult = {
  blocks: [
    { text: 'Hello World', confidence: 0.98, boundingBox: [0, 0, 0.5, 0.1] },
    { text: 'iOS Live Text', confidence: 0.95, boundingBox: [0, 0.15, 0.6, 0.1] },
  ],
  fullText: 'Hello World\niOS Live Text',
  recognisedAt: '2024-06-01T12:00:00Z',
};

const sampleSession: ScanSession = {
  sessionId: 'session-1',
  active: true,
};

describe('useLiveText', () => {
  let bridge: LiveTextBridge;

  beforeEach(() => {
    bridge = {
      getCapabilities: jest.fn(async (): Promise<LiveTextCapabilities> => sampleCapabilities),
      recognizeText: jest.fn(async (): Promise<OCRResult> => sampleResult),
      startScanner: jest.fn(async (): Promise<ScanSession> => sampleSession),
      stopScanner: jest.fn(async (): Promise<void> => undefined),
    };
    __setLiveTextBridgeForTests(bridge);
  });

  afterEach(() => {
    __setLiveTextBridgeForTests(null);
  });

  it('initial state is empty / idle', () => {
    const { result } = renderHook(() => useLiveText());
    expect(result.current.capabilities).toBeNull();
    expect(result.current.lastResult).toBeNull();
    expect(result.current.activeScanSession).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('refreshCapabilities populates capabilities', async () => {
    const { result } = renderHook(() => useLiveText());
    await act(async () => {
      await result.current.refreshCapabilities();
    });
    expect(bridge.getCapabilities).toHaveBeenCalledTimes(1);
    expect(result.current.capabilities?.visionOCR).toBe(true);
    expect(result.current.capabilities?.dataScanner).toBe(true);
    expect(result.current.capabilities?.osVersion).toBe('16.4');
  });

  it('refreshCapabilities records error and resets loading', async () => {
    bridge.getCapabilities = jest.fn(async () => {
      throw new Error('caps-failed');
    });
    __setLiveTextBridgeForTests(bridge);
    const { result } = renderHook(() => useLiveText());
    await act(async () => {
      await result.current.refreshCapabilities();
    });
    expect(result.current.lastError?.message).toBe('caps-failed');
    expect(result.current.loading).toBe(false);
  });

  it('recognizeText populates lastResult', async () => {
    const { result } = renderHook(() => useLiveText());
    await act(async () => {
      await result.current.recognizeText('base64data');
    });
    expect(bridge.recognizeText).toHaveBeenCalledWith('base64data', undefined);
    expect(result.current.lastResult?.fullText).toBe('Hello World\niOS Live Text');
    expect(result.current.lastResult?.blocks).toHaveLength(2);
  });

  it('recognizeText with language hint passes it to bridge', async () => {
    const { result } = renderHook(() => useLiveText());
    await act(async () => {
      await result.current.recognizeText('b64', 'zh-Hans');
    });
    expect(bridge.recognizeText).toHaveBeenCalledWith('b64', 'zh-Hans');
  });

  it('recognizeText error path returns null and records error', async () => {
    bridge.recognizeText = jest.fn(async () => {
      throw new Error('ocr-failed');
    });
    __setLiveTextBridgeForTests(bridge);
    const { result } = renderHook(() => useLiveText());
    let returned: OCRResult | null = sampleResult;
    await act(async () => {
      returned = await result.current.recognizeText('data');
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('ocr-failed');
    expect(result.current.loading).toBe(false);
  });

  it('startScanner sets activeScanSession', async () => {
    const { result } = renderHook(() => useLiveText());
    await act(async () => {
      await result.current.startScanner({ languages: ['en-US'], includeBarcodes: false });
    });
    expect(result.current.activeScanSession?.sessionId).toBe('session-1');
    expect(result.current.activeScanSession?.active).toBe(true);
  });

  it('startScanner error path returns null and records error', async () => {
    bridge.startScanner = jest.fn(async () => {
      throw new Error('scanner-failed');
    });
    __setLiveTextBridgeForTests(bridge);
    const { result } = renderHook(() => useLiveText());
    let returned: ScanSession | null = sampleSession;
    await act(async () => {
      returned = await result.current.startScanner({
        languages: ['en-US'],
        includeBarcodes: false,
      });
    });
    expect(returned).toBeNull();
    expect(result.current.lastError?.message).toBe('scanner-failed');
  });

  it('stopScanner clears activeScanSession', async () => {
    const { result } = renderHook(() => useLiveText());
    await act(async () => {
      await result.current.startScanner({ languages: ['en-US'], includeBarcodes: false });
    });
    expect(result.current.activeScanSession).not.toBeNull();
    await act(async () => {
      await result.current.stopScanner('session-1');
    });
    expect(bridge.stopScanner).toHaveBeenCalledWith('session-1');
    expect(result.current.activeScanSession).toBeNull();
  });

  it('stopScanner error path records error', async () => {
    bridge.stopScanner = jest.fn(async () => {
      throw new Error('stop-failed');
    });
    __setLiveTextBridgeForTests(bridge);
    const { result } = renderHook(() => useLiveText());
    await act(async () => {
      await result.current.stopScanner('session-x');
    });
    expect(result.current.lastError?.message).toBe('stop-failed');
  });
});
