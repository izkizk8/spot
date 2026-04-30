/**
 * Unit tests: ActivityComposer (T027 / US2).
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockSetCurrent = jest.fn().mockResolvedValue(undefined);

jest.mock('@/modules/handoff-lab/hooks/useHandoffActivity', () => ({
  useHandoffActivity: () => ({
    currentActivity: null,
    log: [],
    isAvailable: true,
    setCurrent: mockSetCurrent,
    resignCurrent: jest.fn().mockResolvedValue(undefined),
    getCurrent: jest.fn().mockResolvedValue(null),
  }),
}));

import ActivityComposer, {
  composerStateToDefinition,
} from '@/modules/handoff-lab/components/ActivityComposer';
import { HANDOFF_DEMO_ACTIVITY_TYPE } from '@/modules/handoff-lab/activity-types';

describe('composerStateToDefinition', () => {
  const baseState = {
    activityType: HANDOFF_DEMO_ACTIVITY_TYPE,
    title: 'Handoff demo activity',
    webpageURL: '',
    userInfoRows: [{ key: 'foo', value: 'bar' }],
    requiredKeys: { foo: false },
    isEligibleForHandoff: true,
    isEligibleForSearch: true,
    isEligibleForPrediction: true,
    errors: {},
  };

  it('returns ActivityDefinition for a valid state', () => {
    const def = composerStateToDefinition(baseState);
    expect(def).not.toBeNull();
    expect(def?.activityType).toBe(HANDOFF_DEMO_ACTIVITY_TYPE);
    expect(def?.userInfo).toEqual({ foo: 'bar' });
    expect(def?.requiredUserInfoKeys).toEqual([]);
  });

  it('returns null when activityType is empty', () => {
    expect(
      composerStateToDefinition({ ...baseState, errors: { activityType: 'required' } }),
    ).toBeNull();
  });

  it('serialises requiredKeys checked entries as sorted array', () => {
    const def = composerStateToDefinition({
      ...baseState,
      userInfoRows: [
        { key: 'b', value: '2' },
        { key: 'a', value: '1' },
      ],
      requiredKeys: { a: true, b: true },
    });
    expect(def?.requiredUserInfoKeys).toEqual(['a', 'b']);
  });

  it('omits webpageURL when empty', () => {
    const def = composerStateToDefinition(baseState);
    expect(def?.webpageURL).toBeUndefined();
  });
});

describe('ActivityComposer', () => {
  beforeEach(() => {
    mockSetCurrent.mockClear();
  });

  it('renders defaults: HANDOFF_DEMO_ACTIVITY_TYPE, default title, all flags true', () => {
    const { getByDisplayValue } = render(<ActivityComposer />);
    expect(getByDisplayValue(HANDOFF_DEMO_ACTIVITY_TYPE)).toBeTruthy();
    expect(getByDisplayValue('Handoff demo activity')).toBeTruthy();
  });

  it('"Become current" button is enabled by default (valid initial state)', () => {
    const { getByTestId } = render(<ActivityComposer />);
    const btn = getByTestId('become-current-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });

  it('disables "Become current" when activityType is cleared', () => {
    const { getByDisplayValue, getByTestId } = render(<ActivityComposer />);
    fireEvent.changeText(getByDisplayValue(HANDOFF_DEMO_ACTIVITY_TYPE), '');
    const btn = getByTestId('become-current-btn');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows error when activityType has no dot', () => {
    const { getByDisplayValue, getByText } = render(<ActivityComposer />);
    fireEvent.changeText(getByDisplayValue(HANDOFF_DEMO_ACTIVITY_TYPE), 'invalid');
    expect(getByText(/reverse-DNS/i)).toBeTruthy();
  });

  it('shows error when activityType has invalid characters', () => {
    const { getByDisplayValue, getByText } = render(<ActivityComposer />);
    fireEvent.changeText(getByDisplayValue(HANDOFF_DEMO_ACTIVITY_TYPE), 'foo bar.baz');
    expect(getByText(/reverse-DNS/i)).toBeTruthy();
  });

  it('shows error for invalid webpageURL', () => {
    const { getByPlaceholderText, getByText } = render(<ActivityComposer />);
    fireEvent.changeText(getByPlaceholderText(/https:/i), 'not a url');
    expect(getByText(/valid URL|http/i)).toBeTruthy();
  });

  it('rejects ftp:// scheme', () => {
    const { getByPlaceholderText, queryByText } = render(<ActivityComposer />);
    fireEvent.changeText(getByPlaceholderText(/https:/i), 'ftp://example.com');
    // Either "must use http or https" (URL parsed but bad scheme)
    // or "must be a valid URL" (some envs treat ftp as invalid).
    const errorNode = queryByText(/must use http or https/i) ?? queryByText(/must be a valid URL/i);
    expect(errorNode).toBeTruthy();
  });

  it('calls setCurrent once with the deserialised ActivityDefinition on submit', () => {
    const { getByTestId } = render(<ActivityComposer />);
    fireEvent.press(getByTestId('become-current-btn'));
    expect(mockSetCurrent).toHaveBeenCalledTimes(1);
    const arg = mockSetCurrent.mock.calls[0][0];
    expect(arg.activityType).toBe(HANDOFF_DEMO_ACTIVITY_TYPE);
    expect(arg.title).toBe('Handoff demo activity');
    expect(arg.isEligibleForHandoff).toBe(true);
    expect(arg.isEligibleForSearch).toBe(true);
    expect(arg.isEligibleForPrediction).toBe(true);
  });
});
