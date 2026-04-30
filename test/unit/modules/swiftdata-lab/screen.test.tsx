/**
 * SwiftData Lab Screen Test (iOS)
 * Feature: 053-swiftdata
 */

import { render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Platform } from 'react-native';

Platform.OS = 'ios';
Platform.Version = 17;

const baseStore = {
  schema: {
    available: true,
    containerName: 'SwiftDataLab.store',
    modelNames: ['TaskItem'],
  },
  tasks: [],
  visibleTasks: [],
  filter: 'all' as const,
  sort: 'created' as const,
  stats: {
    total: 0,
    completed: 0,
    active: 0,
    byPriority: { low: 0, medium: 0, high: 0 },
    completionRate: 0,
  },
  loading: false,
  lastError: null,
  setFilter: jest.fn(),
  setSort: jest.fn(),
  refreshSchema: jest.fn(),
  refreshTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  toggleCompleted: jest.fn(),
};

const mockUseSwiftDataTasks = jest.fn(() => baseStore);

jest.mock('@/modules/swiftdata-lab/hooks/useSwiftDataTasks', () => ({
  useSwiftDataTasks: mockUseSwiftDataTasks,
}));

describe('SwiftDataLabScreen (iOS)', () => {
  it('renders all sections', () => {
    const Screen = require('@/modules/swiftdata-lab/screen').default;
    render(<Screen />);
    expect(screen.getByText(/SwiftData Capability/i)).toBeTruthy();
    expect(screen.getByText(/^Filter$/)).toBeTruthy();
    expect(screen.getByText(/^Sort$/)).toBeTruthy();
    expect(screen.getByText(/^Tasks$/)).toBeTruthy();
    expect(screen.getByText(/New Task/i)).toBeTruthy();
    expect(screen.getByText(/^Stats$/)).toBeTruthy();
    expect(screen.getByText(/Setup Instructions/i)).toBeTruthy();
  });
});
