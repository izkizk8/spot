/**
 * ScanControls — unit tests (T019).
 * Feature: 035-core-bluetooth
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import ScanControls from '@/modules/bluetooth-lab/components/ScanControls';

describe('ScanControls', () => {
  it('disables Scan toggle when central !== "poweredOn"', () => {
    const onScan = jest.fn();
    const { getByText } = render(
      <ScanControls
        central='poweredOff'
        scan='idle'
        allowDuplicates={false}
        onScanToggle={onScan}
        onFilterChange={jest.fn()}
        onAllowDuplicatesChange={jest.fn()}
      />,
    );
    expect(getByText(/must be powered on/i)).toBeTruthy();
    fireEvent.press(getByText(/start/i));
    expect(onScan).not.toHaveBeenCalled();
  });

  it('toggles scan when central is poweredOn', () => {
    const onScan = jest.fn();
    const { getByText } = render(
      <ScanControls
        central='poweredOn'
        scan='idle'
        allowDuplicates={false}
        onScanToggle={onScan}
        onFilterChange={jest.fn()}
        onAllowDuplicatesChange={jest.fn()}
      />,
    );
    fireEvent.press(getByText(/start/i));
    expect(onScan).toHaveBeenCalledWith(true);
  });

  it('renders one of idle / scanning / paused pills', () => {
    const { getByLabelText, rerender } = render(
      <ScanControls
        central='poweredOn'
        scan='idle'
        allowDuplicates={false}
        onScanToggle={jest.fn()}
        onFilterChange={jest.fn()}
        onAllowDuplicatesChange={jest.fn()}
      />,
    );
    expect(getByLabelText('scan-idle')).toBeTruthy();
    rerender(
      <ScanControls
        central='poweredOn'
        scan='scanning'
        allowDuplicates={false}
        onScanToggle={jest.fn()}
        onFilterChange={jest.fn()}
        onAllowDuplicatesChange={jest.fn()}
      />,
    );
    expect(getByLabelText('scan-scanning')).toBeTruthy();
    rerender(
      <ScanControls
        central='poweredOn'
        scan='paused'
        allowDuplicates={false}
        onScanToggle={jest.fn()}
        onFilterChange={jest.fn()}
        onAllowDuplicatesChange={jest.fn()}
      />,
    );
    expect(getByLabelText('scan-paused')).toBeTruthy();
  });

  it('rejects invalid UUIDs in the filter input', () => {
    const onFilter = jest.fn();
    const { getByLabelText, getByText } = render(
      <ScanControls
        central='poweredOn'
        scan='idle'
        allowDuplicates={false}
        onScanToggle={jest.fn()}
        onFilterChange={onFilter}
        onAllowDuplicatesChange={jest.fn()}
      />,
    );
    fireEvent.changeText(getByLabelText('scan-filter-input'), 'not-a-uuid');
    expect(getByText(/invalid uuid/i)).toBeTruthy();
    expect(onFilter).not.toHaveBeenCalled();
  });

  it('accepts valid UUIDs and calls onFilterChange', () => {
    const onFilter = jest.fn();
    const { getByLabelText } = render(
      <ScanControls
        central='poweredOn'
        scan='idle'
        allowDuplicates={false}
        onScanToggle={jest.fn()}
        onFilterChange={onFilter}
        onAllowDuplicatesChange={jest.fn()}
      />,
    );
    fireEvent.changeText(getByLabelText('scan-filter-input'), '180f');
    expect(onFilter).toHaveBeenCalledWith('180f');
  });

  it('toggles allow-duplicates switch', () => {
    const onAllow = jest.fn();
    const { getByLabelText } = render(
      <ScanControls
        central='poweredOn'
        scan='idle'
        allowDuplicates={false}
        onScanToggle={jest.fn()}
        onFilterChange={jest.fn()}
        onAllowDuplicatesChange={onAllow}
      />,
    );
    fireEvent(getByLabelText('allow-duplicates'), 'valueChange', true);
    expect(onAllow).toHaveBeenCalledWith(true);
  });
});
