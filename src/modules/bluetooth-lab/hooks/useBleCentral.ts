/**
 * useBleCentral — composite state surface for the Bluetooth Lab screens.
 * Feature: 035-core-bluetooth
 *
 * Reducer-serialised state; subscribes to bridge events on mount;
 * classifies bridge errors per R-D; on unmount stops scan, unsubscribes
 * all subscriptions, disconnects best-effort, detaches every listener
 * (FR-024 / SC-010).
 *
 * @see specs/035-core-bluetooth/contracts/useBleCentral-hook.md
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import * as bridge from '@/native/ble-central';
import {
  type BleCentralEvents,
  type CentralState,
  type CharacteristicEvent,
  type ConnectionState,
  type DiscoveredCharacteristic,
  type DiscoveredPeripheral,
  type DiscoveredService,
  type PermissionStatus,
  BleNotAuthorized,
  BleNotPoweredOn,
  BleNotSupported,
  BleOperationFailed,
} from '@/native/ble-central.types';
import {
  EMPTY_STATE as EMPTY_PERIPHERALS,
  STALE_WINDOW_MS,
  add as addPeripheral,
  prune as prunePeripherals,
  selectSorted,
} from '@/modules/bluetooth-lab/store/peripherals-store';

const EVENT_LOG_CAP = 20;
const PRUNE_TICK_MS = STALE_WINDOW_MS / 6; // ~5 s

const UUID_SHORT_RE = /^[0-9a-fA-F]{4}$/;
const UUID_FULL_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type ScanState = 'idle' | 'scanning' | 'paused';

export interface ConnectedSnapshot {
  readonly peripheral: DiscoveredPeripheral;
  readonly services: readonly DiscoveredService[];
  readonly connectionState: ConnectionState;
  readonly events: Readonly<Record<string, readonly CharacteristicEvent[]>>;
}

export interface BluetoothLabState {
  readonly central: CentralState;
  readonly permission: PermissionStatus;
  readonly scan: ScanState;
  readonly scanFilter: readonly string[];
  readonly allowDuplicates: boolean;
  readonly discovered: readonly DiscoveredPeripheral[];
  readonly connected: ConnectedSnapshot | null;
  readonly lastError: string | null;

  readonly setScan: (next: boolean) => void;
  readonly setFilter: (commaSeparated: string) => void;
  readonly setAllowDuplicates: (next: boolean) => void;
  readonly connect: (peripheralId: string) => Promise<void>;
  readonly disconnect: () => Promise<void>;
  readonly read: (characteristicId: string) => Promise<void>;
  readonly write: (characteristicId: string, bytes: Uint8Array) => Promise<void>;
  readonly subscribe: (characteristicId: string) => Promise<void>;
  readonly unsubscribe: (characteristicId: string) => Promise<void>;
  readonly requestPermission: () => Promise<void>;
  readonly refreshState: () => Promise<void>;
}

interface ReducerState {
  central: CentralState;
  permission: PermissionStatus;
  scan: ScanState;
  scanFilter: readonly string[];
  allowDuplicates: boolean;
  discovered: readonly DiscoveredPeripheral[];
  connected: ConnectedSnapshot | null;
  lastError: string | null;
  // Whether the user wants scanning on (drives auto-resume on poweredOn).
  userWantsScan: boolean;
}

type Action =
  | { type: 'central/update'; state: CentralState }
  | { type: 'permission/update'; status: PermissionStatus }
  | { type: 'scan/setRequested'; requested: boolean }
  | { type: 'scan/setState'; state: ScanState }
  | { type: 'scan/setFilter'; uuids: readonly string[] }
  | { type: 'scan/setAllowDuplicates'; next: boolean }
  | { type: 'discovered/add'; peripheral: DiscoveredPeripheral }
  | { type: 'discovered/prune'; now: number }
  | { type: 'connected/start'; peripheral: DiscoveredPeripheral }
  | { type: 'connected/state'; state: ConnectionState }
  | { type: 'connected/services'; services: readonly DiscoveredService[] }
  | {
      type: 'connected/characteristics';
      serviceId: string;
      chars: readonly DiscoveredCharacteristic[];
    }
  | { type: 'connected/event'; characteristicId: string; event: CharacteristicEvent }
  | { type: 'connected/subscribed'; characteristicId: string; isSubscribed: boolean }
  | { type: 'connected/clear' }
  | { type: 'error/set'; message: string }
  | { type: 'error/clear' };

const initialState: ReducerState = {
  central: 'unknown',
  permission: 'undetermined',
  scan: 'idle',
  scanFilter: [],
  allowDuplicates: false,
  discovered: EMPTY_PERIPHERALS,
  connected: null,
  lastError: null,
  userWantsScan: false,
};

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case 'central/update': {
      let nextScan: ScanState = state.scan;
      if (state.scan === 'scanning' && action.state !== 'poweredOn') {
        nextScan = 'paused';
      } else if (state.scan === 'paused' && action.state === 'poweredOn' && state.userWantsScan) {
        nextScan = 'scanning';
      }
      return { ...state, central: action.state, scan: nextScan };
    }
    case 'permission/update':
      return { ...state, permission: action.status };
    case 'scan/setRequested': {
      const wants = action.requested;
      let scan: ScanState = state.scan;
      if (!wants) {
        scan = 'idle';
      } else if (state.central === 'poweredOn') {
        scan = 'scanning';
      } else {
        scan = 'paused';
      }
      return { ...state, userWantsScan: wants, scan };
    }
    case 'scan/setState':
      return { ...state, scan: action.state };
    case 'scan/setFilter':
      return { ...state, scanFilter: action.uuids, lastError: null };
    case 'scan/setAllowDuplicates':
      return { ...state, allowDuplicates: action.next };
    case 'discovered/add':
      return { ...state, discovered: addPeripheral(state.discovered, action.peripheral) };
    case 'discovered/prune': {
      const next = prunePeripherals(state.discovered, action.now);
      return next === state.discovered ? state : { ...state, discovered: next };
    }
    case 'connected/start':
      return {
        ...state,
        connected: {
          peripheral: action.peripheral,
          services: [],
          connectionState: 'connecting',
          events: {},
        },
      };
    case 'connected/state': {
      if (!state.connected) return state;
      if (action.state === 'disconnected') {
        return { ...state, connected: null };
      }
      return {
        ...state,
        connected: { ...state.connected, connectionState: action.state },
      };
    }
    case 'connected/services':
      if (!state.connected) return state;
      return {
        ...state,
        connected: { ...state.connected, services: action.services },
      };
    case 'connected/characteristics': {
      if (!state.connected) return state;
      const services = state.connected.services.map((s) =>
        s.id === action.serviceId ? { ...s, characteristics: action.chars } : s,
      );
      return { ...state, connected: { ...state.connected, services } };
    }
    case 'connected/event': {
      if (!state.connected) return state;
      const prev = state.connected.events[action.characteristicId] ?? [];
      const next = [...prev, action.event];
      const trimmed = next.length > EVENT_LOG_CAP ? next.slice(next.length - EVENT_LOG_CAP) : next;
      return {
        ...state,
        connected: {
          ...state.connected,
          events: { ...state.connected.events, [action.characteristicId]: trimmed },
        },
      };
    }
    case 'connected/subscribed': {
      if (!state.connected) return state;
      const services = state.connected.services.map((s) => ({
        ...s,
        characteristics: s.characteristics.map((c) =>
          c.id === action.characteristicId ? { ...c, isSubscribed: action.isSubscribed } : c,
        ),
      }));
      return { ...state, connected: { ...state.connected, services } };
    }
    case 'connected/clear':
      return { ...state, connected: null };
    case 'error/set':
      return { ...state, lastError: action.message };
    case 'error/clear':
      return { ...state, lastError: null };
    default:
      return state;
  }
}

function classifyError(e: unknown): { kind: string; message: string } {
  if (e instanceof BleNotSupported) return { kind: 'unsupported', message: e.message };
  if (e instanceof BleNotAuthorized) return { kind: 'unauthorized', message: e.message };
  if (e instanceof BleNotPoweredOn) return { kind: 'not-powered-on', message: e.message };
  if (e instanceof BleOperationFailed) return { kind: e.code, message: e.message };
  if (e instanceof Error) return { kind: 'failed', message: e.message };
  return { kind: 'failed', message: String(e) };
}

function parseFilter(commaSeparated: string): { uuids: readonly string[]; valid: boolean } {
  const parts = commaSeparated
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const p of parts) {
    if (!UUID_SHORT_RE.test(p) && !UUID_FULL_RE.test(p)) {
      return { uuids: [], valid: false };
    }
  }
  return { uuids: parts.map((p) => p.toLowerCase()), valid: true };
}

export function useBleCentral(): BluetoothLabState {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mounted = useRef(true);
  const subsRef = useRef<Array<() => void>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track active subscriptions for cleanup
  const activeSubsRef = useRef<Set<string>>(new Set());
  // Track current connected peripheral id for cleanup
  const connectedIdRef = useRef<string | null>(null);

  // Keep refs for use in callbacks/effects without re-creating them.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    mounted.current = true;
    // Capture refs into local variables for the cleanup closure (the ref's
    // .current value will likely have changed by the time cleanup runs).
    const activeSubs = activeSubsRef.current;
    const connectedSnapshot = () => connectedIdRef.current;
    // Initial state read
    try {
      const initial = bridge.getState();
      dispatch({ type: 'central/update', state: initial });
    } catch {
      /* getState should never throw, but be defensive */
    }

    const unsubState = bridge.emitter.on('stateChange', (p: BleCentralEvents['stateChange']) => {
      if (!mounted.current) return;
      dispatch({ type: 'central/update', state: p.state });
    });
    const unsubDiscovered = bridge.emitter.on(
      'peripheralDiscovered',
      (p: BleCentralEvents['peripheralDiscovered']) => {
        if (!mounted.current) return;
        dispatch({ type: 'discovered/add', peripheral: p.peripheral });
      },
    );
    const unsubConn = bridge.emitter.on(
      'connectionStateChange',
      (p: BleCentralEvents['connectionStateChange']) => {
        if (!mounted.current) return;
        if (p.peripheralId === connectedIdRef.current) {
          dispatch({ type: 'connected/state', state: p.state });
          if (p.state === 'disconnected') connectedIdRef.current = null;
        }
      },
    );
    const unsubChar = bridge.emitter.on(
      'characteristicValue',
      (p: BleCentralEvents['characteristicValue']) => {
        if (!mounted.current) return;
        dispatch({
          type: 'connected/event',
          characteristicId: p.characteristicId,
          event: {
            kind: 'notify',
            bytesHex: p.bytesHex,
            byteLength: p.byteLength,
            at: p.at,
          },
        });
      },
    );

    subsRef.current = [unsubState, unsubDiscovered, unsubConn, unsubChar];

    intervalRef.current = setInterval(() => {
      if (!mounted.current) return;
      dispatch({ type: 'discovered/prune', now: Date.now() });
    }, PRUNE_TICK_MS);

    return () => {
      mounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Tear down subscriptions on the bridge.
      const subs = Array.from(activeSubs);
      for (const id of subs) {
        bridge.unsubscribeCharacteristic(id).catch(() => undefined);
      }
      activeSubs.clear();
      // Best-effort disconnect.
      const cid = connectedSnapshot();
      if (cid) bridge.disconnect(cid).catch(() => undefined);
      // Best-effort stop scan.
      bridge.stopScan().catch(() => undefined);
      // Detach event listeners.
      for (const off of subsRef.current) {
        try {
          off();
        } catch {
          /* ignore */
        }
      }
      subsRef.current = [];
    };
    // Effect runs once on mount; bridge module identity is stable.
  }, []);

  // Drive bridge.startScan / bridge.stopScan from the desired scan state.
  useEffect(() => {
    if (!mounted.current) return;
    if (state.scan === 'scanning') {
      bridge
        .startScan({ serviceUUIDs: state.scanFilter, allowDuplicates: state.allowDuplicates })
        .catch((e: unknown) => {
          if (!mounted.current) return;
          const c = classifyError(e);
          dispatch({ type: 'error/set', message: c.message });
          dispatch({ type: 'scan/setRequested', requested: false });
        });
    } else {
      bridge.stopScan().catch(() => undefined);
    }
  }, [state.scan, state.scanFilter, state.allowDuplicates]);

  const refreshState = useCallback(async () => {
    try {
      const next = bridge.getState();
      if (mounted.current) dispatch({ type: 'central/update', state: next });
    } catch (e) {
      if (mounted.current) dispatch({ type: 'error/set', message: classifyError(e).message });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const status = await bridge.requestPermission();
      if (mounted.current) dispatch({ type: 'permission/update', status });
    } catch (e) {
      if (mounted.current) dispatch({ type: 'error/set', message: classifyError(e).message });
    }
  }, []);

  const setScan = useCallback((next: boolean) => {
    if (next && stateRef.current.central !== 'poweredOn') {
      const e = new BleNotPoweredOn();
      dispatch({ type: 'error/set', message: e.message });
      return;
    }
    dispatch({ type: 'scan/setRequested', requested: next });
  }, []);

  const setFilter = useCallback((commaSeparated: string) => {
    const parsed = parseFilter(commaSeparated);
    if (!parsed.valid) {
      dispatch({ type: 'error/set', message: 'Invalid UUID in scan filter' });
      return;
    }
    dispatch({ type: 'scan/setFilter', uuids: parsed.uuids });
  }, []);

  const setAllowDuplicates = useCallback((next: boolean) => {
    dispatch({ type: 'scan/setAllowDuplicates', next });
  }, []);

  const connect = useCallback(async (peripheralId: string) => {
    if (stateRef.current.connected != null) {
      const e = new BleOperationFailed(
        'connection-in-progress',
        'A connection is already in progress',
      );
      dispatch({ type: 'error/set', message: e.message });
      return;
    }
    const peripheral = stateRef.current.discovered.find((p) => p.id === peripheralId) ?? null;
    if (!peripheral) {
      dispatch({ type: 'error/set', message: `Unknown peripheralId ${peripheralId}` });
      return;
    }
    connectedIdRef.current = peripheralId;
    dispatch({ type: 'connected/start', peripheral });
    try {
      await bridge.connect(peripheralId);
      if (!mounted.current) return;
      dispatch({ type: 'connected/state', state: 'connected' });
      const services = await bridge.discoverServices(peripheralId);
      if (!mounted.current) return;
      dispatch({ type: 'connected/services', services });
      for (const s of services) {
        const chars = await bridge.discoverCharacteristics(s.id);
        if (!mounted.current) return;
        dispatch({ type: 'connected/characteristics', serviceId: s.id, chars });
      }
    } catch (e) {
      connectedIdRef.current = null;
      if (mounted.current) {
        dispatch({ type: 'error/set', message: classifyError(e).message });
        dispatch({ type: 'connected/clear' });
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    const cid = connectedIdRef.current;
    if (!cid) return;
    try {
      // Tear down subscriptions first.
      for (const id of Array.from(activeSubsRef.current)) {
        await bridge.unsubscribeCharacteristic(id).catch(() => undefined);
      }
      activeSubsRef.current.clear();
      await bridge.disconnect(cid);
    } catch (e) {
      if (mounted.current) dispatch({ type: 'error/set', message: classifyError(e).message });
    } finally {
      connectedIdRef.current = null;
    }
  }, []);

  const read = useCallback(async (characteristicId: string) => {
    try {
      const result = await bridge.readCharacteristic(characteristicId);
      if (!mounted.current) return;
      dispatch({
        type: 'connected/event',
        characteristicId,
        event: {
          kind: 'read',
          bytesHex: result.bytesHex,
          byteLength: result.byteLength,
          at: Date.now(),
        },
      });
    } catch (e) {
      if (mounted.current) {
        dispatch({ type: 'error/set', message: classifyError(e).message });
      }
    }
  }, []);

  const write = useCallback(async (characteristicId: string, bytes: Uint8Array) => {
    try {
      const result = await bridge.writeCharacteristic(characteristicId, bytes, false);
      if (!mounted.current) return;
      let hex = '';
      for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
      dispatch({
        type: 'connected/event',
        characteristicId,
        event: {
          kind: 'write',
          bytesHex: hex,
          byteLength: result.byteLength,
          at: Date.now(),
          message: `wrote ${result.byteLength} bytes`,
        },
      });
    } catch (e) {
      if (mounted.current) {
        dispatch({ type: 'error/set', message: classifyError(e).message });
      }
    }
  }, []);

  const subscribe = useCallback(async (characteristicId: string) => {
    try {
      await bridge.subscribeCharacteristic(characteristicId);
      activeSubsRef.current.add(characteristicId);
      if (mounted.current) {
        dispatch({ type: 'connected/subscribed', characteristicId, isSubscribed: true });
      }
    } catch (e) {
      if (mounted.current) {
        dispatch({ type: 'error/set', message: classifyError(e).message });
      }
    }
  }, []);

  const unsubscribe = useCallback(async (characteristicId: string) => {
    try {
      await bridge.unsubscribeCharacteristic(characteristicId);
      activeSubsRef.current.delete(characteristicId);
      if (mounted.current) {
        dispatch({ type: 'connected/subscribed', characteristicId, isSubscribed: false });
      }
    } catch (e) {
      if (mounted.current) {
        dispatch({ type: 'error/set', message: classifyError(e).message });
      }
    }
  }, []);

  const sortedDiscovered = useMemo(() => selectSorted(state.discovered), [state.discovered]);

  return {
    central: state.central,
    permission: state.permission,
    scan: state.scan,
    scanFilter: state.scanFilter,
    allowDuplicates: state.allowDuplicates,
    discovered: sortedDiscovered,
    connected: state.connected,
    lastError: state.lastError,
    setScan,
    setFilter,
    setAllowDuplicates,
    connect,
    disconnect,
    read,
    write,
    subscribe,
    unsubscribe,
    requestPermission,
    refreshState,
  };
}
