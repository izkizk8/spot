import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import RunHistoryList from '@/modules/background-tasks-lab/components/RunHistoryList';
import type { TaskRunRecord } from '@/native/background-tasks.types';

function makeRecord(id: string): TaskRunRecord {
  return {
    id,
    type: 'refresh',
    scheduledAt: 1700000000000,
    startedAt: 1700000000100,
    endedAt: 1700000000200,
    durationMs: 100,
    status: 'completed',
  };
}

describe('RunHistoryList', () => {
  it('renders empty-state copy when history is empty (FR-043)', () => {
    render(<RunHistoryList history={[]} error={null} onClear={() => undefined} />);
    expect(screen.getByText('No background runs recorded yet')).toBeTruthy();
  });

  it('renders 1 record', () => {
    const r = makeRecord('a');
    render(<RunHistoryList history={[r]} error={null} onClear={() => undefined} />);
    expect(screen.getByText('a')).toBeTruthy();
  });

  it('renders 5 records newest-first', () => {
    const records = ['e', 'd', 'c', 'b', 'a'].map(makeRecord);
    render(<RunHistoryList history={records} error={null} onClear={() => undefined} />);
    // first id rendered in DOM order should be 'e'
    expect(screen.getByText('e')).toBeTruthy();
    expect(screen.getByText('a')).toBeTruthy();
  });

  it('clips overflow to 20 entries (defensive)', () => {
    const records: TaskRunRecord[] = [];
    for (let i = 0; i < 21; i++) records.push(makeRecord(`r${i}`));
    render(<RunHistoryList history={records} error={null} onClear={() => undefined} />);
    expect(screen.queryByText('r20')).toBeNull();
    expect(screen.getByText('r0')).toBeTruthy();
  });

  it('renders a "Clear history" affordance and calls onClear once (FR-043)', () => {
    const onClear = jest.fn();
    render(<RunHistoryList history={[]} error={null} onClear={onClear} />);
    fireEvent.press(screen.getByText('Clear history'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('renders an inline error indicator when error is set (FR-044 / US3 AS3)', () => {
    render(
      <RunHistoryList history={[]} error={new Error('storage broken')} onClear={() => undefined} />,
    );
    expect(screen.getByLabelText('history error')).toBeTruthy();
  });

  it('each row shows id, type, scheduledAt, startedAt, endedAt, durationMs, status (FR-042)', () => {
    const r = makeRecord('a');
    render(<RunHistoryList history={[r]} error={null} onClear={() => undefined} />);
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText(/refresh/)).toBeTruthy();
    expect(screen.getByText(/completed/)).toBeTruthy();
    expect(screen.getByText(/scheduled:/)).toBeTruthy();
    expect(screen.getByText(/started:/)).toBeTruthy();
    expect(screen.getByText(/ended:/)).toBeTruthy();
    expect(screen.getByText(/100 ms/)).toBeTruthy();
  });
});
