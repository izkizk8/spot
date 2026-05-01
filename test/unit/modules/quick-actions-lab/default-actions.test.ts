/**
 * @jest-environment node
 */

import {
  DEFAULT_QUICK_ACTIONS,
  type QuickActionDefinition,
} from '@/modules/quick-actions-lab/default-actions';

describe('DEFAULT_QUICK_ACTIONS', () => {
  it('has exactly 4 entries', () => {
    expect(DEFAULT_QUICK_ACTIONS).toHaveLength(4);
  });

  it('is ordered: open-liquid-glass, open-sensors, open-audio-lab, add-mood-happy', () => {
    expect(DEFAULT_QUICK_ACTIONS.map((a) => a.type)).toEqual([
      'open-liquid-glass',
      'open-sensors',
      'open-audio-lab',
      'add-mood-happy',
    ]);
  });

  it('every entry conforms to QuickActionDefinition shape', () => {
    DEFAULT_QUICK_ACTIONS.forEach((entry: QuickActionDefinition) => {
      expect(entry.type).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.iconName.trim().length).toBeGreaterThan(0);
      expect(typeof entry.userInfo.route).toBe('string');
      expect(entry.userInfo.route.length).toBeGreaterThan(0);
    });
  });

  it('add-mood-happy carries mood=happy and the app-intents-lab route', () => {
    const mood = DEFAULT_QUICK_ACTIONS.find((a) => a.type === 'add-mood-happy');
    expect(mood).toBeDefined();
    expect(mood?.userInfo.mood).toBe('happy');
    expect(mood?.userInfo.route).toBe('/modules/app-intents-lab');
  });

  it('uses the documented SF Symbols', () => {
    const icons = DEFAULT_QUICK_ACTIONS.map((a) => a.iconName);
    expect(icons).toEqual(['drop.fill', 'gauge', 'mic.fill', 'face.smiling']);
  });
});
