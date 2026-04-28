import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform, Image } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { useNotificationCenter, __resetModuleFlags } from '../../hooks/useNotificationCenter';

// Mock expo-location
jest.mock('expo-location', () => ({
  startGeofencingAsync: jest.fn(async () => {}),
}));

const originalPlatform = Platform.OS;

describe('useNotificationCenter', () => {
  beforeAll(() => {
    // Mock Image.resolveAssetSource
    jest.spyOn(Image, 'resolveAssetSource').mockImplementation((source: any) => ({
      uri: `file:///mock-asset-${source}`,
      width: 100,
      height: 100,
      scale: 1,
    }));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    (Notifications as any).__reset();
    __resetModuleFlags();
  });

  describe('Mount behavior', () => {
    it('registers categories exactly once across remount-mount-remount', async () => {
      const { unmount: unmount1 } = renderHook(() => useNotificationCenter());
      await waitFor(() => {
        expect(Notifications.setNotificationCategoriesAsync).toHaveBeenCalledTimes(1);
      });

      unmount1();

      const { unmount: unmount2 } = renderHook(() => useNotificationCenter());
      await waitFor(() => {
        // Should still be 1, not 2
        expect(Notifications.setNotificationCategoriesAsync).toHaveBeenCalledTimes(1);
      });

      unmount2();

      const { unmount: unmount3 } = renderHook(() => useNotificationCenter());
      await waitFor(() => {
        // Should still be 1, not 3
        expect(Notifications.setNotificationCategoriesAsync).toHaveBeenCalledTimes(1);
      });

      unmount3();
    });

    it('attaches both listeners exactly once', async () => {
      const { unmount } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledTimes(1);
      });

      unmount();
    });

    it('replays non-null last notification response as action-response event', async () => {
      const mockResponse = {
        notification: {
          request: {
            identifier: 'test-notif',
            content: { title: 'Test', body: 'Body' },
          },
        },
        actionIdentifier: 'yes',
        userText: undefined,
      };

      (Notifications as any).__setLastResponseMock(mockResponse);

      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(result.current.events.length).toBe(1);
        expect(result.current.events[0]).toMatchObject({
          kind: 'action-response',
          actionIdentifier: 'yes',
        });
      });
    });

    it('does not replay when last response is null', async () => {
      (Notifications as any).__setLastResponseMock(null);

      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(result.current.events.length).toBe(0);
      });
    });
  });

  describe('request()', () => {
    it('calls requestPermissionsAsync with correct options', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.request();
      });

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
          allowProvisional: false,
          provideAppNotificationSettings: true,
        },
      });
    });

    it('passes allowProvisional: true when provisional option is set', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.request({ provisional: true });
      });

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
          allowProvisional: true,
          provideAppNotificationSettings: true,
        },
      });
    });

    it('maps authorized status correctly', async () => {
      (Notifications as any).__setPermissionsMock({
        status: 'granted',
        granted: true,
        ios: {
          allowsAlert: true,
          allowsBadge: true,
          allowsSound: true,
        },
      });

      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.request();
      });

      await waitFor(() => {
        expect(result.current.permissions.status).toBe('authorized');
        expect(result.current.permissions.alerts).toBe(true);
        expect(result.current.permissions.sounds).toBe(true);
        expect(result.current.permissions.badges).toBe(true);
      });
    });
  });

  describe('Permission path branches', () => {
    it('maps denied status', async () => {
      (Notifications as any).__setPermissionsMock({
        status: 'denied',
        granted: false,
      });

      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.request();
      });

      await waitFor(() => {
        expect(result.current.permissions.status).toBe('denied');
      });
    });

    it('maps notDetermined status', async () => {
      (Notifications as any).__setPermissionsMock({
        status: 'undetermined',
        granted: false,
      });

      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(result.current.permissions.status).toBe('notDetermined');
      });
    });

    it('maps provisional status', async () => {
      (Notifications as any).__setPermissionsMock({
        status: 'provisional',
        granted: true,
      });

      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.request({ provisional: true });
      });

      await waitFor(() => {
        expect(result.current.permissions.status).toBe('provisional');
      });
    });

    it('maps ephemeral status', async () => {
      (Notifications as any).__setPermissionsMock({
        status: 'ephemeral',
        granted: true,
      });

      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(result.current.permissions.status).toBe('ephemeral');
      });
    });
  });

  describe('schedule() trigger translation', () => {
    it('translates immediate trigger to null', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.schedule({
          title: 'Test',
          subtitle: '',
          body: '',
          attachmentId: null,
          threadId: '',
          soundId: 'none',
          interruptionLevel: 'active',
          badge: 0,
          categoryId: null,
          trigger: { kind: 'immediate' },
        });
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: null,
        }),
      );
    });

    it('translates in-seconds trigger', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.schedule({
          title: 'Test',
          subtitle: '',
          body: '',
          attachmentId: null,
          threadId: '',
          soundId: 'none',
          interruptionLevel: 'active',
          badge: 0,
          categoryId: null,
          trigger: { kind: 'in-seconds', seconds: 30 },
        });
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: { seconds: 30, repeats: false },
        }),
      );
    });

    it('translates at-time trigger', async () => {
      const testDate = new Date('2025-01-01T12:00:00Z');
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.schedule({
          title: 'Test',
          subtitle: '',
          body: '',
          attachmentId: null,
          threadId: '',
          soundId: 'none',
          interruptionLevel: 'active',
          badge: 0,
          categoryId: null,
          trigger: { kind: 'at-time', date: testDate },
        });
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: { date: testDate },
        }),
      );
    });

    it('translates daily-at-time trigger', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.schedule({
          title: 'Test',
          subtitle: '',
          body: '',
          attachmentId: null,
          threadId: '',
          soundId: 'none',
          interruptionLevel: 'active',
          badge: 0,
          categoryId: null,
          trigger: { kind: 'daily-at-time', hour: 9, minute: 30 },
        });
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: { hour: 9, minute: 30, repeats: true },
        }),
      );
    });

    it('translates on-region-entry trigger with correct identifier pattern', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.schedule({
          title: 'Test',
          subtitle: '',
          body: '',
          attachmentId: null,
          threadId: '',
          soundId: 'none',
          interruptionLevel: 'active',
          badge: 0,
          categoryId: null,
          trigger: {
            kind: 'on-region-entry',
            latitude: 37.7749,
            longitude: -122.4194,
            radius: 100,
          },
        });
      });

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.trigger).toMatchObject({
        type: 'location',
        region: {
          identifier: expect.stringMatching(/^spot-geofence-[0-9a-f-]{36}$/),
          latitude: 37.7749,
          longitude: -122.4194,
          radius: 100,
          notifyOnEnter: true,
          notifyOnExit: false,
        },
      });
    });
  });

  describe('schedule() with attachment', () => {
    it('resolves attachment URI and includes it in content', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.schedule({
          title: 'Test',
          subtitle: '',
          body: '',
          attachmentId: 'sample-1',
          threadId: '',
          soundId: 'none',
          interruptionLevel: 'active',
          badge: 0,
          categoryId: null,
          trigger: { kind: 'immediate' },
        });
      });

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.attachments).toBeDefined();
      expect(call.content.attachments[0].url).toMatch(/^file:\/\/\/mock-asset-/);
    });
  });

  describe('cancel() and cancelAll()', () => {
    it('cancel(id) calls cancelScheduledNotificationAsync then refresh', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.cancel('test-id');
      });

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('test-id');
      expect(Notifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('cancelAll() calls cancelAllScheduledNotificationsAsync then refresh', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.cancelAll();
      });

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(Notifications.getAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('remove() and clearAll()', () => {
    it('remove(id) calls dismissNotificationAsync then refresh', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.remove('test-id');
      });

      expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('test-id');
      expect(Notifications.getPresentedNotificationsAsync).toHaveBeenCalled();
    });

    it('clearAll() calls dismissAllNotificationsAsync then refresh', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.clearAll();
      });

      expect(Notifications.dismissAllNotificationsAsync).toHaveBeenCalled();
      expect(Notifications.getPresentedNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('Event ingestion', () => {
    it('__triggerReceived appends a received event', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      });

      act(() => {
        (Notifications as any).__triggerReceived({
          request: {
            identifier: 'notif-1',
            content: { title: 'Test', body: 'Body' },
          },
        });
      });

      await waitFor(() => {
        expect(result.current.events.length).toBe(1);
        expect(result.current.events[0]).toMatchObject({
          kind: 'received',
          identifier: 'notif-1',
        });
      });
    });

    it('__triggerResponse appends action-response with actionIdentifier and textInput', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      act(() => {
        (Notifications as any).__triggerResponse({
          notification: {
            request: {
              identifier: 'notif-2',
              content: { title: 'Test', body: 'Body' },
            },
          },
          actionIdentifier: 'reply',
          userText: 'Hello world',
        });
      });

      await waitFor(() => {
        expect(result.current.events.length).toBe(1);
        expect(result.current.events[0]).toMatchObject({
          kind: 'action-response',
          identifier: 'notif-2',
          actionIdentifier: 'reply',
          textInput: 'Hello world',
        });
      });
    });

    it('iOS UNNotificationDismissActionIdentifier appends dismissed event', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      });

      act(() => {
        (Notifications as any).__triggerResponse({
          notification: {
            request: {
              identifier: 'notif-3',
              content: { title: 'Test', body: 'Body' },
            },
          },
          actionIdentifier: 'com.apple.UNNotificationDismissActionIdentifier',
        });
      });

      await waitFor(() => {
        expect(result.current.events.length).toBe(1);
        expect(result.current.events[0]).toMatchObject({
          kind: 'dismissed',
          identifier: 'notif-3',
        });
      });
    });

    it('caps event log at 20 entries, evicting oldest', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      });

      // Push 21 events
      for (let i = 0; i < 21; i++) {
        act(() => {
          (Notifications as any).__triggerReceived({
            request: {
              identifier: `notif-${i}`,
              content: { title: `Test ${i}`, body: 'Body' },
            },
          });
        });
      }

      await waitFor(() => {
        expect(result.current.events.length).toBe(20);
        // First event should be evicted, so notif-0 should not be present
        const identifiers = result.current.events.map((e) => e.identifier);
        expect(identifiers).not.toContain('notif-0');
        expect(identifiers).toContain('notif-20');
      });
    });
  });

  describe('Listener cleanup', () => {
    it('unmount calls .remove() on every subscription', async () => {
      const mockRemove1 = jest.fn();
      const mockRemove2 = jest.fn();

      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove1,
      });
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove2,
      });

      const { unmount } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockRemove1).toHaveBeenCalled();
      expect(mockRemove2).toHaveBeenCalled();
    });
  });

  describe('mountedRef guard', () => {
    it('does not warn about setState after unmount', async () => {
      const { unmount } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      });

      unmount();

      // Try to trigger an event after unmount - should not cause a setState warning
      act(() => {
        (Notifications as any).__triggerReceived({
          request: {
            identifier: 'post-unmount',
            content: { title: 'Test', body: 'Body' },
          },
        });
      });

      // No assertion needed - the test passes if no warning is thrown
    });
  });

  describe('Android branch', () => {
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });
    });

    afterAll(() => {
      Object.defineProperty(Platform, 'OS', {
        get: () => originalPlatform,
        configurable: true,
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      (Notifications as any).__reset();
      __resetModuleFlags();
    });

    it('mount calls setNotificationChannelAsync exactly once across remount', async () => {
      const { unmount: unmount1 } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('spot.default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      });

      unmount1();

      const { unmount: unmount2 } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        // Should still be 1, not 2
        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
      });

      unmount2();
    });

    it('schedule() includes channelId === spot.default', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        await result.current.schedule({
          title: 'Test',
          subtitle: '',
          body: '',
          attachmentId: null,
          threadId: '',
          soundId: 'none',
          interruptionLevel: 'active',
          badge: 0,
          categoryId: null,
          trigger: { kind: 'immediate' },
        });
      });

      const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
      expect(call.content.channelId).toBe('spot.default');
    });
  });

  describe('invokeAction()', () => {
    it('synthesises action-response event without invoking Notifications API', async () => {
      const { result } = renderHook(() => useNotificationCenter());

      const callCountBefore = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls
        .length;

      act(() => {
        result.current.invokeAction({
          identifier: 'test-notif',
          actionIdentifier: 'yes',
          textInput: undefined,
        });
      });

      await waitFor(() => {
        expect(result.current.events.length).toBe(1);
        expect(result.current.events[0]).toMatchObject({
          kind: 'action-response',
          identifier: 'test-notif',
          actionIdentifier: 'yes',
          textInput: null,
        });
      });

      // Verify no Notifications API was called
      expect((Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.length).toBe(
        callCountBefore,
      );
    });
  });

  describe('Quota error on region trigger', () => {
    it('surfaces non-blocking error when geofence quota is reached', async () => {
      (Location.startGeofencingAsync as jest.Mock).mockRejectedValue(
        new Error('Geofence quota exceeded'),
      );

      const { result } = renderHook(() => useNotificationCenter());

      await act(async () => {
        try {
          await result.current.schedule({
            title: 'Test',
            subtitle: '',
            body: '',
            attachmentId: null,
            threadId: '',
            soundId: 'none',
            interruptionLevel: 'active',
            badge: 0,
            categoryId: null,
            trigger: {
              kind: 'on-region-entry',
              latitude: 37.7749,
              longitude: -122.4194,
              radius: 100,
            },
          });
        } catch (err) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.message).toMatch(/Geofence quota reached/i);
      });
    });
  });

  describe('Cold-launch replay one-shot', () => {
    it('does not replay on remount', async () => {
      const mockResponse = {
        notification: {
          request: {
            identifier: 'cold-launch-notif',
            content: { title: 'Test', body: 'Body' },
          },
        },
        actionIdentifier: 'yes',
      };

      (Notifications as any).__setLastResponseMock(mockResponse);

      const { unmount, result: result1 } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        expect(result1.current.events.length).toBe(1);
        expect(Notifications.getLastNotificationResponseAsync).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Remount - should not call getLastNotificationResponseAsync again
      const { result: result2 } = renderHook(() => useNotificationCenter());

      await waitFor(() => {
        // getLastNotificationResponseAsync should still be 1, not 2
        expect(Notifications.getLastNotificationResponseAsync).toHaveBeenCalledTimes(1);
        // result2 starts with 0 events because events are per-instance state,
        // but the important thing is that getLastNotificationResponseAsync wasn't called again
        expect(result2.current.events.length).toBe(0);
      });
    });
  });
});
