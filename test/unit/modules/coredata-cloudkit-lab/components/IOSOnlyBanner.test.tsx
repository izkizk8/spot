/**
 * IOSOnlyBanner Test
 * Feature: 052-core-data-cloudkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import IOSOnlyBanner from '@/modules/coredata-cloudkit-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (coredata-cloudkit-lab)', () => {
  it('renders banner', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('mentions Core Data + CloudKit', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText(/Core Data \+ CloudKit/i)).toBeTruthy();
  });
});
