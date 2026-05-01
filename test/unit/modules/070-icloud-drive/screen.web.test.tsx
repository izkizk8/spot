/**
 * iCloud Drive Lab Screen Test (Web)
 * Feature: 070-icloud-drive
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import Screen from '@/modules/icloud-drive-lab/screen.web';

describe('ICloudDriveLabScreen (Web)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/Refresh Files/i)).toBeNull();
  });
});
