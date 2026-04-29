import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ScheduleProcessingCard from '@/modules/background-tasks-lab/components/ScheduleProcessingCard';
import type { TaskRunRecord } from '@/native/background-tasks.types';

function makeRecord(): TaskRunRecord {
  return {
    id: 'p',
    type: 'processing',
    scheduledAt: 1700000000000,
    startedAt: 1700000000500,
    endedAt: 1700000005500,
    durationMs: 5000,
    status: 'completed',
  };
}

describe('ScheduleProcessingCard', () => {
  it('renders CTA label "Schedule Processing" (FR-030)', () => {
    render(
      <ScheduleProcessingCard status="idle" lastRun={null} onSchedule={() => undefined} />,
    );
    expect(screen.getByText('Schedule Processing')).toBeTruthy();
  });

  it('pressing CTA invokes onSchedule once (FR-031)', () => {
    const onSchedule = jest.fn();
    render(<ScheduleProcessingCard status="idle" lastRun={null} onSchedule={onSchedule} />);
    fireEvent.press(screen.getByText('Schedule Processing'));
    expect(onSchedule).toHaveBeenCalledTimes(1);
  });

  it('renders both read-only requirement indicators (FR-032)', () => {
    render(
      <ScheduleProcessingCard status="idle" lastRun={null} onSchedule={() => undefined} />,
    );
    expect(screen.getByLabelText('requires external power')).toBeTruthy();
    expect(screen.getByLabelText('requires network connectivity')).toBeTruthy();
  });

  it('requirement indicators are not pressable (read-only)', () => {
    render(
      <ScheduleProcessingCard status="idle" lastRun={null} onSchedule={() => undefined} />,
    );
    const power = screen.getByLabelText('requires external power');
    expect(power.props.onPress).toBeUndefined();
  });

  it('renders status pill (FR-033)', () => {
    render(
      <ScheduleProcessingCard status="scheduled" lastRun={null} onSchedule={() => undefined} />,
    );
    expect(screen.getByText('Scheduled')).toBeTruthy();
  });

  it('renders duration when lastRun is provided (FR-033)', () => {
    render(
      <ScheduleProcessingCard
        status="completed"
        lastRun={makeRecord()}
        onSchedule={() => undefined}
      />,
    );
    expect(screen.getByText('5000 ms')).toBeTruthy();
  });
});
