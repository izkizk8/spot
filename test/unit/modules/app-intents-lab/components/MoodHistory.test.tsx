import React from 'react';
import { render } from '@testing-library/react-native';

import { MoodHistory } from '@/modules/app-intents-lab/components/MoodHistory';
import type { MoodRecord } from '@/modules/app-intents-lab/mood-store';

function makeRec(timestamp: number, mood: MoodRecord['mood'] = 'happy'): MoodRecord {
  return { mood, timestamp };
}

describe('MoodHistory', () => {
  it('renders entries newest-first as passed', () => {
    const r1 = makeRec(3000, 'happy');
    const r2 = makeRec(2000, 'neutral');
    const r3 = makeRec(1000, 'sad');
    const { getByTestId } = render(<MoodHistory history={[r1, r2, r3]} />);
    expect(getByTestId('mood-history-row-0')).toBeTruthy();
    expect(getByTestId('mood-history-row-1')).toBeTruthy();
    expect(getByTestId('mood-history-row-2')).toBeTruthy();
  });

  it('shows mood label title-cased and a formatted timestamp', () => {
    const ts = new Date(2024, 4, 1, 9, 30, 0).getTime();
    const { getByText } = render(<MoodHistory history={[makeRec(ts, 'sad')]} />);
    expect(getByText('Sad')).toBeTruthy();
    expect(getByText('May 1, 09:30')).toBeTruthy();
  });

  it('renders an empty-state row when history is empty', () => {
    const { getByText } = render(<MoodHistory history={[]} />);
    expect(getByText('No moods logged yet')).toBeTruthy();
  });

  it('renders all entries it receives (no internal cap)', () => {
    const history = Array.from({ length: 22 }, (_, i) => makeRec(i + 1));
    const { getAllByText } = render(<MoodHistory history={history} />);
    expect(getAllByText('Happy')).toHaveLength(22);
  });
});
