/**
 * @file T027 — ActivityPickerCard test.
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@/native/screentime', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => false),
    entitlementsAvailable: jest.fn(async () => false),
    requestAuthorization: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    pickActivity: jest.fn(),
    applyShielding: jest.fn(),
    clearShielding: jest.fn(),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  },
}));

import bridge from '@/native/screentime';
import { ActivityPickerCard } from '@/modules/screentime-lab/components/ActivityPickerCard';
import { EntitlementMissingError } from '@/native/screentime.types';

describe('ActivityPickerCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty-state copy when selection is null', () => {
    const { getByLabelText } = render(
      <ActivityPickerCard
        selectionSummary={null}
        onPicked={jest.fn()}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    const summary = getByLabelText('Activity selection summary');
    expect(JSON.stringify(summary.props)).toMatch(/No selection yet/i);
  });

  it('renders the N apps / N categories / N web domains summary when present', () => {
    const summary = {
      applicationCount: 3,
      categoryCount: 2,
      webDomainCount: 1,
      rawSelectionToken: 'tok',
    };
    const { getByLabelText } = render(
      <ActivityPickerCard
        selectionSummary={summary}
        onPicked={jest.fn()}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    const node = getByLabelText('Activity selection summary');
    expect(JSON.stringify(node.props)).toMatch(/3 apps \/ 2 categories \/ 1 web domains/);
  });

  it('on Pick press, calls bridge.pickActivity and dispatches onPicked on success', async () => {
    const summary = {
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
      rawSelectionToken: 'tok',
    };
    (bridge.pickActivity as jest.Mock).mockResolvedValue(summary);
    const onPicked = jest.fn();
    const { getByLabelText } = render(
      <ActivityPickerCard
        selectionSummary={null}
        onPicked={onPicked}
        onCleared={jest.fn()}
        onError={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Pick apps & categories'));
    });
    expect(bridge.pickActivity).toHaveBeenCalled();
    expect(onPicked).toHaveBeenCalledWith(summary);
  });

  it('on rejection, surfaces a status message and dispatches onError', async () => {
    (bridge.pickActivity as jest.Mock).mockRejectedValue(new EntitlementMissingError());
    const onError = jest.fn();
    const { getByLabelText, findByLabelText } = render(
      <ActivityPickerCard
        selectionSummary={null}
        onPicked={jest.fn()}
        onCleared={jest.fn()}
        onError={onError}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Pick apps & categories'));
    });
    const status = await findByLabelText('Activity status text');
    expect(JSON.stringify(status.props)).toMatch(/Entitlement required/i);
    expect(onError).toHaveBeenCalled();
  });

  it('Clear selection button is disabled when selection is null', async () => {
    const onCleared = jest.fn();
    const { getByLabelText } = render(
      <ActivityPickerCard
        selectionSummary={null}
        onPicked={jest.fn()}
        onCleared={onCleared}
        onError={jest.fn()}
      />,
    );
    const clearBtn = getByLabelText('Clear selection');
    expect(clearBtn.props.accessibilityState?.disabled).toBe(true);
    await act(async () => {
      fireEvent.press(clearBtn);
    });
    await waitFor(() => {
      expect(onCleared).not.toHaveBeenCalled();
    });
  });

  it('Clear selection button calls onCleared when a selection exists', async () => {
    const onCleared = jest.fn();
    const summary = {
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
      rawSelectionToken: 'tok',
    };
    const { getByLabelText } = render(
      <ActivityPickerCard
        selectionSummary={summary}
        onPicked={jest.fn()}
        onCleared={onCleared}
        onError={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Clear selection'));
    });
    expect(onCleared).toHaveBeenCalled();
  });
});
