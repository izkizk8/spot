/**
 * CapabilityCard Test
 * Feature: 060-visual-look-up
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import React from 'react';

import CapabilityCard from '@/modules/visual-look-up-lab/components/CapabilityCard';

describe('CapabilityCard', () => {
  it('shows the title', () => {
    render(<CapabilityCard supported={null} lastImageUri={null} />);
    expect(screen.getByText(/Visual Look Up Capability/i)).toBeTruthy();
  });

  it('shows unchecked state when supported is null', () => {
    render(<CapabilityCard supported={null} lastImageUri={null} />);
    expect(screen.getByText(/not checked/i)).toBeTruthy();
  });

  it('shows Supported when supported is true', () => {
    render(<CapabilityCard supported={true} lastImageUri={null} />);
    expect(screen.getByText(/^Supported$/)).toBeTruthy();
  });

  it('shows unavailable copy when supported is false', () => {
    render(<CapabilityCard supported={false} lastImageUri={null} />);
    expect(screen.getByText(/iOS 15/i)).toBeTruthy();
  });

  it('shows lastImageUri when provided', () => {
    render(<CapabilityCard supported={true} lastImageUri='asset://demo.jpg' />);
    expect(screen.getByText(/asset:\/\/demo\.jpg/)).toBeTruthy();
  });

  it('does not show uri line when lastImageUri is null', () => {
    render(<CapabilityCard supported={true} lastImageUri={null} />);
    expect(screen.queryByText(/Last image:/)).toBeNull();
  });
});
