/**
 * Test suite for HistoryLog component.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import HistoryLog from '@/modules/local-auth-lab/components/HistoryLog';

describe('HistoryLog', () => {
  it('renders empty placeholder when there is no history', () => {
    const { getByText } = render(<HistoryLog history={[]} />);
    expect(getByText(/No attempts yet/)).toBeTruthy();
  });

  it('renders one row per attempt', () => {
    const { getAllByTestId } = render(
      <HistoryLog
        history={[
          { success: true, timestamp: '2026-01-01T00:00:00.000Z' },
          { success: false, error: 'user_cancel', timestamp: '2026-01-01T00:00:01.000Z' },
          { success: false, error: 'lockout', timestamp: '2026-01-01T00:00:02.000Z' },
        ]}
      />,
    );
    expect(getAllByTestId('localauth-history-row')).toHaveLength(3);
  });

  it('describes outcomes', () => {
    const { getByText } = render(
      <HistoryLog
        history={[
          { success: true, timestamp: 't1' },
          { success: false, error: 'user_cancel', timestamp: 't2' },
          { success: false, error: 'lockout', timestamp: 't3' },
        ]}
      />,
    );
    expect(getByText(/success/)).toBeTruthy();
    expect(getByText(/cancelled/)).toBeTruthy();
    expect(getByText(/lockout/)).toBeTruthy();
  });
});
