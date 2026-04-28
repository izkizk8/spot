/**
 * Audio Lab — Android screen (T057).
 *
 * Same composition as the iOS `screen.tsx`. All platform-specific behavior
 * lives one layer down:
 *   - `useAudioRecorder` / `useAudioPlayer` switch on `Platform.OS` to pick
 *     the native vs Web `MediaRecorder` paths.
 *   - `recordings-store` uses platform-aware persistence (FileSystem on
 *     native, blob URLs on Web).
 *   - `audio-session.applyCategory` no-ops on Web; on iOS/Android it forwards
 *     to `setAudioModeAsync`.
 *   - `AudioSessionCard` keeps the Apply button on iOS/Android and degrades
 *     to an info tooltip on Web.
 *
 * Re-exporting from `./screen` keeps the platform-file split required by
 * Metro's resolver (constitution: "Platform File Splitting") with zero risk
 * of drift between the two surfaces.
 */

export { default } from './screen';
export type { AudioLabScreenProps } from './screen';
