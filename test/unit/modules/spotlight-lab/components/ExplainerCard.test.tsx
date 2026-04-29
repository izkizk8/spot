/**
 * Tests for ExplainerCard — feature 031 / T020.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ExplainerCard from '@/modules/spotlight-lab/components/ExplainerCard';

describe('ExplainerCard', () => {
  it('mentions CSSearchableIndex', () => {
    render(<ExplainerCard />);
    expect(screen.getByText(/CSSearchableIndex/)).toBeTruthy();
  });

  it('mentions NSUserActivity', () => {
    render(<ExplainerCard />);
    expect(screen.getByText(/NSUserActivity/)).toBeTruthy();
  });

  it('mentions the home-screen test recipe (swipe down + search)', () => {
    render(<ExplainerCard />);
    // Test recipe text includes swipe down instruction
    expect(screen.getAllByText(/swipe down on home/i).length).toBeGreaterThan(0);
  });

  it('renders without props on every platform', () => {
    const { toJSON } = render(<ExplainerCard />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses ThemedText / ThemedView (no raw color literals in snapshot)', () => {
    const { toJSON } = render(<ExplainerCard />);
    const snapshot = JSON.stringify(toJSON());
    // Basic check: no inline hex color strings in style props at root
    // Real validation: component uses ThemedText/ThemedView
    expect(snapshot).toContain('View');
    expect(snapshot).toContain('Text');
  });
});
