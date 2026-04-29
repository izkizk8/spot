/**
 * LimitedAccessBanner component tests.
 * Feature: 038-contacts
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { LimitedAccessBanner } from '@/modules/contacts-lab/components/LimitedAccessBanner';

describe('LimitedAccessBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders banner with iOS 18+ limited access message', () => {
    const onManage = jest.fn();
    const { getByTestId, getByText } = render(<LimitedAccessBanner onManage={onManage} />);

    expect(getByTestId('contacts-limited-banner')).toBeTruthy();
    expect(getByText(/Limited Access/)).toBeTruthy();
    expect(getByText(/iOS 18\+/)).toBeTruthy();
  });

  it('renders manage button', () => {
    const onManage = jest.fn();
    const { getByTestId, getByText } = render(<LimitedAccessBanner onManage={onManage} />);

    expect(getByTestId('contacts-manage-limited-button')).toBeTruthy();
    expect(getByText('Manage selected contacts')).toBeTruthy();
  });

  it('calls onManage when button pressed', () => {
    const onManage = jest.fn();
    const { getByTestId } = render(<LimitedAccessBanner onManage={onManage} />);

    fireEvent.press(getByTestId('contacts-manage-limited-button'));
    expect(onManage).toHaveBeenCalledTimes(1);
  });
});
