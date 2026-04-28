/**
 * Audio Lab — Web screen (T058).
 *
 * Same composition as the iOS `screen.tsx`. Web-specific differences are all
 * handled deeper in the module:
 *   - `useAudioRecorder` switches to the browser `MediaRecorder` path under
 *     `Platform.OS === 'web'` and emits blob URIs (R-005).
 *   - `useAudioPlayer` plays back the same blob/`http(s)` URIs through the
 *     `expo-audio` web backend.
 *   - `recordings-store` persists metadata in `localStorage` (no FileSystem).
 *   - `audio-session.applyCategory` short-circuits to a resolved no-op on
 *     web (R-007 — `setAudioModeAsync` is a no-op in `expo-audio`'s web
 *     backend; we skip it to keep the surface clean).
 *   - `AudioSessionCard` swaps the Apply button for an informational tooltip
 *     when `Platform.OS === 'web'` (FR-045), so `onApply` is never invoked
 *     and `setAudioModeAsync` is never reached from the web variant.
 *
 * Web users can still record, play, delete, share-fallback, and pick a
 * quality preset — the entire user-facing surface stays parity-equivalent.
 */

export { default } from './screen';
export type { AudioLabScreenProps } from './screen';
