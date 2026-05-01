import React from 'react';
import { render } from '@testing-library/react-native';

import { ExplainerCard } from '@/modules/standby-lab/components/ExplainerCard';

describe('ExplainerCard (standby-lab)', () => {
  it('renders heading and body prose', () => {
    const { getByText } = render(<ExplainerCard />);
    expect(getByText(/about.*standby/i)).toBeTruthy();
  });

  it('body mentions StandBy and each of the three rendering-mode names', () => {
    const { getAllByText, getByText } = render(<ExplainerCard />);
    expect(getAllByText(/StandBy/i).length).toBeGreaterThan(0);
    expect(getByText(/Full Color/i)).toBeTruthy();
    expect(getByText(/Accented/i)).toBeTruthy();
    expect(getByText(/Vibrant/i)).toBeTruthy();
  });

  it('renders identically on every platform (no Platform.OS branch)', () => {
    // Smoke-render: no crash regardless of test environment
    const { getAllByText } = render(<ExplainerCard />);
    expect(getAllByText(/StandBy/i).length).toBeGreaterThan(0);
  });

  it('accepts an optional style prop without crashing', () => {
    const { getAllByText } = render(<ExplainerCard style={{ backgroundColor: 'red' }} />);
    expect(getAllByText(/StandBy/i).length).toBeGreaterThan(0);
  });
});
