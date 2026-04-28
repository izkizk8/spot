// Mock state
let mockPermissions = {
  status: 'undetermined' as 'undetermined' | 'denied' | 'granted' | 'provisional' | 'ephemeral',
  granted: false,
  canAskAgain: true,
  expires: 'never' as const,
  ios: {
    allowsAlert: false,
    allowsBadge: false,
    allowsSound: false,
    allowsCriticalAlerts: false,
    allowsDisplayInNotificationCenter: false,
    allowsDisplayOnLockScreen: false,
    allowsDisplayInCarPlay: false,
    allowsPreviews: 0,
    providesAppNotificationSettings: false,
  },
  android: {},
};

let mockScheduledNotifications: Array<{
  identifier: string;
  content: unknown;
  trigger: unknown;
}> = [];

let mockPresentedNotifications: Array<{
  identifier: string;
  date: number;
  request: { identifier: string; content: unknown; trigger: unknown };
}> = [];

let mockLastNotificationResponse: {
  notification: unknown;
  actionIdentifier: string;
  userText?: string;
} | null = null;

type NotificationReceivedListener = (notification: unknown) => void;
type NotificationResponseReceivedListener = (response: unknown) => void;

let receivedListeners: NotificationReceivedListener[] = [];
let responseReceivedListeners: NotificationResponseReceivedListener[] = [];

// Android importance enum
export enum AndroidImportance {
  MIN = 1,
  LOW = 2,
  DEFAULT = 3,
  HIGH = 4,
  MAX = 5,
}

// Mock API implementations
export const getPermissionsAsync = jest.fn(async () => ({
  ...mockPermissions,
}));

export const requestPermissionsAsync = jest.fn(async (_options?: { ios?: unknown }) => {
  // Update permissions based on the request
  if (mockPermissions.status === 'undetermined') {
    mockPermissions.status = 'granted';
    mockPermissions.granted = true;
    mockPermissions.ios.allowsAlert = true;
    mockPermissions.ios.allowsBadge = true;
    mockPermissions.ios.allowsSound = true;
  }
  return { ...mockPermissions };
});

export const setNotificationCategoriesAsync = jest.fn(async (_categories: unknown[]) => {});

export const scheduleNotificationAsync = jest.fn(
  async (request: { content: unknown; trigger: unknown }) => {
    const identifier = `mock-notification-${Date.now()}-${Math.random()}`;
    mockScheduledNotifications.push({ identifier, ...request });
    return identifier;
  },
);

export const cancelScheduledNotificationAsync = jest.fn(async (identifier: string) => {
  mockScheduledNotifications = mockScheduledNotifications.filter(
    (n) => n.identifier !== identifier,
  );
});

export const cancelAllScheduledNotificationsAsync = jest.fn(async () => {
  mockScheduledNotifications = [];
});

export const getAllScheduledNotificationsAsync = jest.fn(async () => {
  return mockScheduledNotifications.map((n) => ({
    identifier: n.identifier,
    content: n.content,
    trigger: n.trigger,
  }));
});

export const getPresentedNotificationsAsync = jest.fn(async () => {
  return mockPresentedNotifications.map((n) => ({
    identifier: n.identifier,
    date: n.date,
    request: n.request,
  }));
});

export const dismissNotificationAsync = jest.fn(async (identifier: string) => {
  mockPresentedNotifications = mockPresentedNotifications.filter(
    (n) => n.identifier !== identifier,
  );
});

export const dismissAllNotificationsAsync = jest.fn(async () => {
  mockPresentedNotifications = [];
});

export const addNotificationReceivedListener = jest.fn((listener: NotificationReceivedListener) => {
  receivedListeners.push(listener);
  return {
    remove: jest.fn(() => {
      receivedListeners = receivedListeners.filter((l) => l !== listener);
    }),
  };
});

export const addNotificationResponseReceivedListener = jest.fn(
  (listener: NotificationResponseReceivedListener) => {
    responseReceivedListeners.push(listener);
    return {
      remove: jest.fn(() => {
        responseReceivedListeners = responseReceivedListeners.filter((l) => l !== listener);
      }),
    };
  },
);

export const getLastNotificationResponseAsync = jest.fn(async () => {
  return mockLastNotificationResponse;
});

export const setNotificationChannelAsync = jest.fn(
  async (_channelId: string, _channel: unknown) => {},
);

// Test helper functions
export function __triggerReceived(notification: unknown) {
  receivedListeners.forEach((listener) => listener(notification));
}

export function __triggerResponse(response: {
  notification: unknown;
  actionIdentifier: string;
  userText?: string;
}) {
  responseReceivedListeners.forEach((listener) => listener(response));
}

export function __setPermissionsMock(state: {
  status?: typeof mockPermissions.status;
  granted?: boolean;
  ios?: Partial<typeof mockPermissions.ios>;
}) {
  if (state.status !== undefined) mockPermissions.status = state.status;
  if (state.granted !== undefined) mockPermissions.granted = state.granted;
  if (state.ios) {
    Object.assign(mockPermissions.ios, state.ios);
  }
}

export function __setScheduledMock(
  list: Array<{ identifier: string; content: unknown; trigger: unknown }>,
) {
  mockScheduledNotifications = [...list];
}

export function __setPresentedMock(
  list: Array<{
    identifier: string;
    date: number;
    request: { identifier: string; content: unknown; trigger: unknown };
  }>,
) {
  mockPresentedNotifications = [...list];
}

export function __setLastResponseMock(response: typeof mockLastNotificationResponse) {
  mockLastNotificationResponse = response;
}

export function __reset() {
  mockPermissions = {
    status: 'undetermined',
    granted: false,
    canAskAgain: true,
    expires: 'never' as const,
    ios: {
      allowsAlert: false,
      allowsBadge: false,
      allowsSound: false,
      allowsCriticalAlerts: false,
      allowsDisplayInNotificationCenter: false,
      allowsDisplayOnLockScreen: false,
      allowsDisplayInCarPlay: false,
      allowsPreviews: 0,
      providesAppNotificationSettings: false,
    },
    android: {},
  };
  mockScheduledNotifications = [];
  mockPresentedNotifications = [];
  mockLastNotificationResponse = null;
  receivedListeners = [];
  responseReceivedListeners = [];
  jest.clearAllMocks();
}
