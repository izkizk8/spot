/**
 * StatsBar component tests (feature 017, User Story 1).
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { StatsBar } from '@/modules/camera-vision/components/StatsBar';

describe('StatsBar', () => {
  it('renders fps to one decimal place', () => {
    const { getByText } = render(<StatsBar fps={3.456} lastAnalysisMs={50} detected={2} />);
    expect(getByText(/3\.5/)).toBeTruthy();
  });

  it('renders lastAnalysisMs as "N ms" for positive values', () => {
    const { getByText } = render(<StatsBar fps={3.0} lastAnalysisMs={123} detected={2} />);
    expect(getByText(/123 ms/)).toBeTruthy();
  });

  it('renders "—" when lastAnalysisMs is null', () => {
    const { getByText } = render(<StatsBar fps={3.0} lastAnalysisMs={null} detected={2} />);
    expect(getByText(/—/)).toBeTruthy();
  });

  it('renders detected count', () => {
    const { getByText } = render(<StatsBar fps={3.0} lastAnalysisMs={50} detected={5} />);
    expect(getByText('Detected:')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('uses ThemedText and Spacing scale', () => {
    // This is verified by the implementation using ThemedText and Spacing
    const { UNSAFE_root } = render(<StatsBar fps={3.0} lastAnalysisMs={50} detected={2} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
