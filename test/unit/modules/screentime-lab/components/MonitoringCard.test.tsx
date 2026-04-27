/**
 * @file T029 — MonitoringCard test.
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
import {
  MonitoringCard,
  DEFAULT_SCHEDULE,
  DEFAULT_SCHEDULE_LABEL,
} from '@/modules/screentime-lab/components/MonitoringCard';
import { EntitlementMissingError } from '@/native/screentime.types';

describe('MonitoringCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Start / Stop buttons + Inactive pill + default schedule', () => {
    const { getByLabelText, getByText } = render(
      <MonitoringCard
        monitoringActive={false}
        selectionSummary={null}
        onStarted={jest.fn()}
        onStopped={jest.fn()}
        onError={jest.fn()}
      />,
    );
    expect(getByLabelText('Start daily monitor')).toBeTruthy();
    expect(getByLabelText('Stop monitor')).toBeTruthy();
    expect(getByText('Inactive')).toBeTruthy();
    expect(getByText(new RegExp(DEFAULT_SCHEDULE_LABEL.replace('–', '.')))).toBeTruthy();
  });

  it('on Start success, dispatches onStarted with the default schedule', async () => {
    (bridge.startMonitoring as jest.Mock).mockResolvedValue(undefined);
    const onStarted = jest.fn();
    const { getByLabelText } = render(
      <MonitoringCard
        monitoringActive={false}
        selectionSummary={{
          applicationCount: 1,
          categoryCount: 0,
          webDomainCount: 0,
          rawSelectionToken: 'tok',
        }}
        onStarted={onStarted}
        onStopped={jest.fn()}
        onError={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Start daily monitor'));
    });
    expect(bridge.startMonitoring).toHaveBeenCalledWith('tok', DEFAULT_SCHEDULE);
    expect(onStarted).toHaveBeenCalledWith(DEFAULT_SCHEDULE);
  });

  it('on rejection, surfaces a status and dispatches onError', async () => {
    (bridge.startMonitoring as jest.Mock).mockRejectedValue(new EntitlementMissingError());
    const onError = jest.fn();
    const { getByLabelText, findByLabelText } = render(
      <MonitoringCard
        monitoringActive={false}
        selectionSummary={null}
        onStarted={jest.fn()}
        onStopped={jest.fn()}
        onError={onError}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Start daily monitor'));
    });
    const status = await findByLabelText('Monitoring status text');
    expect(JSON.stringify(status.props)).toMatch(/Entitlement required/i);
    expect(onError).toHaveBeenCalled();
  });

  it('on Stop success, dispatches onStopped', async () => {
    (bridge.stopMonitoring as jest.Mock).mockResolvedValue(undefined);
    const onStopped = jest.fn();
    const { getByLabelText } = render(
      <MonitoringCard
        monitoringActive={true}
        selectionSummary={null}
        onStarted={jest.fn()}
        onStopped={onStopped}
        onError={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Stop monitor'));
    });
    expect(bridge.stopMonitoring).toHaveBeenCalled();
    expect(onStopped).toHaveBeenCalled();
  });

  it('disabled prop blocks bridge invocations', async () => {
    const { getByLabelText } = render(
      <MonitoringCard
        monitoringActive={false}
        selectionSummary={null}
        onStarted={jest.fn()}
        onStopped={jest.fn()}
        onError={jest.fn()}
        disabled
      />,
    );
    await act(async () => {
      fireEvent.press(getByLabelText('Start daily monitor'));
    });
    await waitFor(() => {
      expect(bridge.startMonitoring).not.toHaveBeenCalled();
    });
  });
});
