import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Platform } from 'react-native';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
    Soft: 'Soft',
    Rigid: 'Rigid',
  },
}));

import * as Haptics from 'expo-haptics';
import { play } from '@/modules/haptics-playground/haptic-driver';

const setOS = (os: string) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
};

describe('haptic-driver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOS('ios');
  });

  describe('on native (ios)', () => {
    it.each(['success', 'warning', 'error'] as const)(
      'routes notification:%s to notificationAsync',
      async (intensity) => {
        await play('notification', intensity);
        expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
        const expected = intensity.charAt(0).toUpperCase() + intensity.slice(1);
        expect(Haptics.notificationAsync).toHaveBeenCalledWith(expected);
      },
    );

    it.each(['light', 'medium', 'heavy', 'soft', 'rigid'] as const)(
      'routes impact:%s to impactAsync',
      async (intensity) => {
        await play('impact', intensity);
        expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
        const expected = intensity.charAt(0).toUpperCase() + intensity.slice(1);
        expect(Haptics.impactAsync).toHaveBeenCalledWith(expected);
      },
    );

    it('routes selection to selectionAsync', async () => {
      await play('selection');
      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    });

    it('never throws when underlying API rejects', async () => {
      (
        Haptics.impactAsync as jest.MockedFunction<typeof Haptics.impactAsync>
      ).mockRejectedValueOnce(new Error('boom'));
      await expect(play('impact', 'medium')).resolves.toBeUndefined();
    });
  });

  describe('on web', () => {
    beforeEach(() => setOS('web'));

    it('does not call any expo-haptics symbol', async () => {
      await play('notification', 'success');
      await play('impact', 'medium');
      await play('selection');
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });
  });
});
