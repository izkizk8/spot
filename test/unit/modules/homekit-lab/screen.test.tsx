/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

import { __setHomeKitBridgeForTests } from '@/modules/homekit-lab/hooks/useHomeKit';
import type { HomeKitBridge } from '@/native/homekit.types';

const mockBridge: HomeKitBridge = {
  isAvailable: jest.fn(() => true),
  getAuthStatus: jest.fn(async () => 'authorized'),
  requestAccess: jest.fn(async () => 'authorized'),
  getHomes: jest.fn(async () => []),
  getAccessories: jest.fn(async () => []),
  readCharacteristic: jest.fn(async () => false),
  writeCharacteristic: jest.fn(async () => undefined),
  observeCharacteristic: jest.fn(() => () => {}),
};

beforeEach(() => {
  __setHomeKitBridgeForTests(mockBridge);
});

afterEach(() => {
  __setHomeKitBridgeForTests(null);
  jest.clearAllMocks();
});

import HomeKitLabScreen from '@/modules/homekit-lab/screen';

async function renderAndFlush() {
  const utils = render(<HomeKitLabScreen />);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return utils;
}

describe('homekit-lab screen (iOS)', () => {
  it('renders the six cards', async () => {
    const { getByTestId } = await renderAndFlush();
    expect(getByTestId('homekit-auth-card')).toBeTruthy();
    expect(getByTestId('homekit-homes-card')).toBeTruthy();
    expect(getByTestId('homekit-rooms-card')).toBeTruthy();
    expect(getByTestId('homekit-accessories-card')).toBeTruthy();
    expect(getByTestId('homekit-editor-card')).toBeTruthy();
    expect(getByTestId('homekit-live-card')).toBeTruthy();
  });

  it('renders empty states when the hook returns no data', async () => {
    const { getByTestId } = await renderAndFlush();
    expect(getByTestId('homekit-homes-empty')).toBeTruthy();
    expect(getByTestId('homekit-rooms-empty')).toBeTruthy();
    expect(getByTestId('homekit-accessories-empty')).toBeTruthy();
    expect(getByTestId('homekit-editor-empty')).toBeTruthy();
  });
});
