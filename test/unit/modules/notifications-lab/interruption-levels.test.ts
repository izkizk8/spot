import {
  DEFAULT_INTERRUPTION_LEVEL,
  INTERRUPTION_LEVELS,
} from '@/modules/notifications-lab/interruption-levels';

describe('interruption-levels', () => {
  it('has exactly 4 entries in documented order', () => {
    expect(INTERRUPTION_LEVELS).toHaveLength(4);
    const levels = INTERRUPTION_LEVELS.map((l) => l.level);
    expect(levels).toEqual(['passive', 'active', 'time-sensitive', 'critical']);
  });

  it('passive and active do not require entitlement', () => {
    const passive = INTERRUPTION_LEVELS.find((l) => l.level === 'passive');
    expect(passive?.requiresEntitlement).toBe(false);
    expect(passive?.fallbackLevel).toBe('passive');

    const active = INTERRUPTION_LEVELS.find((l) => l.level === 'active');
    expect(active?.requiresEntitlement).toBe(false);
    expect(active?.fallbackLevel).toBe('active');
  });

  it('time-sensitive and critical require entitlement', () => {
    const timeSensitive = INTERRUPTION_LEVELS.find((l) => l.level === 'time-sensitive');
    expect(timeSensitive?.requiresEntitlement).toBe(true);
    expect(timeSensitive?.fallbackLevel).toBe('active');

    const critical = INTERRUPTION_LEVELS.find((l) => l.level === 'critical');
    expect(critical?.requiresEntitlement).toBe(true);
    expect(critical?.fallbackLevel).toBe('active');
  });

  it('time-sensitive copy mentions time-sensitive entitlement', () => {
    const timeSensitive = INTERRUPTION_LEVELS.find((l) => l.level === 'time-sensitive');
    expect(timeSensitive?.copy).toMatch(/time-sensitive/i);
  });

  it('critical copy mentions Critical Alerts', () => {
    const critical = INTERRUPTION_LEVELS.find((l) => l.level === 'critical');
    expect(critical?.copy).toMatch(/Critical Alerts/i);
  });

  it('DEFAULT_INTERRUPTION_LEVEL is active', () => {
    expect(DEFAULT_INTERRUPTION_LEVEL).toBe('active');
  });
});
