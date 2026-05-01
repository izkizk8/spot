/**
 * StaticActionsList tests.
 * Feature: 039-quick-actions
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { StaticActionsList } from '@/modules/quick-actions-lab/components/StaticActionsList';
import { DEFAULT_QUICK_ACTIONS } from '@/modules/quick-actions-lab/default-actions';

describe('StaticActionsList', () => {
  it('renders the list container and 4 read-only rows in order', () => {
    const { getByTestId } = render(<StaticActionsList />);
    expect(getByTestId('static-actions-list')).toBeTruthy();
    DEFAULT_QUICK_ACTIONS.forEach((action) => {
      expect(getByTestId(`static-action-${action.type}`)).toBeTruthy();
    });
  });
});
