import React from 'react';
import { render } from '@testing-library/react-native';

import { IntentEventLog } from '@/modules/app-intents-lab/components/IntentEventLog';
import type { IntentInvocation } from '@/modules/app-intents-lab/event-log';

function makeInv(id: string, overrides: Partial<IntentInvocation> = {}): IntentInvocation {
  return {
    id,
    timestamp: 1745800000000,
    intentName: 'LogMoodIntent',
    parameters: { mood: 'happy' },
    result: 'Logged happy',
    status: 'success',
    ...overrides,
  };
}

describe('IntentEventLog', () => {
  it('renders three entries newest-first', () => {
    const log = [makeInv('3'), makeInv('2'), makeInv('1')];
    const { getByTestId } = render(<IntentEventLog log={log} />);
    expect(getByTestId('event-log-row-3')).toBeTruthy();
    expect(getByTestId('event-log-row-2')).toBeTruthy();
    expect(getByTestId('event-log-row-1')).toBeTruthy();
  });

  it('renders intent name, parameter summary, result, and time per row', () => {
    const log = [makeInv('1', { intentName: 'LogMoodIntent', result: 'Logged happy at 10:00' })];
    const { getByText } = render(<IntentEventLog log={log} />);
    expect(getByText('LogMoodIntent')).toBeTruthy();
    expect(getByText('Logged happy at 10:00')).toBeTruthy();
    // Param summary contains the JSON of the parameters
    expect(getByText(/\{"mood":"happy"\}/)).toBeTruthy();
  });

  it('failure rows pick up Status: failure accessibility label', () => {
    const log = [makeInv('1', { status: 'failure', result: 'Boom' })];
    const { getByLabelText } = render(<IntentEventLog log={log} />);
    expect(getByLabelText('Status: failure')).toBeTruthy();
  });

  it('success rows expose Status: success', () => {
    const log = [makeInv('1', { status: 'success' })];
    const { getByLabelText } = render(<IntentEventLog log={log} />);
    expect(getByLabelText('Status: success')).toBeTruthy();
  });

  it('renders an empty-state placeholder when log is empty', () => {
    const { getByText } = render(<IntentEventLog log={[]} />);
    expect(getByText('No intent invocations yet')).toBeTruthy();
  });

  it('renders all 10 entries when log has exactly 10', () => {
    const log = Array.from({ length: 10 }, (_, i) => makeInv(String(i)));
    const { getAllByText } = render(<IntentEventLog log={log} />);
    expect(getAllByText('LogMoodIntent')).toHaveLength(10);
  });

  it('does NOT independently truncate when log has 11 entries (caller is responsible)', () => {
    const log = Array.from({ length: 11 }, (_, i) => makeInv(String(i)));
    const { getAllByText } = render(<IntentEventLog log={log} />);
    expect(getAllByText('LogMoodIntent')).toHaveLength(11);
  });

  it('parameters undefined renders as "none"', () => {
    const log = [makeInv('1', { parameters: undefined })];
    const { getByText } = render(<IntentEventLog log={log} />);
    expect(getByText(/none/)).toBeTruthy();
  });
});
