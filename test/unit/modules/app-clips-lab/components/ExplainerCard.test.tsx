/**
 * Unit tests: ExplainerCard — App Clips Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ExplainerCard from '@/modules/app-clips-lab/components/ExplainerCard';

describe('ExplainerCard (App Clips)', () => {
  it('mentions App Clips', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/App Clip/).length).toBeGreaterThan(0);
  });

  it('mentions invocation surfaces (NFC, QR / Codes, Smart App Banner, Maps, Messages)', () => {
    render(<ExplainerCard />);
    expect(
      screen.getAllByText(/NFC|QR|App Clip Code|Smart App Banner|Maps|Messages/).length,
    ).toBeGreaterThan(0);
  });

  it('mentions the 10MB size budget', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/10MB/).length).toBeGreaterThan(0);
  });

  it('mentions _XCAppClipURL or user-activity', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/_XCAppClipURL|user-activity/).length).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<ExplainerCard />);
    expect(toJSON()).toBeTruthy();
  });
});
