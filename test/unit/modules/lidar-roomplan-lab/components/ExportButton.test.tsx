/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import ExportButton from '@/modules/lidar-roomplan-lab/components/ExportButton';
import type { ShareSheetBridge } from '@/native/share-sheet.types';

function makeShareBridge(): ShareSheetBridge & { present: jest.Mock } {
  return {
    isAvailable: () => true,
    present: jest.fn(async () => ({ activityType: null, completed: true })),
  };
}

describe('ExportButton', () => {
  it('renders an Export USDZ button', () => {
    const onExport = jest.fn(async () => null);
    const bridge = makeShareBridge();
    const { getByTestId } = render(<ExportButton onExport={onExport} shareBridge={bridge} />);
    expect(getByTestId('roomplan-export-button')).toBeTruthy();
  });

  it('calls onExport then shareBridge.present with the resulting path', async () => {
    const onExport = jest.fn(async () => 'file:///tmp/abc.usdz');
    const bridge = makeShareBridge();
    const { getByTestId } = render(<ExportButton onExport={onExport} shareBridge={bridge} />);
    await act(async () => {
      fireEvent.press(getByTestId('roomplan-export-button'));
    });
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(bridge.present).toHaveBeenCalledTimes(1);
    const opts = bridge.present.mock.calls[0][0];
    expect(opts.content).toEqual(
      expect.objectContaining({
        kind: 'file',
        uri: 'file:///tmp/abc.usdz',
        mimeType: 'model/vnd.usdz+zip',
      }),
    );
  });

  it('does not call shareBridge.present when onExport returns null', async () => {
    const onExport = jest.fn(async () => null);
    const bridge = makeShareBridge();
    const { getByTestId } = render(<ExportButton onExport={onExport} shareBridge={bridge} />);
    await act(async () => {
      fireEvent.press(getByTestId('roomplan-export-button'));
    });
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(bridge.present).not.toHaveBeenCalled();
  });

  it('swallows shareBridge errors silently', async () => {
    const onExport = jest.fn(async () => 'file:///tmp/x.usdz');
    const bridge = makeShareBridge();
    bridge.present.mockRejectedValueOnce(new Error('cancelled'));
    const { getByTestId } = render(<ExportButton onExport={onExport} shareBridge={bridge} />);
    await act(async () => {
      fireEvent.press(getByTestId('roomplan-export-button'));
    });
    // No throw — success is silent absence of crash.
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled', async () => {
    const onExport = jest.fn(async () => 'file:///tmp/x.usdz');
    const bridge = makeShareBridge();
    const { getByTestId } = render(
      <ExportButton onExport={onExport} shareBridge={bridge} disabled />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('roomplan-export-button'));
    });
    expect(onExport).not.toHaveBeenCalled();
  });
});
