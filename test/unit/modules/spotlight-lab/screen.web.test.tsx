/**
 * Tests for spotlight-lab Web screen — feature 031 / T041.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

describe('spotlight-lab screen (Web)', () => {
  it('renders the same component set as the Android variant (FR-012)', () => {
    const Screen = require('@/modules/spotlight-lab/screen.web').default;
    render(<Screen />);
    expect(screen.getAllByText(/Spotlight.*iOS 9/i).length).toBeGreaterThan(0);
    expect(screen.getByText('About Spotlight Indexing')).toBeTruthy();
    expect(screen.getByText('Persistence Note')).toBeTruthy();
    // No interactive panels
    expect(screen.queryByText('Bulk Actions')).toBeNull();
    expect(screen.queryByText('Search Test')).toBeNull();
    expect(screen.queryByText('User Activity')).toBeNull();
  });

  it('does NOT statically import src/native/spotlight (SC-007)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../../../src/modules/spotlight-lab/screen.web.tsx',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    // Must not have any import from the bridge
    expect(src).not.toMatch(/from\s+['"]@\/native\/spotlight['"]/);
    expect(src).not.toMatch(/from\s+['"]\.\.\/\.\.\/native\/spotlight['"]/);
    // Only types import is allowed (but screen.web doesn't need it)
    // So check bridge is not referenced at all
    expect(src).not.toMatch(/spotlight\.index/);
    expect(src).not.toMatch(/spotlight\.search/);
  });

  it('renders without crashing', () => {
    const Screen = require('@/modules/spotlight-lab/screen.web').default;
    const { toJSON } = render(<Screen />);
    expect(toJSON()).toBeTruthy();
  });
});
