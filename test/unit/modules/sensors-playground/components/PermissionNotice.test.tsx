/**
 * @file PermissionNotice.test.tsx
 */
import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { PermissionNotice } from '@/modules/sensors-playground/components/PermissionNotice';

describe('PermissionNotice', () => {
  it('kind="idle" renders nothing', () => {
    const { toJSON } = render(<PermissionNotice kind="idle" />);
    expect(toJSON()).toBeNull();
  });

  it('kind="unsupported" renders the literal copy and no button', () => {
    const { getByText, queryByTestId } = render(<PermissionNotice kind="unsupported" />);
    expect(getByText('Not supported on this platform')).toBeTruthy();
    expect(queryByTestId('permission-open-settings')).toBeNull();
  });

  it('kind="denied" renders a copy + Open Settings button which calls Linking.openSettings', () => {
    const spy = jest.spyOn(Linking, 'openSettings').mockImplementation(async () => {});
    const { getByText, getByTestId } = render(<PermissionNotice kind="denied" />);
    expect(getByText('Permission denied')).toBeTruthy();
    fireEvent.press(getByTestId('permission-open-settings'));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
