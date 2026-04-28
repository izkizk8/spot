/**
 * Speech Recognition Lab — Web screen (US5, T063).
 *
 * Feature-detects `webkitSpeechRecognition`:
 *   - PRESENT → renders the full iOS screen (which automatically uses the
 *     web bridge via Metro's `.web.ts` resolution). The On-device segment
 *     is disabled implicitly because the web bridge does not expose a
 *     `supportsOnDeviceRecognition` probe (FR-023).
 *   - ABSENT → renders the same banner-only scaffold as the Android screen.
 */

import React from 'react';

import SpeechRecognitionLabScreen from './screen';
import OfflineSpeechRecognitionLabScreen from './screen.android';

function detectWebkit(): boolean {
  return typeof (globalThis as any).webkitSpeechRecognition === 'function';
}

export default function SpeechRecognitionLabWebScreen() {
  // Evaluate at render time so tests can toggle the global between renders.
  const hasWebkit = detectWebkit();
  return hasWebkit ? (
    <SpeechRecognitionLabScreen />
  ) : (
    <OfflineSpeechRecognitionLabScreen />
  );
}
