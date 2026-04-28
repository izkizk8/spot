import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoriesCard } from '../../components/CategoriesCard';

describe('CategoriesCard', () => {
  it('renders 3 categories', () => {
    const { getByText } = render(
      <CategoriesCard lastReceived={null} onInvokeAction={jest.fn()} />,
    );
    expect(getByText(/yes-no/i)).toBeTruthy();
    expect(getByText(/snooze-done/i)).toBeTruthy();
    expect(getByText(/reply-text/i)).toBeTruthy();
  });

  it('shows text-input flag for reply-text only', () => {
    const { getByText, queryByText } = render(
      <CategoriesCard lastReceived={null} onInvokeAction={jest.fn()} />,
    );
    // reply-text should have text input indicator
    expect(getByText(/text input/i)).toBeTruthy();
  });

  it('disables action replay when lastReceived is null', () => {
    const { getByText } = render(
      <CategoriesCard lastReceived={null} onInvokeAction={jest.fn()} />,
    );
    const button = getByText(/open last/i);
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables action replay when lastReceived is set', () => {
    const { getByText } = render(
      <CategoriesCard
        lastReceived={{ identifier: 'n1', categoryId: 'yes-no' }}
        onInvokeAction={jest.fn()}
      />,
    );
    const button = getByText(/open last/i);
    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  it('calls onInvokeAction when action tapped', () => {
    const onInvokeAction = jest.fn();
    const { getByText } = render(
      <CategoriesCard
        lastReceived={{ identifier: 'n1', categoryId: 'yes-no' }}
        onInvokeAction={onInvokeAction}
      />,
    );
    fireEvent.press(getByText(/open last/i));
    fireEvent.press(getByText(/yes/i));
    expect(onInvokeAction).toHaveBeenCalledWith('yes', undefined);
  });
});
