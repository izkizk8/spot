/**
 * CapabilityCard Test
 * Feature: 057-photokit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/photokit-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('renders the title', () => {
    render(<CapabilityCard authorizationStatus={null} />);
    expect(screen.getByText(/PhotoKit Capability/i)).toBeTruthy();
  });

  it('shows "not checked" when status is null', () => {
    render(<CapabilityCard authorizationStatus={null} />);
    expect(screen.getByText(/not checked yet/i)).toBeTruthy();
  });

  it('shows authorized status', () => {
    render(<CapabilityCard authorizationStatus="authorized" />);
    expect(screen.getByText(/Authorized/i)).toBeTruthy();
  });

  it('shows limited status', () => {
    render(<CapabilityCard authorizationStatus="limited" />);
    expect(screen.getByText(/Limited/i)).toBeTruthy();
  });

  it('shows denied status', () => {
    render(<CapabilityCard authorizationStatus="denied" />);
    expect(screen.getByText(/Denied/i)).toBeTruthy();
  });

  it('shows restricted status', () => {
    render(<CapabilityCard authorizationStatus="restricted" />);
    expect(screen.getByText(/Restricted/i)).toBeTruthy();
  });

  it('shows notDetermined status', () => {
    render(<CapabilityCard authorizationStatus="notDetermined" />);
    expect(screen.getByText(/Not determined/i)).toBeTruthy();
  });
});
