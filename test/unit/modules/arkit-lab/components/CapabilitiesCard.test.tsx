/**
 * CapabilitiesCard Test
 * Feature: 034-arkit-basics
 *
 * Tests the read-only capabilities summary panel (worldTrackingSupported,
 * frame semantics, status pill).
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import CapabilitiesCard from '@/modules/arkit-lab/components/CapabilitiesCard';
import type { SessionInfo } from '@/native/arkit.types';

describe('CapabilitiesCard', () => {
  const mockInfo: SessionInfo = {
    state: 'idle',
    anchorCount: 0,
    fps: 0,
    duration: 0,
    trackingState: 'notAvailable',
  };

  it('renders supported branch when worldTrackingSupported is true', () => {
    const { getByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={true}
        peopleOcclusionSupported={false}
        info={mockInfo}
      />,
    );

    expect(getByText(/world tracking/i)).toBeTruthy();
  });

  it('renders unsupported branch when worldTrackingSupported is false', () => {
    const { getByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={false}
        peopleOcclusionSupported={false}
        info={mockInfo}
      />,
    );

    expect(getByText(/not supported/i)).toBeTruthy();
  });

  it('renders status pill for idle state', () => {
    const { getByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={true}
        peopleOcclusionSupported={false}
        info={{ ...mockInfo, state: 'idle' }}
      />,
    );

    expect(getByText(/idle/i)).toBeTruthy();
  });

  it('renders status pill for running state', () => {
    const { getByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={true}
        peopleOcclusionSupported={false}
        info={{ ...mockInfo, state: 'running' }}
      />,
    );

    expect(getByText(/running/i)).toBeTruthy();
  });

  it('renders status pill for paused state', () => {
    const { getByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={true}
        peopleOcclusionSupported={false}
        info={{ ...mockInfo, state: 'paused' }}
      />,
    );

    expect(getByText(/paused/i)).toBeTruthy();
  });

  it('renders status pill for error state with lastError message', () => {
    const { getByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={true}
        peopleOcclusionSupported={false}
        info={{
          ...mockInfo,
          state: 'error',
          lastError: 'Session failed to start',
        }}
      />,
    );

    expect(getByText(/error/i)).toBeTruthy();
    expect(getByText(/Session failed to start/)).toBeTruthy();
  });

  it('shows peopleOcclusion in frame semantics when supported', () => {
    const { getByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={true}
        peopleOcclusionSupported={true}
        info={mockInfo}
      />,
    );

    expect(getByText(/people occlusion/i)).toBeTruthy();
  });

  it('does not show peopleOcclusion when not supported', () => {
    const { queryByText } = render(
      <CapabilitiesCard
        worldTrackingSupported={true}
        peopleOcclusionSupported={false}
        info={mockInfo}
      />,
    );

    expect(queryByText(/people occlusion/i)).toBeNull();
  });
});
