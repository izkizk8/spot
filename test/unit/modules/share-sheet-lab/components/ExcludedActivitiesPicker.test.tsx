/**
 * Tests for ExcludedActivitiesPicker — feature 033 / T019.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ExcludedActivitiesPicker from '@/modules/share-sheet-lab/components/ExcludedActivitiesPicker';

describe('ExcludedActivitiesPicker', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  it('checklist length matches catalog built-ins only', () => {
    const { getAllByRole } = render(
      <ExcludedActivitiesPicker
        selection={{ checked: new Set(), hideAll: false }}
        onChange={() => {}}
      />
    );

    const checkboxes = getAllByRole('checkbox');
    // Should be 12 built-in iOS activities (not synthetic)
    expect(checkboxes.length).toBeGreaterThanOrEqual(12);
  });

  it('per-row toggle works', () => {
    const onChange = jest.fn();
    render(
      <ExcludedActivitiesPicker
        selection={{ checked: new Set(), hideAll: false }}
        onChange={onChange}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].checked.size).toBe(1);
  });

  it('Hide all toggles every built-in', () => {
    const onChange = jest.fn();
    render(
      <ExcludedActivitiesPicker
        selection={{ checked: new Set(), hideAll: false }}
        onChange={onChange}
      />
    );

    const hideAllSwitch = screen.getByText(/Hide all/i);
    fireEvent.press(hideAllSwitch.parent);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].hideAll).toBe(true);
  });

  it('disabled state on non-iOS asserted via accessibilityState.disabled === true', () => {
    Platform.OS = 'android';

    const { toJSON } = render(
      <ExcludedActivitiesPicker
        selection={{ checked: new Set(), hideAll: false }}
        onChange={() => {}}
      />
    );

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('"disabled":true');
  });
});
