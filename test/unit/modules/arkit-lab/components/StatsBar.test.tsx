/**
 * StatsBar Test
 * Feature: 034-arkit-basics
 *
 * Tests FPS rendering (0 when paused), tracking state format coverage,
 * and mm:ss duration formatter.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import StatsBar from '@/modules/arkit-lab/components/StatsBar';
import type { SessionInfo } from '@/native/arkit.types';

describe('StatsBar', () => {
  const mockInfo: SessionInfo = {
    state: 'running',
    anchorCount: 0,
    fps: 60,
    duration: 0,
    trackingState: 'normal',
  };

  it('renders FPS value', () => {
    const { getByText } = render(<StatsBar info={{ ...mockInfo, fps: 58.5 }} />);

    expect(getByText(/58\.5/)).toBeTruthy();
    expect(getByText(/fps/i)).toBeTruthy();
  });

  it('renders FPS as 0 when state is paused', () => {
    const { getByText } = render(<StatsBar info={{ ...mockInfo, state: 'paused', fps: 0 }} />);

    expect(getByText('0.0')).toBeTruthy();
  });

  it('renders tracking state: normal', () => {
    const { getByText } = render(<StatsBar info={{ ...mockInfo, trackingState: 'normal' }} />);

    expect(getByText(/normal/i)).toBeTruthy();
  });

  it('renders tracking state: limited:initializing', () => {
    const { getByText } = render(
      <StatsBar info={{ ...mockInfo, trackingState: 'limited:initializing' }} />,
    );

    expect(getByText(/limited:initializing/i)).toBeTruthy();
  });

  it('renders tracking state: limited:excessiveMotion', () => {
    const { getByText } = render(
      <StatsBar info={{ ...mockInfo, trackingState: 'limited:excessiveMotion' }} />,
    );

    expect(getByText(/limited:excessiveMotion/i)).toBeTruthy();
  });

  it('renders tracking state: limited:insufficientFeatures', () => {
    const { getByText } = render(
      <StatsBar info={{ ...mockInfo, trackingState: 'limited:insufficientFeatures' }} />,
    );

    expect(getByText(/limited:insufficientFeatures/i)).toBeTruthy();
  });

  it('renders tracking state: limited:relocalizing', () => {
    const { getByText } = render(
      <StatsBar info={{ ...mockInfo, trackingState: 'limited:relocalizing' }} />,
    );

    expect(getByText(/limited:relocalizing/i)).toBeTruthy();
  });

  it('renders tracking state: notAvailable', () => {
    const { getByText } = render(
      <StatsBar info={{ ...mockInfo, trackingState: 'notAvailable' }} />,
    );

    expect(getByText(/notAvailable/i)).toBeTruthy();
  });

  it('formats duration as mm:ss for 0 seconds', () => {
    const { getByText } = render(<StatsBar info={{ ...mockInfo, duration: 0 }} />);

    expect(getByText(/00:00/)).toBeTruthy();
  });

  it('formats duration as mm:ss for 65 seconds', () => {
    const { getByText } = render(<StatsBar info={{ ...mockInfo, duration: 65 }} />);

    expect(getByText(/01:05/)).toBeTruthy();
  });

  it('formats duration as mm:ss for 3599 seconds', () => {
    const { getByText } = render(<StatsBar info={{ ...mockInfo, duration: 3599 }} />);

    expect(getByText(/59:59/)).toBeTruthy();
  });

  it('displays all three metrics in a single row', () => {
    const { getByText } = render(
      <StatsBar
        info={{
          ...mockInfo,
          fps: 60,
          trackingState: 'normal',
          duration: 42,
        }}
      />,
    );

    expect(getByText(/60/)).toBeTruthy();
    expect(getByText(/normal/i)).toBeTruthy();
    expect(getByText(/00:42/)).toBeTruthy();
  });
});
