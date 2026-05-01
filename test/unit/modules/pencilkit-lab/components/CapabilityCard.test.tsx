/**
 * CapabilityCard Test
 * Feature: 082-pencilkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/pencilkit-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('shows the title', () => {
    render(<CapabilityCard canvasInfo={null} />);
    expect(screen.getByText(/PencilKit Capability/i)).toBeTruthy();
  });

  it('shows the unloaded state when info is null', () => {
    render(<CapabilityCard canvasInfo={null} />);
    expect(screen.getByText(/not loaded/i)).toBeTruthy();
  });

  it('renders pencil + policy details when available', () => {
    render(
      <CapabilityCard
        canvasInfo={{ available: true, supportsPencil: true, drawingPolicy: 'pencilOnly' }}
      />,
    );
    expect(screen.getByText(/Available/)).toBeTruthy();
    expect(screen.getByText(/Apple Pencil:/)).toBeTruthy();
    expect(screen.getByText(/Supported/)).toBeTruthy();
    expect(screen.getByText(/pencilOnly/)).toBeTruthy();
  });

  it('renders the unavailable copy when not available', () => {
    render(
      <CapabilityCard
        canvasInfo={{ available: false, supportsPencil: false, drawingPolicy: 'default' }}
      />,
    );
    expect(screen.getByText(/iOS 17/i)).toBeTruthy();
  });

  it('shows pencil "Not detected" when supportsPencil is false', () => {
    render(
      <CapabilityCard
        canvasInfo={{ available: true, supportsPencil: false, drawingPolicy: 'default' }}
      />,
    );
    expect(screen.getByText(/Not detected/)).toBeTruthy();
  });
});
