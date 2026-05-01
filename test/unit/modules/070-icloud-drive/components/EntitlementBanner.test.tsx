/**
 * EntitlementBanner Test
 * Feature: 070-icloud-drive
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import EntitlementBanner from '@/modules/icloud-drive-lab/components/EntitlementBanner';

describe('EntitlementBanner', () => {
  it('renders the title', () => {
    render(<EntitlementBanner />);
    expect(screen.getByText(/Entitlement Required/i)).toBeTruthy();
  });

  it('mentions icloud-container-identifiers', () => {
    render(<EntitlementBanner />);
    expect(screen.getByText(/icloud-container-identifiers/i)).toBeTruthy();
  });

  it('mentions paid Apple Developer Program', () => {
    render(<EntitlementBanner />);
    expect(screen.getByText(/Apple Developer Program/i)).toBeTruthy();
  });

  it('mentions ICloudDriveNotAvailable', () => {
    render(<EntitlementBanner />);
    expect(screen.getByText(/ICloudDriveNotAvailable/)).toBeTruthy();
  });
});
