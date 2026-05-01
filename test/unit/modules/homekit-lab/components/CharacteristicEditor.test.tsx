/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import CharacteristicEditor from '@/modules/homekit-lab/components/CharacteristicEditor';
import type { CharacteristicRecord } from '@/native/homekit.types';

const BOOL: CharacteristicRecord = {
  id: 'c1',
  serviceId: 's1',
  name: 'Power',
  kind: 'bool',
  writable: true,
};

const PERCENT: CharacteristicRecord = {
  id: 'c2',
  serviceId: 's1',
  name: 'Brightness',
  kind: 'percent',
  writable: true,
};

const ENUM: CharacteristicRecord = {
  id: 'c3',
  serviceId: 's1',
  name: 'Mode',
  kind: 'enum',
  writable: true,
  options: [
    { value: 0, label: 'Off' },
    { value: 1, label: 'Heat' },
    { value: 2, label: 'Cool' },
  ],
};

const READONLY: CharacteristicRecord = {
  id: 'c4',
  serviceId: 's1',
  name: 'Battery',
  kind: 'readonly',
  writable: false,
};

describe('CharacteristicEditor', () => {
  it('renders an empty state when nothing is selected', () => {
    const { getByTestId } = render(
      <CharacteristicEditor
        characteristic={null}
        currentValue={null}
        onWrite={() => {}}
        onRead={() => {}}
      />,
    );
    expect(getByTestId('homekit-editor-empty')).toBeTruthy();
  });

  it('renders a Switch for bool characteristics and writes the new value', () => {
    const onWrite = jest.fn();
    const { getByTestId } = render(
      <CharacteristicEditor
        characteristic={BOOL}
        currentValue={false}
        onWrite={onWrite}
        onRead={() => {}}
      />,
    );
    const sw = getByTestId('homekit-editor-bool');
    expect(sw).toBeTruthy();
    fireEvent(sw, 'valueChange', true);
    expect(onWrite).toHaveBeenCalledWith(true);
  });

  it('renders five percent segments and writes their value when pressed', () => {
    const onWrite = jest.fn();
    const { getByTestId } = render(
      <CharacteristicEditor
        characteristic={PERCENT}
        currentValue={0}
        onWrite={onWrite}
        onRead={() => {}}
      />,
    );
    [0, 25, 50, 75, 100].forEach((seg) => {
      expect(getByTestId(`homekit-editor-percent-${seg}`)).toBeTruthy();
    });
    fireEvent.press(getByTestId('homekit-editor-percent-75'));
    expect(onWrite).toHaveBeenCalledWith(75);
  });

  it('renders one segment per enum option', () => {
    const onWrite = jest.fn();
    const { getByTestId } = render(
      <CharacteristicEditor
        characteristic={ENUM}
        currentValue={1}
        onWrite={onWrite}
        onRead={() => {}}
      />,
    );
    expect(getByTestId('homekit-editor-enum-0')).toBeTruthy();
    expect(getByTestId('homekit-editor-enum-1')).toBeTruthy();
    expect(getByTestId('homekit-editor-enum-2')).toBeTruthy();
    fireEvent.press(getByTestId('homekit-editor-enum-2'));
    expect(onWrite).toHaveBeenCalledWith(2);
  });

  it('renders the read-only banner when not writable', () => {
    const { getByTestId } = render(
      <CharacteristicEditor
        characteristic={READONLY}
        currentValue={42}
        onWrite={() => {}}
        onRead={() => {}}
      />,
    );
    expect(getByTestId('homekit-editor-readonly')).toBeTruthy();
  });

  it('invokes onRead when the Read CTA is pressed', () => {
    const onRead = jest.fn();
    const { getByTestId } = render(
      <CharacteristicEditor
        characteristic={BOOL}
        currentValue={null}
        onWrite={() => {}}
        onRead={onRead}
      />,
    );
    fireEvent.press(getByTestId('homekit-editor-read'));
    expect(onRead).toHaveBeenCalledTimes(1);
  });

  it('formats the displayed current value', () => {
    const { getByTestId, rerender } = render(
      <CharacteristicEditor
        characteristic={BOOL}
        currentValue={true}
        onWrite={() => {}}
        onRead={() => {}}
      />,
    );
    expect(getByTestId('homekit-editor-value').props.children).toContain('On');

    rerender(
      <CharacteristicEditor
        characteristic={PERCENT}
        currentValue={50}
        onWrite={() => {}}
        onRead={() => {}}
      />,
    );
    expect(getByTestId('homekit-editor-value').props.children).toContain('50%');
  });
});
