/**
 * Core Data + CloudKit Lab Screen Test (Android)
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import Screen from '@/modules/coredata-cloudkit-lab/screen.android';

describe('CoreDataCloudKitLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/CloudKit Account Status/i)).toBeNull();
  });
});
