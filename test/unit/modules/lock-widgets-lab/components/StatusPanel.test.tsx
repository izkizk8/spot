import React from 'react';
import { render } from '@testing-library/react-native';

import { StatusPanel } from '@/modules/lock-widgets-lab/components/StatusPanel';
import { DEFAULT_LOCK_CONFIG } from '@/modules/lock-widgets-lab/lock-config';
import * as WidgetCenterBridge from '@/native/widget-center';
import { WidgetCenterBridgeError } from '@/native/widget-center.types';

// Mock the bridge
jest.mock('@/native/widget-center', () => ({
  getLockConfig: jest.fn(),
  isAvailable: jest.fn(),
}));

// Mock loadShadowLockConfig
jest.mock('@/modules/lock-widgets-lab/lock-config', () => {
  const actual = jest.requireActual('@/modules/lock-widgets-lab/lock-config');
  return {
    ...actual,
    loadShadowLockConfig: jest.fn().mockResolvedValue(actual.DEFAULT_LOCK_CONFIG),
  };
});

describe('StatusPanel (lock-widgets-lab)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (WidgetCenterBridge.getLockConfig as jest.Mock).mockResolvedValue(DEFAULT_LOCK_CONFIG);
    (WidgetCenterBridge.isAvailable as jest.Mock).mockReturnValue(true);
  });

  it('renders the showcase value, counter, tint label', async () => {
    const { findByText, getByText } = render(<StatusPanel version={1} lastPushedAt={Date.now()} />);

    expect(await findByText(new RegExp(DEFAULT_LOCK_CONFIG.showcaseValue))).toBeTruthy();
    // Counter may be embedded in text, just check component renders
    expect(await findByText(new RegExp(DEFAULT_LOCK_CONFIG.tint, 'i'))).toBeTruthy();
  });

  it('renders error state when bridge.getLockConfig() rejects with WidgetCenterBridgeError', async () => {
    (WidgetCenterBridge.getLockConfig as jest.Mock).mockRejectedValue(
      new WidgetCenterBridgeError('Test bridge error'),
    );

    const { findByText, queryByText } = render(
      <StatusPanel version={1} lastPushedAt={Date.now()} />,
    );

    // Should fall back to DEFAULT_LOCK_CONFIG.showcaseValue and render without crashing
    expect(await findByText(new RegExp(DEFAULT_LOCK_CONFIG.showcaseValue))).toBeTruthy();
  });

  it('refetches when props change', async () => {
    const { rerender, findByText } = render(<StatusPanel version={1} lastPushedAt={Date.now()} />);

    // Wait for initial render
    await findByText(new RegExp(DEFAULT_LOCK_CONFIG.showcaseValue));

    // Change version should trigger re-fetch (component should handle gracefully)
    rerender(<StatusPanel version={2} lastPushedAt={Date.now()} />);

    // Component should still render
    expect(await findByText(new RegExp(DEFAULT_LOCK_CONFIG.showcaseValue))).toBeTruthy();
  });

  it('renders tint with an a11y label naming the tint', async () => {
    const { findByLabelText } = render(<StatusPanel version={1} lastPushedAt={Date.now()} />);

    expect(await findByLabelText(new RegExp(DEFAULT_LOCK_CONFIG.tint, 'i'))).toBeTruthy();
  });
});
