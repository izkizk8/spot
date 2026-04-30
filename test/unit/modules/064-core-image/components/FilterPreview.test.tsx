/**
 * FilterPreview Component Test
 * Feature: 064-core-image
 */
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

const FilterPreview = require('@/modules/064-core-image/components/FilterPreview').default;

describe('FilterPreview', () => {
  it('renders title', () => {
    render(<FilterPreview result={null} />);
    expect(screen.getByText(/Filter Result/i)).toBeTruthy();
  });

  it('shows placeholder when result is null', () => {
    render(<FilterPreview result={null} />);
    expect(screen.getByText(/No result yet/i)).toBeTruthy();
  });

  it('shows result data when result is provided', () => {
    const result = {
      outputUri: 'data:image/jpeg;base64,FAKE',
      filterId: 'sepia' as const,
      processingTimeMs: 37,
    };
    render(<FilterPreview result={result} />);
    expect(screen.getByText(/sepia/)).toBeTruthy();
    expect(screen.getByText(/37/)).toBeTruthy();
  });
});
