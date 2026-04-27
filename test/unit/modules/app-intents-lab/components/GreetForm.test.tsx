import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { GreetForm } from '@/modules/app-intents-lab/components/GreetForm';

describe('GreetForm', () => {
  it('Greet button is disabled when value is empty', () => {
    const { getByLabelText } = render(
      <GreetForm value="" onChange={() => {}} onGreet={() => {}} />,
    );
    const btn = getByLabelText('Greet user');
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('Greet button is disabled when value is whitespace only', () => {
    const { getByLabelText } = render(
      <GreetForm value="   " onChange={() => {}} onGreet={() => {}} />,
    );
    expect(getByLabelText('Greet user').props.accessibilityState.disabled).toBe(true);
  });

  it('Greet button enabled when value has non-whitespace content', () => {
    const { getByLabelText } = render(
      <GreetForm value="  Ada  " onChange={() => {}} onGreet={() => {}} />,
    );
    expect(getByLabelText('Greet user').props.accessibilityState.disabled).toBe(false);
  });

  it('pressing Greet emits the trimmed name', () => {
    const onGreet = jest.fn();
    const { getByLabelText } = render(
      <GreetForm value="  Ada  " onChange={() => {}} onGreet={onGreet} />,
    );
    fireEvent.press(getByLabelText('Greet user'));
    expect(onGreet).toHaveBeenCalledWith('Ada');
  });

  it('typing in the field fires onChange with the typed string', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <GreetForm value="" onChange={onChange} onGreet={() => {}} />,
    );
    const input = getByLabelText('Name');
    fireEvent.changeText(input, 'Mae');
    expect(onChange).toHaveBeenCalledWith('Mae');
  });

  it('pressing Greet on disabled state does not invoke onGreet', () => {
    const onGreet = jest.fn();
    const { getByLabelText } = render(<GreetForm value="" onChange={() => {}} onGreet={onGreet} />);
    fireEvent.press(getByLabelText('Greet user'));
    expect(onGreet).not.toHaveBeenCalled();
  });

  it('honours custom greetLabel', () => {
    const { getByLabelText } = render(
      <GreetForm value="x" onChange={() => {}} onGreet={() => {}} greetLabel="Say hello" />,
    );
    expect(getByLabelText('Say hello')).toBeTruthy();
  });
});
