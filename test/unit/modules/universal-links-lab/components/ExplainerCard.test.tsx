/**
 * Unit tests: ExplainerCard — Universal Links Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ExplainerCard from '@/modules/universal-links-lab/components/ExplainerCard';

describe('ExplainerCard', () => {
  it('mentions Universal Links', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/Universal Link/).length).toBeGreaterThan(0);
  });

  it('mentions apple-app-site-association / AASA', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/apple-app-site-association|AASA/).length).toBeGreaterThan(0);
  });

  it('mentions Associated Domains entitlement', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/Associated Domains|applinks:/).length).toBeGreaterThan(0);
  });

  it('mentions caveats about caching and signed-in state', () => {
    render(<ExplainerCard />);
    expect(
      screen.getAllByText(/cached|first launch|first-launch|iCloud|Safari/i).length,
    ).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<ExplainerCard />);
    expect(toJSON()).toBeTruthy();
  });
});
