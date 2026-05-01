/**
 * Contract: JS-visible ViewDefinition surface for `ARKitView`.
 *
 * @feature 034-arkit-basics
 * @see specs/034-arkit-basics/spec.md FR-005, FR-007
 * @see specs/034-arkit-basics/data-model.md Entities 4, 5
 * @see specs/034-arkit-basics/research.md §3 (R-C view ownership),
 *      §7 (R-G prop diffing)
 *
 * Implementation files:
 *   - native/ios/arkit/ARKitView.swift                (Swift View definition)
 *   - src/modules/arkit-lab/components/<consumer>     (JS consumer via
 *                                                      requireNativeViewManager)
 *
 * INVARIANTS (asserted by component tests + on-device quickstart):
 *   V1. ViewDefinition name is the literal string 'ARKitView'.
 *   V2. Props (3): planeDetection, peopleOcclusion, lightEstimation.
 *       The `worldMapPersistence` switch is JS-only (data-model.md
 *       Entity 4 invariants).
 *   V3. Events (4): onSessionStateChange, onAnchorAdded,
 *       onAnchorRemoved, onError.
 *   V4. Prop changes apply via `session.run(config, options: [])`
 *       (anchors preserved). Reset uses [.resetTracking,
 *       .removeExistingAnchors] (R-G).
 *   V5. View renders nothing visible off-iOS — non-iOS screen
 *       variants render <IOSOnlyBanner /> in place of this view; the
 *       view manager registration itself is iOS-only.
 *   V6. `onAnchorAdded` fires exactly once per native anchor add
 *       (raycast hit OR programmatic add); `onAnchorRemoved` fires
 *       once per remove (clearAnchors() emits N events).
 */

import type { PlaneDetectionMode, AnchorRecord, SessionState, TrackingState } from './data-model-types';

export const NATIVE_VIEW_NAME = 'ARKitView' as const;

export interface ARKitViewProps {
  readonly planeDetection: PlaneDetectionMode;
  readonly peopleOcclusion: boolean;
  readonly lightEstimation: boolean;

  // Events (RN's onX callback prop convention)
  readonly onSessionStateChange?: (e: { nativeEvent: { state: SessionState; trackingState: TrackingState } }) => void;
  readonly onAnchorAdded?: (e: { nativeEvent: AnchorRecord }) => void;
  readonly onAnchorRemoved?: (e: { nativeEvent: { id: string } }) => void;
  readonly onError?: (e: { nativeEvent: { message: string; code?: string } }) => void;

  // Layout / style
  readonly style?: import('react-native').ViewStyle;
}

/**
 * Pseudo-signature of the Swift Expo Module ViewDefinition:
 *
 *   View(ARKitView.self) {
 *     Prop("planeDetection") { (view, value: String) in ... }
 *     Prop("peopleOcclusion") { (view, value: Bool) in ... }
 *     Prop("lightEstimation") { (view, value: Bool) in ... }
 *     Events("onSessionStateChange", "onAnchorAdded",
 *            "onAnchorRemoved", "onError")
 *   }
 *
 * The view class wraps `RealityKit.ARView`, holds the active
 * `ARSession`, and is the registered owner per R-C.
 */
export type ARKitViewSwiftSurface = {
  readonly props: { readonly planeDetection: string; readonly peopleOcclusion: boolean; readonly lightEstimation: boolean };
  readonly events: readonly ['onSessionStateChange', 'onAnchorAdded', 'onAnchorRemoved', 'onError'];
};
