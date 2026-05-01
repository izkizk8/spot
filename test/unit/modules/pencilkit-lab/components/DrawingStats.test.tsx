/**
 * DrawingStats Test
 * Feature: 082-pencilkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import DrawingStats from '@/modules/pencilkit-lab/components/DrawingStats';

describe('DrawingStats', () => {
  it('renders stroke / data / bounds rows', () => {
    render(
      <DrawingStats
        stats={{ strokeCount: 3, dataLength: 1024, boundingWidth: 100.4, boundingHeight: 200.8 }}
      />,
    );
    expect(screen.getByText(/Strokes 3/)).toBeTruthy();
    expect(screen.getByText(/1024 bytes/)).toBeTruthy();
    expect(screen.getByText(/100 × 201 pt/)).toBeTruthy();
  });

  it('renders zeros for an empty drawing', () => {
    render(
      <DrawingStats
        stats={{ strokeCount: 0, dataLength: 0, boundingWidth: 0, boundingHeight: 0 }}
      />,
    );
    expect(screen.getByText(/Strokes 0/)).toBeTruthy();
    expect(screen.getByText(/0 bytes/)).toBeTruthy();
  });
});
