import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ScheduleAppRefreshCard from '@/modules/background-tasks-lab/components/ScheduleAppRefreshCard';
import type { TaskRunRecord } from '@/native/background-tasks.types';

function makeRecord(): TaskRunRecord {
  return {
    id: 'a',
    type: 'refresh',
    scheduledAt: 1700000000000,
    startedAt: 1700000000100,
    endedAt: 1700000000200,
    durationMs: 100,
    status: 'completed',
  };
}

describe('ScheduleAppRefreshCard', () => {
  it('renders CTA label "Schedule App Refresh" (FR-020)', () => {
    render(<ScheduleAppRefreshCard status='idle' lastRun={null} onSchedule={() => undefined} />);
    expect(screen.getByText('Schedule App Refresh')).toBeTruthy();
  });

  it('pressing CTA invokes onSchedule exactly once (FR-021)', () => {
    const onSchedule = jest.fn();
    render(<ScheduleAppRefreshCard status='idle' lastRun={null} onSchedule={onSchedule} />);
    fireEvent.press(screen.getByText('Schedule App Refresh'));
    expect(onSchedule).toHaveBeenCalledTimes(1);
  });

  it('renders empty-state dash when lastRun is null (FR-023)', () => {
    render(<ScheduleAppRefreshCard status='idle' lastRun={null} onSchedule={() => undefined} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('renders all status pill values (FR-022)', () => {
    const statuses = ['idle', 'scheduled', 'running', 'completed', 'expired', 'canceled'] as const;
    for (const s of statuses) {
      const { unmount } = render(
        <ScheduleAppRefreshCard status={s} lastRun={null} onSchedule={() => undefined} />,
      );
      // status label rendered through STATUS_LABEL (capitalized)
      expect(screen.queryByText(/Idle|Scheduled|Running|Completed|Expired|Canceled/)).toBeTruthy();
      unmount();
    }
  });

  it('renders a duration value when lastRun has durationMs', () => {
    render(
      <ScheduleAppRefreshCard
        status='completed'
        lastRun={makeRecord()}
        onSchedule={() => undefined}
      />,
    );
    expect(screen.getByText('100 ms')).toBeTruthy();
  });

  it('renders a localised "Last run" timestamp when lastRun has endedAt', () => {
    render(
      <ScheduleAppRefreshCard
        status='completed'
        lastRun={makeRecord()}
        onSchedule={() => undefined}
      />,
    );
    // Just confirm a non-dash value rendered for the timestamp row
    const dashes = screen.queryAllByText('—');
    // No '—' should appear because both endedAt and durationMs are populated
    expect(dashes.length).toBe(0);
  });
});
