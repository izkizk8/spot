/**
 * useFrameAnalyzer hook for Camera Vision (feature 017).
 *
 * Manages the frame analysis loop: captures frames from expo-camera,
 * submits them to the vision-detector bridge, and updates state with
 * observations, FPS, and error reporting.
 *
 * @see specs/017-camera-vision/data-model.md §5–§7
 */

import { useEffect, useRef, useState } from 'react';
import type { CameraView } from 'expo-camera';
import visionBridge from '@/native/vision-detector';
import type { VisionBridge } from '@/native/vision-detector.types';
import type { VisionMode, Observation } from '../vision-types';

export interface FrameAnalyzerState {
  fps: number;
  lastAnalysisMs: number | null;
  detected: number;
  observations: Observation[];
  error: Error | null;
}

export interface UseFrameAnalyzerOptions {
  mode: VisionMode;
  intervalMs?: number;
  cameraRef: React.RefObject<CameraView | null>;
  bridgeOverride?: VisionBridge;
}

const initialState: FrameAnalyzerState = {
  fps: 0,
  lastAnalysisMs: null,
  detected: 0,
  observations: [],
  error: null,
};

const FPS_WINDOW_SIZE = 8;

export function useFrameAnalyzer({
  mode,
  intervalMs = 250,
  cameraRef,
  bridgeOverride,
}: UseFrameAnalyzerOptions): FrameAnalyzerState {
  const [state, setState] = useState<FrameAnalyzerState>(initialState);
  const bridge = bridgeOverride ?? visionBridge;

  const inFlightRef = useRef(false);
  const currentModeRef = useRef(mode);
  const unmountedRef = useRef(false);
  const fpsBufferRef = useRef<number[]>([]);
  const lastTickRef = useRef<number>(Date.now());

  // Update current mode ref
  currentModeRef.current = mode;

  useEffect(() => {
    // Reset unmounted flag on mount
    unmountedRef.current = false;

    // Clear state when mode changes to 'off'
    if (mode === 'off') {
      setState((prev) => ({
        ...prev,
        observations: [],
        detected: 0,
      }));
      return;
    }

    // Don't start loop if camera ref is null (permission denied)
    if (!cameraRef.current) {
      return;
    }

    // Don't start loop if bridge is not available
    if (!bridge.isAvailable()) {
      return;
    }

    const intervalId = setInterval(async () => {
      // Skip if previous cycle is still in flight
      if (inFlightRef.current) {
        return;
      }

      // Skip if camera ref is no longer available
      if (!cameraRef.current) {
        return;
      }

      inFlightRef.current = true;
      const modeAtTick = currentModeRef.current;
      const tickTime = Date.now();
      const timeSinceLastTick = tickTime - lastTickRef.current;
      lastTickRef.current = tickTime;

      try {
        // Capture frame
        const picture = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
          skipProcessing: true,
        });

        if (!picture?.base64) {
          throw new Error('Failed to capture base64 image');
        }

        // Analyze frame
        const result = await bridge.analyze(modeAtTick as any, { base64: picture.base64 });

        // Discard if mode changed during analysis
        if (modeAtTick !== currentModeRef.current) {
          return;
        }

        // Calculate FPS
        const instantFps = 1000 / timeSinceLastTick;
        fpsBufferRef.current.push(instantFps);
        if (fpsBufferRef.current.length > FPS_WINDOW_SIZE) {
          fpsBufferRef.current.shift();
        }
        const avgFps =
          fpsBufferRef.current.reduce((sum, val) => sum + val, 0) / fpsBufferRef.current.length;

        // Update state atomically
        if (!unmountedRef.current) {
          setState({
            observations: result.observations,
            detected: result.observations.length,
            lastAnalysisMs: result.analysisMs,
            fps: avgFps,
            error: null,
          });
        }
      } catch (err) {
        // Populate error, leave observations untouched
        if (!unmountedRef.current) {
          setState((prev) => ({
            ...prev,
            error: err instanceof Error ? err : new Error(String(err)),
          }));
        }
      } finally {
        inFlightRef.current = false;
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      unmountedRef.current = true;
    };
  }, [mode, intervalMs, cameraRef, bridge]);

  return state;
}
