// FALLBACK: research §5 — local-copy variant of the panel; tests assert
// per-control render + push behaviour rather than 014 composition.
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { StandByConfigPanel } from '@/modules/standby-lab/components/StandByConfigPanel';
import { DEFAULT_STANDBY_CONFIG } from '@/modules/standby-lab/standby-config';

describe('StandByConfigPanel (standby-lab)', () => {
  it('renders showcase / counter / tint controls and the rendering mode picker', () => {
    const { getByLabelText, getAllByLabelText } = render(
      <StandByConfigPanel value={DEFAULT_STANDBY_CONFIG} onPush={() => {}} pushEnabled={true} />,
    );
    expect(getByLabelText(/showcase/i)).toBeTruthy();
    expect(getByLabelText(/counter/i)).toBeTruthy();
    expect(getAllByLabelText(/tint/i).length).toBeGreaterThan(0);
    expect(getByLabelText(/Rendering mode Full Color/i)).toBeTruthy();
    expect(getByLabelText(/Rendering mode Accented/i)).toBeTruthy();
    expect(getByLabelText(/Rendering mode Vibrant/i)).toBeTruthy();
  });

  it('renders the Push button below the rendering mode picker', () => {
    const { getByLabelText } = render(
      <StandByConfigPanel value={DEFAULT_STANDBY_CONFIG} onPush={() => {}} pushEnabled={true} />,
    );
    expect(getByLabelText(/Push to StandBy widget/i)).toBeTruthy();
  });

  it('onPush called with validated draft including mode', async () => {
    const onPush = jest.fn();
    const { getByLabelText } = render(
      <StandByConfigPanel value={DEFAULT_STANDBY_CONFIG} onPush={onPush} pushEnabled={true} />,
    );
    fireEvent.changeText(getByLabelText('Showcase value'), 'Hi');
    fireEvent.changeText(getByLabelText('Counter'), '7');
    fireEvent.press(getByLabelText(/Tint orange/i));
    fireEvent.press(getByLabelText(/Rendering mode Vibrant/i));
    fireEvent.press(getByLabelText(/Push to StandBy widget/i));
    // wait microtask
    await Promise.resolve();
    await Promise.resolve();
    expect(onPush).toHaveBeenCalledWith(
      expect.objectContaining({
        showcaseValue: 'Hi',
        counter: 7,
        tint: 'orange',
        mode: 'vibrant',
      }),
    );
  });

  it('trims showcaseValue and disables Push when empty', () => {
    const onPush = jest.fn();
    const { getByLabelText } = render(
      <StandByConfigPanel value={DEFAULT_STANDBY_CONFIG} onPush={onPush} pushEnabled={true} />,
    );
    fireEvent.changeText(getByLabelText('Showcase value'), '   ');
    const pushBtn = getByLabelText(/Push to StandBy widget/i);
    expect(pushBtn.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(pushBtn);
    expect(onPush).not.toHaveBeenCalled();
  });

  it('disabledPushReason is rendered when pushEnabled=false and reason set', () => {
    const { getByText, getByLabelText } = render(
      <StandByConfigPanel
        value={DEFAULT_STANDBY_CONFIG}
        onPush={() => {}}
        pushEnabled={false}
        disabledPushReason="StandBy push requires iOS 17+"
      />,
    );
    expect(getByText(/StandBy push requires iOS 17/)).toBeTruthy();
    const pushBtn = getByLabelText(/Push to StandBy widget/i);
    expect(pushBtn.props.accessibilityState?.disabled).toBe(true);
  });
});
