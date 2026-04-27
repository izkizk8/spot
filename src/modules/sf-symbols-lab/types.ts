import type { ColorValue } from 'react-native';

/** The fixed set of 12 SF Symbols this module exposes (FR-005). */
export interface CuratedSymbol {
  /** SF Symbol system name as accepted by expo-symbols' `SymbolView.name`. */
  readonly name: string;
  /** Short human-readable label used in pickers and the plain-text fallback. */
  readonly displayLabel: string;
}

/** The seven effect identifiers exposed by this module (FR-009). */
export type EffectId =
  | 'bounce'
  | 'pulse'
  | 'scale'
  | 'variable-color'
  | 'replace'
  | 'appear'
  | 'disappear';

/** Per-effect metadata describing whether the Speed and Repeat selectors are meaningful. */
export interface EffectMetadata {
  readonly id: EffectId;
  readonly displayLabel: string;
  readonly respondsToSpeed: boolean;
  readonly respondsToRepeat: boolean;
  readonly requiresSecondarySymbol: boolean;
}

/** Speed multiplier for symbol effects. */
export type Speed = 'slow' | 'normal' | 'fast';

/** Repeat mode for symbol effects. */
export type Repeat = 'once' | 'thrice' | 'indefinite';

/** The four tint swatches exposed by TintPicker, sourced from the project theme. */
export type TintToken = 'text' | 'textSecondary' | 'tintA' | 'tintB';

/** The transient, in-memory configuration applied on the next Play Effect tap. */
export interface PlaybackConfig {
  readonly symbol: CuratedSymbol; // FR-005, FR-008
  readonly effect: EffectMetadata; // FR-009, FR-011
  readonly speed: Speed; // FR-013
  readonly repeat: Repeat; // FR-014
  readonly tint: TintToken; // FR-022
  readonly secondarySymbol?: CuratedSymbol; // honoured iff effect.id === 'replace'
}

/** Props for the AnimatedSymbol wrapper component. */
export interface AnimatedSymbolProps {
  /** Primary SF Symbol system name. */
  name: string;
  /** Secondary SF Symbol name. Honoured ONLY when effect === 'replace'. */
  secondaryName?: string;
  /** The effect to play on the next playToken bump. */
  effect: EffectId;
  /** Maps to expo-symbols' AnimationSpec.speed (UIKit speed multiplier). */
  speed: Speed;
  /** Maps to AnimationSpec.repeating + AnimationSpec.repeatCount. */
  repeat: Repeat;
  /** Tint applied to the symbol on all platforms. */
  tintColor: ColorValue;
  /** Render size in points. */
  size: number;
  /**
   * Bumped by parent on every Play Effect press to retrigger the effect.
   * 0 = no effect armed (used to stop an Indefinite repeat — see R4).
   */
  playToken: number;
}
