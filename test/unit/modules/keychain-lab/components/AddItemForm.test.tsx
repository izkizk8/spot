/**
 * @jest-environment jsdom
 *
 * Covers FR-016, US2-AS1, US2-AS2, US2-AS3, US2-AS5.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddItemForm from '@/modules/keychain-lab/components/AddItemForm';
import type { AddItemInput, KeychainResult } from '@/modules/keychain-lab/types';

describe('AddItemForm', () => {
  function setup(
    onSave: (input: AddItemInput) => Promise<KeychainResult> = jest.fn().mockResolvedValue({
      kind: 'ok',
    }),
  ) {
    const utils = render(<AddItemForm onSave={onSave} />);
    return { ...utils, onSave };
  }

  it('disables Save until both label and value are filled', () => {
    const { getByTestId, getByPlaceholderText } = setup();

    const saveButton = getByTestId('add-item-save');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(getByPlaceholderText(/label/i), 'demo');
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(getByPlaceholderText(/value/i), 'hello');
    expect(saveButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('disables Save while a save is in flight', async () => {
    const promise = Promise.resolve({ kind: 'ok' as const });
    const onSave = jest.fn(() => promise);

    const { getByTestId, getByPlaceholderText } = setup(onSave);
    fireEvent.changeText(getByPlaceholderText(/label/i), 'demo');
    fireEvent.changeText(getByPlaceholderText(/value/i), 'hello');

    const saveButton = getByTestId('add-item-save');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    await promise;
  });

  it('uses whenUnlockedThisDeviceOnly as the default accessibility class', async () => {
    const onSave = jest.fn().mockResolvedValue({ kind: 'ok' });
    const { getByTestId, getByPlaceholderText } = setup(onSave);

    fireEvent.changeText(getByPlaceholderText(/label/i), 'demo');
    fireEvent.changeText(getByPlaceholderText(/value/i), 'hello');
    fireEvent.press(getByTestId('add-item-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          accessibilityClass: 'whenUnlockedThisDeviceOnly',
        }),
      );
    });
  });

  it('toggles the biometry switch and includes the value in the payload', async () => {
    const onSave = jest.fn().mockResolvedValue({ kind: 'ok' });
    const { getByTestId, getByPlaceholderText } = setup(onSave);

    fireEvent.changeText(getByPlaceholderText(/label/i), 'demo');
    fireEvent.changeText(getByPlaceholderText(/value/i), 'hello');

    const biometrySwitch = getByTestId('add-item-biometry');
    fireEvent(biometrySwitch, 'valueChange', true);

    fireEvent.press(getByTestId('add-item-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ biometryRequired: true }));
    });
  });

  it('invokes onSave with a typed AddItemInput (label trimmed)', async () => {
    const onSave = jest.fn().mockResolvedValue({ kind: 'ok' });
    const { getByTestId, getByPlaceholderText } = setup(onSave);

    fireEvent.changeText(getByPlaceholderText(/label/i), '  demo  ');
    fireEvent.changeText(getByPlaceholderText(/value/i), 'hello');
    fireEvent.press(getByTestId('add-item-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    const input = onSave.mock.calls[0][0] as AddItemInput;
    expect(input.label).toBe('demo');
    expect(input.value).toBe('hello');
    expect(input.accessibilityClass).toBe('whenUnlockedThisDeviceOnly');
    expect(input.biometryRequired).toBe(false);
  });

  it('resets the form after a successful save (inputs cleared, biometry off)', async () => {
    const onSave = jest.fn().mockResolvedValue({ kind: 'ok' });
    const { getByTestId, getByPlaceholderText } = setup(onSave);

    const labelInput = getByPlaceholderText(/label/i);
    const valueInput = getByPlaceholderText(/value/i);
    const biometrySwitch = getByTestId('add-item-biometry');

    fireEvent.changeText(labelInput, 'demo');
    fireEvent.changeText(valueInput, 'hello');
    fireEvent(biometrySwitch, 'valueChange', true);
    fireEvent.press(getByTestId('add-item-save'));

    await waitFor(() => {
      expect(labelInput.props.value).toBe('');
      expect(valueInput.props.value).toBe('');
      expect(biometrySwitch.props.value).toBe(false);
    });
  });

  it('does not reset the form when save returns a non-ok result', async () => {
    const onSave = jest.fn().mockResolvedValue({
      kind: 'error',
      message: 'errSecDuplicateItem',
    } satisfies KeychainResult);
    const { getByTestId, getByPlaceholderText } = setup(onSave);

    const labelInput = getByPlaceholderText(/label/i);
    const valueInput = getByPlaceholderText(/value/i);

    fireEvent.changeText(labelInput, 'demo');
    fireEvent.changeText(valueInput, 'hello');
    fireEvent.press(getByTestId('add-item-save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
    expect(labelInput.props.value).toBe('demo');
    expect(valueInput.props.value).toBe('hello');
  });
});
