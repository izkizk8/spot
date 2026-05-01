/**
 * PencilKit Lab Screen Test (iOS)
 * Feature: 082-pencilkit
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 17;

const baseStore = {
  canvasInfo: {
    available: true,
    supportsPencil: true,
    drawingPolicy: 'default' as const,
  },
  currentTool: {
    type: 'pen' as const,
    width: 4,
    color: '#000000',
    opacity: 1,
  },
  drawingStats: {
    strokeCount: 0,
    dataLength: 0,
    boundingWidth: 0,
    boundingHeight: 0,
  },
  loading: false,
  lastError: null,
  initCanvas: jest.fn(async () => {}),
  clearCanvas: jest.fn(async () => {}),
  setTool: jest.fn(async () => null),
  setPolicy: jest.fn(async () => {}),
  exportDrawing: jest.fn(async () => null),
  importDrawing: jest.fn(async () => {}),
  refreshStats: jest.fn(async () => {}),
};

const mockUsePencilKit = jest.fn(() => baseStore);

jest.mock('@/modules/pencilkit-lab/hooks/usePencilKit', () => ({
  usePencilKit: mockUsePencilKit,
}));

describe('PencilKitLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/pencilkit-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/PencilKit Capability/i)).toBeTruthy();
    expect(screen.getByText(/^Drawing Policy$/)).toBeTruthy();
    expect(screen.getByText(/^Tool$/)).toBeTruthy();
    expect(screen.getByText(/^Canvas$/)).toBeTruthy();
    expect(screen.getByText(/Drawing Stats/i)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });
});
