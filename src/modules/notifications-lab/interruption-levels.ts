// Interruption level metadata for iOS notifications
export type InterruptionLevel = 'passive' | 'active' | 'time-sensitive' | 'critical';

export interface InterruptionLevelMeta {
  level: InterruptionLevel;
  label: string;
  requiresEntitlement: boolean;
  fallbackLevel: InterruptionLevel;
  copy: string;
}

export const INTERRUPTION_LEVELS: readonly InterruptionLevelMeta[] = [
  {
    level: 'passive',
    label: 'Passive',
    requiresEntitlement: false,
    fallbackLevel: 'passive',
    copy: 'Delivered quietly without sound or banner.',
  },
  {
    level: 'active',
    label: 'Active',
    requiresEntitlement: false,
    fallbackLevel: 'active',
    copy: 'Standard delivery with sound and banner.',
  },
  {
    level: 'time-sensitive',
    label: 'Time-Sensitive',
    requiresEntitlement: true,
    fallbackLevel: 'active',
    copy: 'Requires the Time-Sensitive Notifications entitlement. Falls back to Active if not authorized.',
  },
  {
    level: 'critical',
    label: 'Critical',
    requiresEntitlement: true,
    fallbackLevel: 'active',
    copy: 'Requires the Critical Alerts entitlement (special approval from Apple). Falls back to Active if not authorized.',
  },
] as const;

export const DEFAULT_INTERRUPTION_LEVEL: InterruptionLevel = 'active';
