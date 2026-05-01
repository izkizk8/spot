import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { MapToolbar, type MapType } from '@/modules/mapkit-lab/components/MapToolbar';
import type { PermissionStatus } from '@/modules/mapkit-lab/components/PermissionsCard';

const ALL_MAP_TYPES: MapType[] = ['standard', 'satellite', 'hybrid', 'mutedStandard'];

function renderToolbar(overrides: Partial<React.ComponentProps<typeof MapToolbar>> = {}) {
  const props = {
    mapType: 'standard' as MapType,
    onMapTypeChange: jest.fn(),
    userLocationEnabled: false,
    onUserLocationToggle: jest.fn(),
    onRecenter: jest.fn(),
    permissionStatus: 'granted' as PermissionStatus,
    ...overrides,
  };
  const utils = render(<MapToolbar {...props} />);
  return { ...utils, props };
}

describe('MapToolbar', () => {
  describe('segmented control', () => {
    it.each(ALL_MAP_TYPES)(
      'invokes onMapTypeChange with %s when its segment is pressed',
      (type) => {
        const { props } = renderToolbar({ mapType: 'standard' });

        fireEvent.press(screen.getByTestId(`maptype-segment-${type}`));

        expect(props.onMapTypeChange).toHaveBeenCalledTimes(1);
        expect(props.onMapTypeChange).toHaveBeenCalledWith(type);
      },
    );

    it('marks the active segment as selected', () => {
      renderToolbar({ mapType: 'satellite' });

      const active = screen.getByTestId('maptype-segment-satellite');
      const inactive = screen.getByTestId('maptype-segment-standard');

      expect(active.props.accessibilityState?.selected).toBe(true);
      expect(inactive.props.accessibilityState?.selected).toBe(false);
    });
  });

  describe('user location switch', () => {
    it.each<PermissionStatus>(['undetermined', 'denied', 'restricted'])(
      'is disabled and shows hint when permissionStatus=%s',
      (status) => {
        const { props } = renderToolbar({ permissionStatus: status });

        const switchEl = screen.getByTestId('user-location-switch');
        expect(switchEl.props.accessibilityState?.disabled).toBe(true);
        expect(screen.getByTestId('user-location-hint')).toBeTruthy();

        fireEvent.press(switchEl);
        expect(props.onUserLocationToggle).not.toHaveBeenCalled();
      },
    );

    it('is enabled and hides hint when permissionStatus=granted', () => {
      const { props } = renderToolbar({ permissionStatus: 'granted' });

      const switchEl = screen.getByTestId('user-location-switch');
      expect(switchEl.props.accessibilityState?.disabled).toBe(false);
      expect(screen.queryByTestId('user-location-hint')).toBeNull();

      fireEvent.press(switchEl);
      expect(props.onUserLocationToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('recenter', () => {
    it('calls onRecenter when pressed', () => {
      const { props } = renderToolbar();

      fireEvent.press(screen.getByTestId('recenter-button'));

      expect(props.onRecenter).toHaveBeenCalledTimes(1);
    });
  });
});
