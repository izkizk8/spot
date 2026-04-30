/**
 * Unit tests: handoff-lab screen (iOS) — T036.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import type { ContinuationEvent } from '@/modules/handoff-lab/types';

const mockSetCurrent = jest.fn().mockResolvedValue(undefined);
const mockResignCurrent = jest.fn().mockResolvedValue(undefined);
const mockGetCurrent = jest.fn().mockResolvedValue(null);

const hookState: {
  currentActivity: null;
  log: ContinuationEvent[];
  isAvailable: boolean;
} = {
  currentActivity: null,
  log: [],
  isAvailable: true,
};

jest.mock('@/modules/handoff-lab/hooks/useHandoffActivity', () => ({
  useHandoffActivity: () => ({
    currentActivity: hookState.currentActivity,
    log: hookState.log,
    isAvailable: hookState.isAvailable,
    setCurrent: mockSetCurrent,
    resignCurrent: mockResignCurrent,
    getCurrent: mockGetCurrent,
  }),
}));

import HandoffLabScreen from '@/modules/handoff-lab/screen';

describe('handoff-lab screen (iOS)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hookState.currentActivity = null;
    hookState.log = [];
  });

  it('renders ExplainerCard, ActivityComposer, CurrentActivityCard, IncomingLog, SetupInstructions', () => {
    const { getByText, getAllByText } = render(<HandoffLabScreen />);
    expect(getByText(/About Handoff/i)).toBeTruthy(); // ExplainerCard heading
    expect(getByText(/Compose Activity/i)).toBeTruthy(); // ActivityComposer heading
    expect(getAllByText(/Current Activity/i).length).toBeGreaterThan(0); // CurrentActivityCard
    expect(getAllByText(/Incoming Activity Log/i).length).toBeGreaterThan(0); // IncomingLog
    expect(getByText(/Setup Instructions/i)).toBeTruthy(); // SetupInstructions heading
    // Sanity check: NSUserActivity mentioned by ExplainerCard
    expect(getAllByText(/NSUserActivity/).length).toBeGreaterThan(0);
  });

  it('US3: tapping Resign on CurrentActivityCard calls resignCurrent', () => {
    hookState.currentActivity = {
      activityType: 'com.example.x',
      title: 'X',
      userInfo: {},
      requiredUserInfoKeys: [],
      isEligibleForHandoff: true,
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
    } as never;
    const { getByTestId } = render(<HandoffLabScreen />);
    fireEvent.press(getByTestId('resign-btn'));
    expect(mockResignCurrent).toHaveBeenCalledTimes(1);
  });

  it('US4: when log is populated, IncomingLog renders the rows', () => {
    hookState.log = [
      {
        activityType: 'com.example.in',
        title: 'Incoming One',
        userInfo: {},
        requiredUserInfoKeys: [],
        receivedAt: new Date().toISOString(),
      },
    ];
    const { getByText, getAllByTestId } = render(<HandoffLabScreen />);
    expect(getByText(/Incoming One/)).toBeTruthy();
    expect(getAllByTestId(/incoming-row-/).length).toBe(1);
  });
});
