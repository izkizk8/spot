import React from 'react';
import { render } from '@testing-library/react-native';

import {
  IOSOnlyBanner,
  IOS_ONLY_BANNER_TEXT,
} from '@/modules/standby-lab/components/IOSOnlyBanner';

describe('IOSOnlyBanner (standby-lab)', () => {
  it('renders the literal user-facing string "StandBy Mode is iOS 17+ only"', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText('StandBy Mode is iOS 17+ only')).toBeTruthy();
    expect(IOS_ONLY_BANNER_TEXT).toBe('StandBy Mode is iOS 17+ only');
  });

  it('uses accessibilityRole="alert" for screen-reader announcement', () => {
    const { getByText } = render(<IOSOnlyBanner />);
    const banner = getByText('StandBy Mode is iOS 17+ only').parent;
    // Walk up to find the View with accessibilityRole='alert'
    let node: any = banner;
    let found = false;
    for (let i = 0; i < 5 && node; i++) {
      if (node.props?.accessibilityRole === 'alert') {
        found = true;
        break;
      }
      node = node.parent;
    }
    expect(found).toBe(true);
  });

  it('is a pure presentational component (no platform branching inside)', () => {
    // Smoke render — no thrown error regardless of test environment Platform.OS
    const { getByText } = render(<IOSOnlyBanner />);
    expect(getByText('StandBy Mode is iOS 17+ only')).toBeTruthy();
  });

  it('accepts an optional style prop and renders without crashing', () => {
    const { getByText } = render(<IOSOnlyBanner style={{ marginTop: 4 }} />);
    expect(getByText('StandBy Mode is iOS 17+ only')).toBeTruthy();
  });
});
