/**
 * CarPlay bridge — shared type surface (feature 045).
 *
 * Types referenced by all four `src/native/carplay*.ts` siblings and
 * by the carplay-lab module. Pure module: no React, no native imports.
 *
 * CarPlay is a heavily restricted Apple framework. Apps may only ship
 * a CarPlay scene if Apple has issued the matching entitlement
 * (Audio / Communication / Driving Task / EV / Parking / Quick Food).
 * The bridge therefore documents *intent* and throws fast-fail errors
 * on every host except an entitled iOS build.
 */

export const NATIVE_MODULE_NAME = 'CarPlayBridge' as const;

/** Stable identifier for one of the five CarPlay templates. */
export type CarPlayTemplateKind = 'list' | 'grid' | 'information' | 'map' | 'now-playing';

/** App category Apple grants the CarPlay entitlement under. */
export type CarPlayCategory =
  | 'audio'
  | 'communication'
  | 'driving-task'
  | 'ev'
  | 'parking'
  | 'quick-food';

/** Coarse runtime status reported by the bridge. */
export type CarPlayStatus =
  | 'unsupported' // non-iOS host
  | 'not-entitled' // iOS but missing entitlement / native module
  | 'available'; // entitled, native module present

/**
 * UISceneConfiguration role Apple requires for CarPlay scenes. The
 * lab renders this as the literal Info.plist string so a developer
 * can copy it verbatim.
 */
export const CARPLAY_SCENE_ROLE = 'CPTemplateApplicationSceneSessionRoleApplication' as const;

export type CarPlaySceneRole = typeof CARPLAY_SCENE_ROLE;

export interface CarPlaySceneConfiguration {
  readonly role: CarPlaySceneRole;
  readonly delegateClassName: string;
  readonly sceneClassName: string;
  readonly configurationName: string;
}

export interface CarPlayBridge {
  isAvailable(): boolean;
  getStatus(): Promise<CarPlayStatus>;
  /**
   * Activates a CarPlay scene with the given template kind. The
   * scaffold implementation always rejects with `CarPlayNotEntitled`
   * unless Apple has issued the matching entitlement and a real
   * `CPTemplateApplicationScene` is connected.
   */
  presentTemplate(kind: CarPlayTemplateKind): Promise<void>;
}

/** Thrown when CarPlay cannot run on the current host (Android / Web). */
export class CarPlayNotSupported extends Error {
  public readonly code = 'CARPLAY_NOT_SUPPORTED' as const;

  constructor(message = 'CarPlay is not available on this platform') {
    super(message);
    this.name = 'CarPlayNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CarPlayNotSupported);
    }
  }
}

/**
 * Thrown on iOS when the app is missing the Apple-issued CarPlay
 * entitlement. This is the *expected* failure mode for the
 * educational scaffold: the lab UI explains the restriction and
 * links to the developer portal request page.
 */
export class CarPlayNotEntitled extends Error {
  public readonly code = 'CARPLAY_NOT_ENTITLED' as const;

  constructor(message = 'CarPlay entitlement is not active for this build') {
    super(message);
    this.name = 'CarPlayNotEntitled';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CarPlayNotEntitled);
    }
  }
}
