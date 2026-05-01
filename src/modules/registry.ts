import type { ModuleManifest } from './types';
// Add new modules here ↓ One import line per module.
import realityKitUsdzLab from './062-realitykit-usdz';
import liveActivityDemo from './live-activity-demo';
import liquidGlassPlayground from './liquid-glass-playground';
import hapticsPlayground from './haptics-playground';
import sfSymbolsLab from './sf-symbols-lab';
import swiftuiInterop from './swiftui-interop';
import sensorsPlayground from './sensors-playground';
import swiftChartsLab from './swift-charts-lab';
import appIntentsLab from './app-intents-lab';
import widgetsLab from './widgets-lab';
import screentimeLab from './screentime-lab';
import coremlLab from './coreml-lab';
import cameraVision from './camera-vision';
import speechRecognitionLab from './speech-recognition-lab';
import speechSynthesisLab from './speech-synthesis-lab';
import audioLab from './audio-lab';
import signInWithApple from './sign-in-with-apple';
import localAuthLab from './local-auth-lab';
import keychainLab from './keychain-lab';
import mapkitLab from './mapkit-lab';
import coreLocationLab from './core-location-lab';
import notificationsLab from './notifications-lab';
import lockWidgetsLab from './lock-widgets-lab';
import standbyLab from './standby-lab';
import focusFiltersLab from './focus-filters-lab';
import backgroundTasksLab from './background-tasks-lab';
import spotlightLab from './spotlight-lab';
import documentsLab from './documents-lab';
import shareSheetLab from './share-sheet-lab';
import arkitLab from './arkit-lab';
import bluetoothLab from './bluetooth-lab';
import passkitLab from './passkit-lab';
import eventkitLab from './eventkit-lab';
import contactsLab from './contacts-lab';
import quickActionsLab from './quick-actions-lab';
import handoffLab from './handoff-lab';
import universalLinksLab from './universal-links-lab';
import appClipsLab from './app-clips-lab';
import healthkitLab from './healthkit-lab';
import homekitLab from './homekit-lab';
import carplayLab from './carplay-lab';
import weatherkitLab from './weatherkit-lab';
import shareplayLab from './shareplay-lab';
import lidarRoomplanLab from './lidar-roomplan-lab';
import applePayLab from './apple-pay-lab';
import storekitLab from './storekit-lab';
import tapToPayLab from './tap-to-pay-lab';
import coredataCloudKitLab from './coredata-cloudkit-lab';
import swiftdataLab from './swiftdata-lab';
import photokitLab from './photokit-lab';
import visualLookUpLab from './visual-look-up-lab';
import coreImageLab from './064-core-image';
/**
 * The source-order list of module manifests rendered in the Modules tab
 * and routable at `/modules/[id]`.
 *
 * # Adding a new module (≤ 10 minutes — SC-006)
 *
 * 1. Create `src/modules/<your-id>/index.ts` and export a default
 *    `ModuleManifest` (see `src/modules/types.ts`).
 * 2. Add ONE import line above and ONE entry below — that's the entire
 *    contract. Nothing else in the shell needs to change.
 *
 * Invariants (enforced by `test/unit/modules/registry.test.ts` +
 * `manifest.test.ts`):
 *   - `id` matches `/^[a-z][a-z0-9-]*$/`
 *   - `MODULES.map(m => m.id)` has no duplicates
 *   - empty array is valid (Modules tab renders an empty state)
 *   - source-order is the rendered order
 */
export const MODULES: readonly ModuleManifest[] = [
  liquidGlassPlayground,
  liveActivityDemo,
  hapticsPlayground,
  sfSymbolsLab,
  swiftuiInterop,
  sensorsPlayground,
  swiftChartsLab,
  appIntentsLab,
  widgetsLab,
  screentimeLab,
  coremlLab,
  cameraVision,
  speechRecognitionLab,
  speechSynthesisLab,
  audioLab,
  signInWithApple,
  localAuthLab,
  keychainLab,
  mapkitLab,
  coreLocationLab,
  notificationsLab,
  lockWidgetsLab,
  standbyLab,
  focusFiltersLab,
  backgroundTasksLab,
  spotlightLab,
  documentsLab,
  shareSheetLab,
  arkitLab,
  bluetoothLab,
  passkitLab,
  eventkitLab,
  contactsLab,
  quickActionsLab,
  handoffLab,
  universalLinksLab,
  appClipsLab,
  healthkitLab,
  homekitLab,
  carplayLab,
  weatherkitLab,
  shareplayLab,
  lidarRoomplanLab,
  applePayLab,
  storekitLab,
  tapToPayLab,
  coredataCloudKitLab,
  swiftdataLab,
  photokitLab,
  visualLookUpLab,
  realityKitUsdzLab,
  coreImageLab,
  // ↑ Append new manifests here in the order they should appear.
];
