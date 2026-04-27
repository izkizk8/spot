/**
 * @file SensorsContext.tsx
 * @description In-screen registration bus: cards register a tiny handle
 * with the screen so the global "Start All" / "Stop All" buttons can iterate them.
 *
 * The bus is intentionally minimal — it carries refs, not React state, so the
 * header can poll `isRunning` / `isAvailable` cheaply without re-subscribing.
 */
import React, { createContext, useContext } from 'react';

export interface SensorCardHandle {
  /** Stable id for debug/testing. */
  readonly id: string;
  /** Whether this card's underlying sensor is usable on this device. */
  isAvailable(): boolean;
  /** Whether this card is currently streaming. */
  isRunning(): boolean;
  start(): void;
  stop(): void;
}

export interface SensorsRegistry {
  register(handle: SensorCardHandle): () => void;
  /** Snapshot all currently-registered handles. */
  list(): readonly SensorCardHandle[];
}

const Ctx = createContext<SensorsRegistry | null>(null);

export const SensorsRegistryProvider = Ctx.Provider;

export function useSensorsRegistry(): SensorsRegistry | null {
  return useContext(Ctx);
}

/**
 * Hook for cards: registers `handle` with the parent screen, if any.
 * Cards used outside the screen (e.g. in unit tests that mount a card alone)
 * silently no-op.
 */
export function useRegisterCard(handle: SensorCardHandle): void {
  const registry = useSensorsRegistry();
  React.useEffect(() => {
    if (!registry) return;
    return registry.register(handle);
    // The handle object is stable across renders by construction (built from refs).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry]);
}
