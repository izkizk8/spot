/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import ParticipantsList from '@/modules/shareplay-lab/components/ParticipantsList';

describe('ParticipantsList', () => {
  it('renders the empty state when there are no participants', () => {
    const { getByTestId } = render(<ParticipantsList participants={[]} />);
    expect(getByTestId('shareplay-participants-list')).toBeTruthy();
    expect(getByTestId('shareplay-participants-empty')).toBeTruthy();
  });

  it('renders one row per participant', () => {
    const { getByTestId, queryByTestId } = render(
      <ParticipantsList
        participants={[
          { id: 'p1', displayName: 'Alice' },
          { id: 'p2', displayName: null },
        ]}
      />,
    );
    expect(getByTestId('shareplay-participant-p1')).toBeTruthy();
    expect(getByTestId('shareplay-participant-p2')).toBeTruthy();
    expect(queryByTestId('shareplay-participants-empty')).toBeNull();
  });

  it('falls back to the participant id when displayName is null', () => {
    const { getByTestId } = render(
      <ParticipantsList participants={[{ id: 'pid-x', displayName: null }]} />,
    );
    const node = getByTestId('shareplay-participant-pid-x');
    const text = Array.isArray(node.props.children)
      ? node.props.children.join('')
      : String(node.props.children);
    expect(text).toMatch(/pid-x/);
  });
});
