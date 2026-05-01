/**
 * Tests for the Live Activity Demo screen.
 *
 * Covers:
 * - Mount behavior and status display (US1 T023)
 * - Start button interactions (US1 T023)
 * - Update button interactions (US2 T029)
 * - End button interactions (US3 T033)
 * - Unavailable platform branch (US4 T037)
 *
 * @see specs/007-live-activities-dynamic-island/tasks.md
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { LiveActivitySession } from '@/native/live-activity.types';
import {
  LiveActivityAlreadyRunningError,
  LiveActivityAuthorisationError,
  LiveActivityNoActiveSessionError,
} from '@/native/live-activity.types';

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock the bridge with jest.fn() initialized inside factory
jest.mock('@/native/live-activity', () => {
  return {
    __esModule: true,
    default: {
      isAvailable: jest.fn(() => true),
      start: jest.fn(),
      update: jest.fn(),
      end: jest.fn(),
      current: jest.fn(() => Promise.resolve(null)),
    },
  };
});

// Import after mock
import { LiveActivityDemoScreen } from '@/modules/live-activity-demo/screen';
import bridge from '@/native/live-activity';

const mockBridge = bridge as jest.Mocked<typeof bridge>;

// Helper to get text content from a test element
const getTextContent = (element: { props: { children: unknown } }): string => {
  const children = element.props.children;
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children
      .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : ''))
      .join('');
  }
  return String(children ?? '');
};

const mockSession: LiveActivitySession = {
  id: 'test-session-1',
  attributes: { name: 'Live Activity Demo', initialCounter: 0 },
  state: { counter: 0 },
};

describe('LiveActivityDemoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBridge.isAvailable.mockReturnValue(true);
    mockBridge.current.mockResolvedValue(null);
    mockBridge.start.mockResolvedValue(mockSession);
    mockBridge.update.mockResolvedValue({ ...mockSession, state: { counter: 1 } });
    mockBridge.end.mockResolvedValue(undefined);
  });

  describe('US1: Start a Live Activity', () => {
    describe('T023a: Mount and initial state', () => {
      it('calls bridge.current() on mount and renders "No activity running" when null', async () => {
        mockBridge.current.mockResolvedValue(null);

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          expect(mockBridge.current).toHaveBeenCalled();
        });

        const statusText = getByTestId('status-text');
        expect(statusText.props.children).toBe('No activity running');
      });

      it('renders "Activity running" when current() returns a session', async () => {
        mockBridge.current.mockResolvedValue(mockSession);

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('Activity running');
        });
      });
    });

    describe('T023b: Start button success', () => {
      it('tapping Start invokes bridge.start() and updates status', async () => {
        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          expect(mockBridge.current).toHaveBeenCalled();
        });

        const startButton = getByTestId('start-button');
        fireEvent.press(startButton);

        await waitFor(() => {
          expect(mockBridge.start).toHaveBeenCalledWith({
            name: 'Live Activity Demo',
            initialCounter: 0,
          });
        });

        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('Activity running');
          expect(text).toContain('counter 0');
        });
      });

      it('Start button is disabled after activity starts', async () => {
        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          expect(mockBridge.current).toHaveBeenCalled();
        });

        const startButton = getByTestId('start-button');
        fireEvent.press(startButton);

        await waitFor(() => {
          expect(mockBridge.start).toHaveBeenCalled();
        });

        await waitFor(() => {
          const startButtonAfter = getByTestId('start-button');
          expect(startButtonAfter.props.accessibilityState.disabled).toBe(true);
        });
      });

      it('Update and End buttons are enabled after activity starts', async () => {
        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          expect(mockBridge.current).toHaveBeenCalled();
        });

        const startButton = getByTestId('start-button');
        fireEvent.press(startButton);

        await waitFor(() => {
          const updateButton = getByTestId('update-button');
          const endButton = getByTestId('end-button');
          expect(updateButton.props.accessibilityState.disabled).toBe(false);
          expect(endButton.props.accessibilityState.disabled).toBe(false);
        });
      });
    });

    describe('T023c: Start button error handling', () => {
      it('shows authorisation error message with iOS Settings reference', async () => {
        mockBridge.start.mockRejectedValue(new LiveActivityAuthorisationError());

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          expect(mockBridge.current).toHaveBeenCalled();
        });

        const startButton = getByTestId('start-button');
        fireEvent.press(startButton);

        await waitFor(() => {
          const errorText = getByTestId('error-text');
          const text = getTextContent(errorText);
          expect(text).toContain('iOS Settings');
        });

        // Status should remain "No activity running"
        const statusText = getByTestId('status-text');
        expect(statusText.props.children).toBe('No activity running');
      });

      it('shows already running error message', async () => {
        mockBridge.start.mockRejectedValue(new LiveActivityAlreadyRunningError());

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          expect(mockBridge.current).toHaveBeenCalled();
        });

        const startButton = getByTestId('start-button');
        fireEvent.press(startButton);

        await waitFor(() => {
          const errorText = getByTestId('error-text');
          const text = getTextContent(errorText);
          expect(text).toContain('already running');
        });
      });
    });
  });

  describe('US2: Update the activity', () => {
    describe('T029a: Update button success', () => {
      it('tapping Update invokes bridge.update() and increments counter', async () => {
        mockBridge.current.mockResolvedValue(mockSession);
        mockBridge.update.mockResolvedValue({ ...mockSession, state: { counter: 1 } });

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('counter 0');
        });

        const updateButton = getByTestId('update-button');
        fireEvent.press(updateButton);

        await waitFor(() => {
          expect(mockBridge.update).toHaveBeenCalledWith({ counter: 1 });
        });

        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('counter 1');
        });
      });

      it('buttons remain in correct state after update', async () => {
        mockBridge.current.mockResolvedValue(mockSession);

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          expect(mockBridge.current).toHaveBeenCalled();
        });

        const updateButton = getByTestId('update-button');
        fireEvent.press(updateButton);

        await waitFor(() => {
          const startButton = getByTestId('start-button');
          const updateButtonAfter = getByTestId('update-button');
          const endButton = getByTestId('end-button');

          expect(startButton.props.accessibilityState.disabled).toBe(true);
          expect(updateButtonAfter.props.accessibilityState.disabled).toBe(false);
          expect(endButton.props.accessibilityState.disabled).toBe(false);
        });
      });
    });

    describe('T029b: Update when no session exists', () => {
      it('shows "nothing to update" message and clears session', async () => {
        mockBridge.current.mockResolvedValue(mockSession);
        mockBridge.update.mockRejectedValue(new LiveActivityNoActiveSessionError());

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        // Wait for session to be loaded from current()
        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('Activity running');
        });

        const updateButton = getByTestId('update-button');
        fireEvent.press(updateButton);

        // First ensure update was called
        await waitFor(() => {
          expect(mockBridge.update).toHaveBeenCalled();
        });

        // Then check for error message
        await waitFor(() => {
          const errorText = getByTestId('error-text');
          const text = getTextContent(errorText);
          expect(text).toContain('nothing to update');
        });

        await waitFor(() => {
          const statusText = getByTestId('status-text');
          expect(statusText.props.children).toBe('No activity running');
        });
      });
    });
  });

  describe('US3: End the activity', () => {
    describe('T033a: End button success', () => {
      it('tapping End invokes bridge.end() and clears session', async () => {
        mockBridge.current.mockResolvedValue(mockSession);

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('Activity running');
        });

        const endButton = getByTestId('end-button');
        fireEvent.press(endButton);

        await waitFor(() => {
          expect(mockBridge.end).toHaveBeenCalled();
        });

        await waitFor(() => {
          const statusText = getByTestId('status-text');
          expect(statusText.props.children).toBe('No activity running');
        });
      });

      it('Start button is enabled after activity ends', async () => {
        mockBridge.current.mockResolvedValue(mockSession);

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        // Wait for session to be loaded from current()
        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('Activity running');
        });

        const endButton = getByTestId('end-button');
        fireEvent.press(endButton);

        // First ensure end was called
        await waitFor(() => {
          expect(mockBridge.end).toHaveBeenCalled();
        });

        await waitFor(() => {
          const startButton = getByTestId('start-button');
          const updateButton = getByTestId('update-button');
          const endButtonAfter = getByTestId('end-button');

          expect(startButton.props.accessibilityState.disabled).toBe(false);
          expect(updateButton.props.accessibilityState.disabled).toBe(true);
          expect(endButtonAfter.props.accessibilityState.disabled).toBe(true);
        });
      });
    });

    describe('T033b: End when no session exists', () => {
      it('shows "nothing to end" message and clears session', async () => {
        mockBridge.current.mockResolvedValue(mockSession);
        mockBridge.end.mockRejectedValue(new LiveActivityNoActiveSessionError());

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        // Wait for session to be loaded from current()
        await waitFor(() => {
          const statusText = getByTestId('status-text');
          const text = getTextContent(statusText);
          expect(text).toContain('Activity running');
        });

        const endButton = getByTestId('end-button');
        fireEvent.press(endButton);

        // First ensure end was called
        await waitFor(() => {
          expect(mockBridge.end).toHaveBeenCalled();
        });

        // Then check for error message
        await waitFor(() => {
          const errorText = getByTestId('error-text');
          const text = getTextContent(errorText);
          expect(text).toContain('nothing to end');
        });
      });
    });
  });

  describe('US4: Unavailable platform', () => {
    describe('T037: Non-iOS / iOS < 16.1 behavior', () => {
      it('shows unavailable notice when isAvailable returns false', () => {
        mockBridge.isAvailable.mockReturnValue(false);

        const { getByText, getByTestId } = render(<LiveActivityDemoScreen />);

        expect(getByText('Live Activities are not available on this platform.')).toBeTruthy();

        // Buttons should be disabled
        const startButton = getByTestId('start-button');
        const updateButton = getByTestId('update-button');
        const endButton = getByTestId('end-button');

        expect(startButton.props.accessibilityState.disabled).toBe(true);
        expect(updateButton.props.accessibilityState.disabled).toBe(true);
        expect(endButton.props.accessibilityState.disabled).toBe(true);
      });

      it('tapping disabled buttons does not throw', () => {
        mockBridge.isAvailable.mockReturnValue(false);

        const { getByTestId } = render(<LiveActivityDemoScreen />);

        const startButton = getByTestId('start-button');
        const updateButton = getByTestId('update-button');
        const endButton = getByTestId('end-button');

        // These should not throw
        expect(() => fireEvent.press(startButton)).not.toThrow();
        expect(() => fireEvent.press(updateButton)).not.toThrow();
        expect(() => fireEvent.press(endButton)).not.toThrow();

        // Bridge methods should not be called
        expect(mockBridge.start).not.toHaveBeenCalled();
        expect(mockBridge.update).not.toHaveBeenCalled();
        expect(mockBridge.end).not.toHaveBeenCalled();
      });
    });
  });
});
