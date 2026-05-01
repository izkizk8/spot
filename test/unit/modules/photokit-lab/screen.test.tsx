/**
 * PhotoKit Lab Screen Test (iOS)
 * Feature: 057-photokit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 14;

const baseHookReturn = {
  authorizationStatus: 'authorized' as const,
  assets: [],
  loading: false,
  lastError: null,
  checkStatus: jest.fn(),
  requestAccess: jest.fn(),
  pickPhotos: jest.fn(),
  clearAssets: jest.fn(),
};

const mockUsePhotoKit = jest.fn(() => baseHookReturn);

jest.mock('@/modules/photokit-lab/hooks/usePhotoKit', () => ({
  usePhotoKit: mockUsePhotoKit,
}));

describe('PhotoKitLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/photokit-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/PhotoKit Capability/i)).toBeTruthy();
    expect(screen.getByText(/Controls/i)).toBeTruthy();
    expect(screen.getByText(/Selected Photos/i)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });

  it('shows pick photos and request access buttons', () => {
    const Screen = require('@/modules/photokit-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/Pick Photos/i)).toBeTruthy();
    expect(screen.getByText(/Request Access/i)).toBeTruthy();
  });
});
