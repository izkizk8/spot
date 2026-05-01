import React from 'react';
import { render, screen } from '@testing-library/react-native';

import IOSOnlyBanner from '@/modules/background-tasks-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner', () => {
  it('renders the default "Background Tasks require iOS 13+" copy (FR-011)', () => {
    render(<IOSOnlyBanner />);
    expect(screen.getByText('Background Tasks require iOS 13+')).toBeTruthy();
  });

  it('renders alternative "older-ios" copy variant (FR-013 / EC-002)', () => {
    render(<IOSOnlyBanner reason='older-ios' />);
    expect(screen.getByText(/older than 13/)).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<IOSOnlyBanner />);
    expect(toJSON()).toBeTruthy();
  });
});
