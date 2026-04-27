export type HapticKind = 'notification' | 'impact' | 'selection';

export type NotificationIntensity = 'success' | 'warning' | 'error';
export type ImpactIntensity = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
export type HapticIntensity = NotificationIntensity | ImpactIntensity;

export type Cell =
  | { readonly kind: 'off' }
  | { readonly kind: 'impact'; readonly intensity: ImpactIntensity }
  | { readonly kind: 'notification'; readonly intensity: NotificationIntensity };

export type Pattern = readonly [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly pattern: Pattern;
  readonly createdAt: string;
}

export type PresetsStoreErrorCode = 'write-failed' | 'empty-pattern';

export class PresetsStoreError extends Error {
  readonly code: PresetsStoreErrorCode;
  constructor(code: PresetsStoreErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'PresetsStoreError';
  }
}
