/**
 * Unit tests: LimitationsCard — App Clips Lab.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import LimitationsCard from '@/modules/app-clips-lab/components/LimitationsCard';

describe('LimitationsCard (App Clips)', () => {
  it('renders the Limitations heading and a non-zero number of items', () => {
    const { getByText, getAllByTestId } = render(<LimitationsCard />);
    expect(getByText(/Limitations/)).toBeTruthy();
    expect(getAllByTestId(/appclip-limit-/).length).toBeGreaterThan(0);
  });

  it('mentions the 10MB size budget', () => {
    const { getAllByText } = render(<LimitationsCard />);
    expect(getAllByText(/10MB/).length).toBeGreaterThan(0);
  });

  it('mentions restricted frameworks (HealthKit / background)', () => {
    const { getAllByText } = render(<LimitationsCard />);
    expect(getAllByText(/HealthKit|background|CallKit|frameworks/i).length).toBeGreaterThan(0);
  });

  it('mentions ephemeral / eviction behaviour', () => {
    const { getAllByText } = render(<LimitationsCard />);
    expect(getAllByText(/evict|ephemeral|purged|disuse/i).length).toBeGreaterThan(0);
  });

  it('produces a non-empty snapshot', () => {
    const { toJSON } = render(<LimitationsCard />);
    expect(toJSON()).toBeTruthy();
  });
});
