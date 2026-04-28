/**
 * T024 + T048: TextInputArea component tests.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import TextInputArea from '@/modules/speech-synthesis-lab/components/TextInputArea';

describe('TextInputArea', () => {
  it('renders multiline TextInput controlled by value/onChangeText', () => {
    const onChangeText = jest.fn();
    const view = render(<TextInputArea value="hello" onChangeText={onChangeText} />);
    const inputs = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.accessibilityLabel === 'Text to speak',
    );
    expect(inputs.length).toBeGreaterThan(0);
    const input = inputs[0];
    expect(input.props.multiline).toBe(true);
    fireEvent.changeText(input, 'world');
    expect(onChangeText).toHaveBeenCalledWith('world');
  });

  it('does not render the highlight overlay when currentWordRange is null/omitted', () => {
    const view = render(<TextInputArea value="hello" onChangeText={jest.fn()} />);
    const overlays = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'text-input-highlight-overlay',
    );
    expect(overlays.length).toBe(0);
  });

  it('renders the highlight overlay when currentWordRange is provided', () => {
    const view = render(
      <TextInputArea
        value="The quick brown fox."
        onChangeText={jest.fn()}
        currentWordRange={{ location: 4, length: 5 }}
      />,
    );
    const overlays = view.UNSAFE_root.findAll(
      (n: any) => n.props && n.props.testID === 'text-input-highlight-overlay',
    );
    expect(overlays.length).toBeGreaterThan(0);
  });
});
