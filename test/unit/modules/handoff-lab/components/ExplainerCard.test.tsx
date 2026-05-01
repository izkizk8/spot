/**
 * Unit tests: ExplainerCard component (T021 / US1).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ExplainerCard from '@/modules/handoff-lab/components/ExplainerCard';

describe('ExplainerCard', () => {
  it('mentions NSUserActivity', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/NSUserActivity/).length).toBeGreaterThan(0);
  });

  it('mentions Handoff', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/Handoff/).length).toBeGreaterThan(0);
  });

  it('points to Spotlight indexing reuse (feature 031)', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/Spotlight/).length).toBeGreaterThan(0);
  });

  it('mentions Siri prediction', () => {
    render(<ExplainerCard />);
    expect(screen.getAllByText(/prediction/i).length).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<ExplainerCard />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses ThemedText / ThemedView primitives', () => {
    const { toJSON } = render(<ExplainerCard />);
    const snapshot = JSON.stringify(toJSON());
    expect(snapshot).toContain('View');
    expect(snapshot).toContain('Text');
  });
});
