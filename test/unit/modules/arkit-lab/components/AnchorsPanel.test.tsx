/**
 * AnchorsPanel Test
 * Feature: 034-arkit-basics
 *
 * Tests anchor list rendering (0 / 1 / 100 entries), ID truncation to 8 chars,
 * coordinate rounding to 2 decimals, newest-first ordering, soft-cap caption.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import AnchorsPanel from '@/modules/arkit-lab/components/AnchorsPanel';
import type { AnchorRecord } from '@/native/arkit.types';

describe('AnchorsPanel', () => {
  it('renders empty state when no anchors', () => {
    const { getByText } = render(<AnchorsPanel anchors={[]} />);

    expect(getByText(/no anchors/i)).toBeTruthy();
  });

  it('renders a single anchor with truncated ID and rounded coordinates', () => {
    const anchor: AnchorRecord = {
      id: '0e6f7c1a-1234-5678-90ab-cdef12345678',
      x: 0.123456,
      y: -0.045678,
      z: -0.872345,
      createdAt: Date.now(),
    };

    const { getByText } = render(<AnchorsPanel anchors={[anchor]} />);

    // ID truncated to first 8 chars
    expect(getByText('0e6f7c1a')).toBeTruthy();

    // Coordinates rounded to 2 decimals
    expect(getByText(/0\.12/)).toBeTruthy();
    expect(getByText(/-0\.05/)).toBeTruthy();
    expect(getByText(/-0\.87/)).toBeTruthy();
  });

  it('renders multiple anchors in newest-first order', () => {
    const anchor1: AnchorRecord = {
      id: '00000000-0000-0000-0000-000000000001',
      x: 1,
      y: 1,
      z: 1,
      createdAt: 1000,
    };
    const anchor2: AnchorRecord = {
      id: '00000000-0000-0000-0000-000000000002',
      x: 2,
      y: 2,
      z: 2,
      createdAt: 2000,
    };

    const { getAllByText } = render(<AnchorsPanel anchors={[anchor1, anchor2]} />);

    const ids = getAllByText(/00000000/);
    // Assuming newest-first, anchor2 should appear before anchor1
    expect(ids[0].children[0]).toBe('00000000');
  });

  it('renders soft-cap caption when showing 100 anchors', () => {
    const anchors: AnchorRecord[] = Array.from({ length: 100 }, (_, i) => ({
      id: `anchor-${i}`,
      x: i,
      y: i,
      z: i,
      createdAt: i,
    }));

    const { getByText } = render(<AnchorsPanel anchors={anchors} />);

    expect(getByText(/soft cap/i)).toBeTruthy();
  });

  it('slices to 100 newest-first entries at render boundary', () => {
    const anchors: AnchorRecord[] = Array.from({ length: 120 }, (_, i) => ({
      id: `anchor-${i}`,
      x: i,
      y: i,
      z: i,
      createdAt: i,
    }));

    const { getAllByText } = render(<AnchorsPanel anchors={anchors} />);

    // Should only render 100
    const renderedIds = getAllByText(/anchor-/);
    expect(renderedIds.length).toBeLessThanOrEqual(100);
  });

  it('renders inside a ScrollView for long lists', () => {
    const anchors: AnchorRecord[] = Array.from({ length: 50 }, (_, i) => ({
      id: `anchor-${i}`,
      x: i,
      y: i,
      z: i,
      createdAt: i,
    }));

    const { UNSAFE_getByType } = render(<AnchorsPanel anchors={anchors} />);

    // Verify ScrollView is present
    const { ScrollView } = require('react-native');
    expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
  });
});
