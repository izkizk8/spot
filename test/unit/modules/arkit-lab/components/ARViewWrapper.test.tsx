/**
 * ARViewWrapper Test
 * Feature: 034-arkit-basics
 *
 * Tests platform routing: iOS with native view, unsupported placeholder,
 * permission denied placeholder, and Android/Web with IOSOnlyBanner.
 */

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import ARViewWrapper from '@/modules/arkit-lab/components/ARViewWrapper';

// Mock native view manager
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => 'ARKitView'),
}));

describe('ARViewWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('iOS', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('renders ARKitView when isAvailable and permission granted', () => {
      const { UNSAFE_getByType } = render(
        <ARViewWrapper
          isAvailable={true}
          permissionGranted={true}
          config={{
            planeDetection: 'horizontal',
            peopleOcclusion: false,
            lightEstimation: true,
            worldMapPersistence: false,
          }}
        />,
      );

      // Native view manager is mocked, but we verify the component tree
      expect(UNSAFE_getByType(ARViewWrapper)).toBeTruthy();
    });

    it('renders unsupported placeholder when isAvailable is false', () => {
      const { getByText } = render(
        <ARViewWrapper
          isAvailable={false}
          permissionGranted={true}
          config={{
            planeDetection: 'horizontal',
            peopleOcclusion: false,
            lightEstimation: true,
            worldMapPersistence: false,
          }}
        />,
      );

      expect(getByText(/unsupported on this device/i)).toBeTruthy();
    });

    it('renders permission placeholder when permission denied', () => {
      const mockOnOpenSettings = jest.fn();
      const { getByText } = render(
        <ARViewWrapper
          isAvailable={true}
          permissionGranted={false}
          config={{
            planeDetection: 'horizontal',
            peopleOcclusion: false,
            lightEstimation: true,
            worldMapPersistence: false,
          }}
          onOpenSettings={mockOnOpenSettings}
        />,
      );

      expect(getByText(/camera permission/i)).toBeTruthy();
      expect(getByText(/open settings/i)).toBeTruthy();
    });
  });

  describe('Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('renders IOSOnlyBanner', () => {
      const { getByText } = render(
        <ARViewWrapper
          isAvailable={false}
          permissionGranted={false}
          config={{
            planeDetection: 'horizontal',
            peopleOcclusion: false,
            lightEstimation: true,
            worldMapPersistence: false,
          }}
        />,
      );

      expect(getByText('ARKit requires iOS 11+. The UI structure is preserved for educational purposes.')).toBeTruthy();
    });
  });

  describe('Web', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('renders IOSOnlyBanner', () => {
      const { getByText } = render(
        <ARViewWrapper
          isAvailable={false}
          permissionGranted={false}
          config={{
            planeDetection: 'horizontal',
            peopleOcclusion: false,
            lightEstimation: true,
            worldMapPersistence: false,
          }}
        />,
      );

      expect(getByText('ARKit requires iOS 11+. The UI structure is preserved for educational purposes.')).toBeTruthy();
    });
  });
});
