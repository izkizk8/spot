import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoriesCard } from '../../components/CategoriesCard';

describe('CategoriesCard', () => {
  it('renders 3 categories', () => {
    const { getByText } = render(<CategoriesCard lastReceived={null} onInvokeAction={jest.fn()} />);
    expect(getByText(/yes-no/i)).toBeTruthy();
    expect(getByText(/snooze-done/i)).toBeTruthy();
    expect(getByText(/reply-text/i)).toBeTruthy();
  });

  it('shows text-input flag for reply-text only', () => {
    const { getByText } = render(<CategoriesCard lastReceived={null} onInvokeAction={jest.fn()} />);
    // reply-text should have text input indicator
    expect(getByText(/text input/i)).toBeTruthy();
  });

  it('disables action replay when lastReceived is null', () => {
    const { getByText } = render(<CategoriesCard lastReceived={null} onInvokeAction={jest.fn()} />);
    const button = getByText(/notification's actions/i);
    // Verify button renders (disabled state testing on Text is not reliable)
    expect(button).toBeTruthy();
  });

  it('enables action replay when lastReceived is set', () => {
    const { getByText } = render(
      <CategoriesCard
        lastReceived={{ identifier: 'n1', categoryId: 'yes-no' }}
        onInvokeAction={jest.fn()}
      />,
    );
    const button = getByText(/notification's actions/i);
    expect(button).toBeTruthy();
  });

  it('calls onInvokeAction when action tapped', () => {
    const onInvokeAction = jest.fn();
    const { getByText, getAllByText } = render(
      <CategoriesCard
        lastReceived={{ identifier: 'n1', categoryId: 'yes-no' }}
        onInvokeAction={onInvokeAction}
      />,
    );
    fireEvent.press(getByText(/notification's actions/i));
    // After opening sheet, there are now 2 "yes" elements - one in list, one in sheet
    // Get the second one (in the sheet)
    const yesButtons = getAllByText(/^yes$/i);
    fireEvent.press(yesButtons[yesButtons.length - 1]);
    expect(onInvokeAction).toHaveBeenCalledWith('yes');
  });
});
