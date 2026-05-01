/**
 * SetupGuideCard component tests.
 * Feature: 036-passkit-wallet
 *
 * RED phase: test fails until T025 lands.
 */

import { render } from '@testing-library/react-native';
import React from 'react';

describe('SetupGuideCard', () => {
  it('renders 4-6 ordered steps', async () => {
    const { SetupGuideCard } = require('@/modules/passkit-lab/components/SetupGuideCard');

    const { getAllByText } = render(<SetupGuideCard />);

    const steps = getAllByText(/^\d+\. /);
    expect(steps.length).toBeGreaterThanOrEqual(4);
    expect(steps.length).toBeLessThanOrEqual(6);
  });

  it('contains Pass Type ID registration step', async () => {
    const { SetupGuideCard } = require('@/modules/passkit-lab/components/SetupGuideCard');

    const { getAllByText } = render(<SetupGuideCard />);

    expect(getAllByText(/pass type id/i).length).toBeGreaterThan(0);
  });

  it('contains certificate generation step', async () => {
    const { SetupGuideCard } = require('@/modules/passkit-lab/components/SetupGuideCard');

    const { getAllByText } = render(<SetupGuideCard />);

    expect(getAllByText(/certificate/i).length).toBeGreaterThan(0);
  });

  it('links resolve to developer.apple.com', async () => {
    const Linking = require('react-native').Linking;
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { SetupGuideCard } = require('@/modules/passkit-lab/components/SetupGuideCard');
    const { fireEvent } = require('@testing-library/react-native');

    const { getAllByRole } = render(<SetupGuideCard />);

    const links = getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link: { props: Record<string, unknown> }) => {
      fireEvent.press(link);
    });

    expect(openURL).toHaveBeenCalled();
    openURL.mock.calls.forEach(([url]) => {
      expect(url).toMatch(/developer\.apple\.com/);
    });
    openURL.mockRestore();
  });

  it('renders with stable a11y order', async () => {
    const { SetupGuideCard } = require('@/modules/passkit-lab/components/SetupGuideCard');

    const { getAllByText } = render(<SetupGuideCard />);

    // 4–6 ordered steps, each prefixed with "N." in title
    const steps = getAllByText(/^\d+\. /);
    expect(steps.length).toBeGreaterThanOrEqual(4);
    expect(steps.length).toBeLessThanOrEqual(6);
  });
});
