/**
 * SharePlay Bridge — Android variant (feature 047). All async
 * methods reject with `SharePlayNotSupported`; `isAvailable()`
 * returns false. MUST NOT import the iOS bridge file.
 */

import {
  type ActivityConfig,
  INITIAL_SESSION_STATE,
  type SessionState,
  type SessionStateListener,
  SharePlayNotSupported,
} from './shareplay.types';

export { SharePlayNotSupported };

const ERR = (): SharePlayNotSupported =>
  new SharePlayNotSupported('SharePlay is not available on Android');

export function isAvailable(): boolean {
  return false;
}

export function getState(): SessionState {
  return INITIAL_SESSION_STATE;
}

export function startActivity(_config: ActivityConfig): Promise<void> {
  return Promise.reject(ERR());
}

export function endActivity(): Promise<void> {
  return Promise.reject(ERR());
}

export function sendCounter(_value: number): Promise<void> {
  return Promise.reject(ERR());
}

export function subscribe(_listener: SessionStateListener): () => void {
  return () => {};
}

export const shareplay = {
  isAvailable,
  getState,
  startActivity,
  endActivity,
  sendCounter,
  subscribe,
};

export default shareplay;
