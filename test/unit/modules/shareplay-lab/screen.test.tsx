/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { __setSharePlayBridgeForTests } from '@/modules/shareplay-lab/hooks/useGroupActivity';
import { INITIAL_SESSION_STATE, type SharePlayBridge } from '@/native/shareplay.types';

const mockBridge: SharePlayBridge = {
  isAvailable: jest.fn(() => true),
  getState: jest.fn(() => INITIAL_SESSION_STATE),
  startActivity: jest.fn(async () => undefined),
  endActivity: jest.fn(async () => undefined),
  sendCounter: jest.fn(async () => undefined),
  subscribe: jest.fn(() => () => {}),
};

beforeEach(() => {
  __setSharePlayBridgeForTests(mockBridge);
});

afterEach(() => {
  __setSharePlayBridgeForTests(null);
  jest.clearAllMocks();
});

import SharePlayLabScreen from '@/modules/shareplay-lab/screen';

describe('shareplay-lab screen (iOS)', () => {
  it('renders all primary sections including the Counter live demo by default', () => {
    const { getByTestId } = render(<SharePlayLabScreen />);
    expect(getByTestId('shareplay-capability-card')).toBeTruthy();
    expect(getByTestId('shareplay-activity-composer')).toBeTruthy();
    expect(getByTestId('shareplay-session-status-card')).toBeTruthy();
    expect(getByTestId('shareplay-participants-list')).toBeTruthy();
    // Counter activity is the default → renders.
    expect(getByTestId('shareplay-counter-activity')).toBeTruthy();
    expect(getByTestId('shareplay-setup-instructions')).toBeTruthy();
  });
});
