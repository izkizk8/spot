import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ExplainerCard from '@/modules/background-tasks-lab/components/ExplainerCard';

describe('ExplainerCard', () => {
  it('mentions BGTaskScheduler', () => {
    render(<ExplainerCard />);
    expect(screen.getByText(/BGTaskScheduler/)).toBeTruthy();
  });

  it('mentions BGAppRefreshTask and BGProcessingTask', () => {
    render(<ExplainerCard />);
    expect(screen.getByText(/BGAppRefreshTask/)).toBeTruthy();
    expect(screen.getByText(/BGProcessingTask/)).toBeTruthy();
  });

  it('mentions coalescing/deferring vocabulary (EC-009)', () => {
    render(<ExplainerCard />);
    expect(screen.getByText(/coalesce|deferred/i)).toBeTruthy();
  });

  it('renders both task identifier literals', () => {
    render(<ExplainerCard />);
    expect(screen.getByText('com.izkizk8.spot.refresh')).toBeTruthy();
    expect(screen.getByText('com.izkizk8.spot.processing')).toBeTruthy();
  });

  it('renders without props on every platform', () => {
    const { toJSON } = render(<ExplainerCard />);
    expect(toJSON()).toBeTruthy();
  });
});
