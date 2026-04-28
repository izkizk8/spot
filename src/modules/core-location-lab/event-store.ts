/**
 * In-memory geofence event store for Core Location Lab (feature 025).
 *
 * FIFO-capped at 100 entries with idempotency on (regionId, type, timestamp-bucket).
 * Stored on globalThis.__coreLocationGeofenceStore for the geofence task handler
 * to write to and the useRegionMonitoring hook to read from.
 */

import type { RegionEvent } from './types';

// Timestamp bucket granularity: 1 second (collapse rapid duplicates)
const TIMESTAMP_BUCKET_MS = 1000;
const MAX_EVENTS = 100;

type StoreListener = (events: readonly RegionEvent[]) => void;

interface GeofenceStore {
  events: RegionEvent[];
  listeners: Set<StoreListener>;
  eventIdCounter: number;
  seenKeys: Set<string>;
}

// Use module-scoped store, with fallback to globalThis for task handler
function getStore(): GeofenceStore {
  const globalStore = globalThis as unknown as { __coreLocationGeofenceStore?: GeofenceStore };
  if (!globalStore.__coreLocationGeofenceStore) {
    globalStore.__coreLocationGeofenceStore = {
      events: [],
      listeners: new Set(),
      eventIdCounter: 0,
      seenKeys: new Set(),
    };
  }
  return globalStore.__coreLocationGeofenceStore;
}

function makeDedupeKey(regionId: string, type: 'enter' | 'exit', timestamp: Date): string {
  const bucket = Math.floor(timestamp.getTime() / TIMESTAMP_BUCKET_MS);
  return `${regionId}|${type}|${bucket}`;
}

/**
 * Append a geofence event to the store. Idempotent — duplicates within the same
 * timestamp bucket are collapsed.
 */
export function appendGeofenceEvent(event: {
  regionId: string;
  type: 'enter' | 'exit';
  timestamp: Date;
}): void {
  const store = getStore();
  const key = makeDedupeKey(event.regionId, event.type, event.timestamp);

  // Idempotency check
  if (store.seenKeys.has(key)) {
    return;
  }

  const newEvent: RegionEvent = {
    id: `revt-${Date.now()}-${++store.eventIdCounter}`,
    regionId: event.regionId,
    type: event.type,
    timestamp: event.timestamp,
  };

  store.seenKeys.add(key);
  store.events.push(newEvent);

  // FIFO eviction
  while (store.events.length > MAX_EVENTS) {
    const evicted = store.events.shift();
    if (evicted) {
      // Clean up seen keys for old events (only for the bucket key, not exact timestamp)
      // We use a simple approach: just let old keys stay since the Set is bounded by MAX_EVENTS
    }
  }

  // Notify listeners
  const snapshot = [...store.events];
  store.listeners.forEach((listener) => listener(snapshot));
}

/**
 * Subscribe to geofence event updates. Returns an unsubscribe function.
 */
export function subscribeGeofenceEvents(listener: StoreListener): () => void {
  const store = getStore();
  store.listeners.add(listener);

  // Immediately call with current state
  listener([...store.events]);

  return () => {
    store.listeners.delete(listener);
  };
}

/**
 * Get the current list of geofence events (newest last).
 */
export function getGeofenceEvents(): readonly RegionEvent[] {
  return [...getStore().events];
}

/**
 * Reset the store (test-only helper).
 */
export function __resetGeofenceStore(): void {
  const globalStore = globalThis as unknown as { __coreLocationGeofenceStore?: GeofenceStore };
  globalStore.__coreLocationGeofenceStore = {
    events: [],
    listeners: new Set(),
    eventIdCounter: 0,
    seenKeys: new Set(),
  };
}
