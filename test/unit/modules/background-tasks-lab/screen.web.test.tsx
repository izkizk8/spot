/**
 * Tests for background-tasks-lab Web screen — feature 030 / T037.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

describe('background-tasks-lab screen (Web)', () => {
  it('renders banner + explainer + test trigger (FR-012)', () => {
    const Screen = require('@/modules/background-tasks-lab/screen.web').default;
    render(<Screen />);
    expect(screen.getByText('Background Tasks require iOS 13+')).toBeTruthy();
    expect(screen.getByText('About Background Tasks')).toBeTruthy();
    expect(screen.getByText(/Test triggers/)).toBeTruthy();
  });

  it('source does NOT statically import "@/native/background-tasks" (FR-012/SC-007)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../../../src/modules/background-tasks-lab/screen.web.tsx',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).not.toMatch(/from\s+['"]@\/native\/background-tasks['"]/);
    // Importing the .types module (type-only) is permitted; source above does not.
    expect(src).not.toMatch(/from\s+['"]\.\.\/\.\.\/native\/background-tasks['"]/);
  });

  it('source imports only cross-platform-safe modules', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../../../src/modules/background-tasks-lab/screen.web.tsx',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    expect(src).toMatch(/IOSOnlyBanner/);
    expect(src).toMatch(/ExplainerCard/);
    expect(src).toMatch(/TestTriggerCard/);
  });
});
