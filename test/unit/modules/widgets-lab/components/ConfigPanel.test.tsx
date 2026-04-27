import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ConfigPanel } from '@/modules/widgets-lab/components/ConfigPanel';
import { DEFAULT_CONFIG, TINTS } from '@/modules/widgets-lab/widget-config';

describe('ConfigPanel', () => {
  it('renders the three controls (showcaseValue, counter, tint)', () => {
    const onPush = jest.fn();
    const { getByLabelText } = render(
      <ConfigPanel value={DEFAULT_CONFIG} onPush={onPush} pushEnabled={true} />,
    );
    expect(getByLabelText('Showcase value')).toBeTruthy();
    expect(getByLabelText('Counter')).toBeTruthy();
    expect(getByLabelText('Tint picker')).toBeTruthy();
  });

  it('exposes exactly 4 swatches in the tint picker', () => {
    const onPush = jest.fn();
    const { getAllByLabelText } = render(
      <ConfigPanel value={DEFAULT_CONFIG} onPush={onPush} pushEnabled={true} />,
    );
    const swatches = TINTS.map((t) => getAllByLabelText(`Tint ${t}`));
    expect(swatches).toHaveLength(4);
  });

  it('disables Push when the trimmed showcaseValue is empty', () => {
    const onPush = jest.fn();
    const { getByLabelText } = render(
      <ConfigPanel
        value={{ ...DEFAULT_CONFIG, showcaseValue: '   ' }}
        onPush={onPush}
        pushEnabled={true}
      />,
    );
    fireEvent.press(getByLabelText('Push to widget'));
    expect(onPush).not.toHaveBeenCalled();
  });

  it('clamps counter input to [-9999, 9999]', () => {
    const onPush = jest.fn();
    const { getByLabelText } = render(
      <ConfigPanel value={DEFAULT_CONFIG} onPush={onPush} pushEnabled={true} />,
    );
    fireEvent.changeText(getByLabelText('Counter'), '99999');
    fireEvent.press(getByLabelText('Push to widget'));
    expect(onPush).toHaveBeenCalledTimes(1);
    expect(onPush.mock.calls[0]![0].counter).toBe(9999);

    onPush.mockClear();
    fireEvent.changeText(getByLabelText('Counter'), '-50000');
    fireEvent.press(getByLabelText('Push to widget'));
    expect(onPush.mock.calls[0]![0].counter).toBe(-9999);
  });

  it('calls onPush with the validated config on press', () => {
    const onPush = jest.fn();
    const { getByLabelText } = render(
      <ConfigPanel value={DEFAULT_CONFIG} onPush={onPush} pushEnabled={true} />,
    );
    fireEvent.changeText(getByLabelText('Showcase value'), 'Hi');
    fireEvent.changeText(getByLabelText('Counter'), '7');
    fireEvent.press(getByLabelText('Tint green'));
    fireEvent.press(getByLabelText('Push to widget'));
    expect(onPush).toHaveBeenCalledTimes(1);
    expect(onPush.mock.calls[0]![0]).toMatchObject({
      showcaseValue: 'Hi',
      counter: 7,
      tint: 'green',
    });
  });

  it('does not call onPush when pushEnabled is false', () => {
    const onPush = jest.fn();
    const { getByLabelText } = render(
      <ConfigPanel value={DEFAULT_CONFIG} onPush={onPush} pushEnabled={false} />,
    );
    fireEvent.press(getByLabelText('Push to widget'));
    expect(onPush).not.toHaveBeenCalled();
  });
});
