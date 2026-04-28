/**
 * Test suite for AuthOptionsPanel component.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AuthOptionsPanel, {
  type AuthOptionsValue,
} from '@/modules/local-auth-lab/components/AuthOptionsPanel';

const baseValue: AuthOptionsValue = {
  promptMessage: 'p',
  fallbackLabel: 'f',
  cancelLabel: 'c',
  disableDeviceFallback: false,
};

describe('AuthOptionsPanel', () => {
  it('renders all controls', () => {
    const { getByTestId } = render(
      <AuthOptionsPanel value={baseValue} onChange={() => {}} onAuthenticate={() => {}} />,
    );
    expect(getByTestId('localauth-options-disablefallback')).toBeTruthy();
    expect(getByTestId('localauth-options-prompt')).toBeTruthy();
    expect(getByTestId('localauth-options-fallback')).toBeTruthy();
    expect(getByTestId('localauth-options-cancel')).toBeTruthy();
    expect(getByTestId('localauth-authenticate')).toBeTruthy();
  });

  it('forwards switch and text changes via onChange', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <AuthOptionsPanel value={baseValue} onChange={onChange} onAuthenticate={() => {}} />,
    );

    fireEvent(getByTestId('localauth-options-disablefallback'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ disableDeviceFallback: true }));

    fireEvent.changeText(getByTestId('localauth-options-prompt'), 'hello');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ promptMessage: 'hello' }));
  });

  it('invokes onAuthenticate when the button is pressed', () => {
    const onAuthenticate = jest.fn();
    const { getByTestId } = render(
      <AuthOptionsPanel value={baseValue} onChange={() => {}} onAuthenticate={onAuthenticate} />,
    );
    fireEvent.press(getByTestId('localauth-authenticate'));
    expect(onAuthenticate).toHaveBeenCalledTimes(1);
  });

  it('disables the button when disabled', () => {
    const onAuthenticate = jest.fn();
    const { getByTestId } = render(
      <AuthOptionsPanel
        value={baseValue}
        onChange={() => {}}
        onAuthenticate={onAuthenticate}
        disabled
      />,
    );
    fireEvent.press(getByTestId('localauth-authenticate'));
    expect(onAuthenticate).not.toHaveBeenCalled();
  });
});
