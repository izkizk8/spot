/**
 * T055: PersonalVoiceCard component tests.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import PersonalVoiceCard from '@/modules/speech-synthesis-lab/components/PersonalVoiceCard';

describe('PersonalVoiceCard', () => {
  it('returns null when status === unsupported', () => {
    const view = render(
      <PersonalVoiceCard
        status='unsupported'
        onRequest={jest.fn(() => Promise.resolve('unsupported'))}
      />,
    );
    expect(view.toJSON()).toBeNull();
  });

  it('renders the status label for notDetermined and the Request button', () => {
    const view = render(
      <PersonalVoiceCard
        status='notDetermined'
        onRequest={jest.fn(() => Promise.resolve('notDetermined'))}
      />,
    );
    expect(view.queryByText('notDetermined')).toBeTruthy();
    const btn = view.UNSAFE_root.findAll(
      (n: any) =>
        n.props &&
        n.props.accessibilityRole === 'button' &&
        /Request Personal Voice authorization/.test(String(n.props.accessibilityLabel ?? '')),
    );
    expect(btn.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render the Request button when status === authorized', () => {
    const view = render(
      <PersonalVoiceCard
        status='authorized'
        onRequest={jest.fn(() => Promise.resolve('authorized'))}
      />,
    );
    expect(view.queryByText('authorized')).toBeTruthy();
    const btn = view.UNSAFE_root.findAll(
      (n: any) =>
        n.props &&
        n.props.accessibilityRole === 'button' &&
        /Request Personal Voice authorization/.test(String(n.props.accessibilityLabel ?? '')),
    );
    expect(btn.length).toBe(0);
  });

  it('tapping Request invokes onRequest exactly once', async () => {
    const onRequest = jest.fn(() => Promise.resolve('authorized' as const));
    const view = render(<PersonalVoiceCard status='notDetermined' onRequest={onRequest} />);
    const btn = view.UNSAFE_root.findAll(
      (n: any) =>
        n.props &&
        n.props.accessibilityRole === 'button' &&
        /Request Personal Voice authorization/.test(String(n.props.accessibilityLabel ?? '')),
    )[0];
    await act(async () => {
      fireEvent.press(btn);
    });
    expect(onRequest).toHaveBeenCalledTimes(1);
  });
});
