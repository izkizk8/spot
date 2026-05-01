/**
 * PencilKit Lab Screen Test (Android)
 * Feature: 082-pencilkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import Screen from '@/modules/pencilkit-lab/screen.android';

describe('PencilKitLabScreen (Android)', () => {
  it('renders IOSOnlyBanner', () => {
    render(<Screen />);
    expect(screen.getByText(/iOS Only Feature/i)).toBeTruthy();
  });

  it('no interactive sections present', () => {
    render(<Screen />);
    expect(screen.queryByText(/PencilKit Capability/i)).toBeNull();
  });
});
