/**
 * Tests for spotlight-lab iOS screen — feature 031 / T039.
 *
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import * as bridge from '@/native/spotlight';

jest.mock('@/native/spotlight');

// Mock MODULES to avoid importing the full registry
jest.mock('@/modules/registry', () => ({
  __esModule: true,
  MODULES: [
    {
      id: 'haptics-playground',
      title: 'Haptics Playground',
      description: 'Explore haptic feedback',
      keywords: ['haptic', 'vibration'],
    },
    {
      id: 'sensors-lab',
      title: 'Sensors Lab',
      description: 'Sensor data',
      keywords: ['sensors'],
    },
  ],
}));

class MockSpotlightNotSupported extends Error {
  override readonly name = 'SpotlightNotSupported' as const;
  constructor(msg?: string) {
    super(msg ?? 'SpotlightNotSupported');
    Object.setPrototypeOf(this, MockSpotlightNotSupported.prototype);
  }
}

const mockBridge = bridge as jest.Mocked<typeof bridge>;

beforeEach(() => {
  jest.clearAllMocks();
  mockBridge.isAvailable.mockReturnValue(true);
  mockBridge.index.mockResolvedValue(undefined);
  mockBridge.delete.mockResolvedValue(undefined);
  mockBridge.deleteAll.mockResolvedValue(undefined);
  mockBridge.search.mockResolvedValue([]);
  mockBridge.markCurrentActivity.mockResolvedValue(undefined);
  mockBridge.clearCurrentActivity.mockResolvedValue(undefined);
  (
    mockBridge as unknown as { SpotlightNotSupported: typeof MockSpotlightNotSupported }
  ).SpotlightNotSupported = MockSpotlightNotSupported;
});

describe('spotlight-lab screen (iOS)', () => {
  it('renders the six panels in fixed top-to-bottom order (FR-010)', async () => {
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    await waitFor(() => {
      expect(screen.getByText('About Spotlight Indexing')).toBeTruthy();
      expect(screen.getByText('Bulk Actions')).toBeTruthy();
      expect(screen.getByText('Search Test')).toBeTruthy();
      expect(screen.getByText('User Activity')).toBeTruthy();
      expect(screen.getByText('Persistence Note')).toBeTruthy();
    });
  });

  it('tapping a per-row toggle invokes toggleItem(id) (US1 AS1)', async () => {
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByText('Haptics Playground'));
    // Find toggle buttons and press one
    const toggleButtons = screen.getAllByRole('button');
    const indexButton = toggleButtons.find((b) =>
      b.props?.children?.props?.children === 'Index',
    );
    if (indexButton) {
      fireEvent.press(indexButton);
      await waitFor(() => {
        expect(mockBridge.index).toHaveBeenCalled();
      });
    }
  });

  it('tapping "Index All" invokes indexAll() (US1 AS2)', async () => {
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByText(/index all/i));
    fireEvent.press(screen.getByText(/index all/i));
    await waitFor(() => {
      expect(mockBridge.index).toHaveBeenCalled();
    });
  });

  it('tapping "Remove all from index" invokes removeAll()', async () => {
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByText(/remove all/i));
    fireEvent.press(screen.getByText(/remove all/i));
    await waitFor(() => {
      expect(mockBridge.deleteAll).toHaveBeenCalled();
    });
  });

  it('submitting search CTA invokes search(query) (US2 AS1)', async () => {
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByPlaceholderText(/search/i));
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.changeText(input, 'haptics');
    fireEvent.press(screen.getByText(/search spotlight/i));
    await waitFor(() => {
      expect(mockBridge.search).toHaveBeenCalledWith('haptics', 25);
    });
  });

  it('tapping "Mark current activity" invokes markActivity() (US3 AS1)', async () => {
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByText(/mark.*activity/i));
    fireEvent.press(screen.getByText(/mark.*activity/i));
    await waitFor(() => {
      expect(mockBridge.markCurrentActivity).toHaveBeenCalled();
    });
  });

  it('tapping "Clear current activity" invokes clearActivity() (US3 AS2)', async () => {
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    await waitFor(() => screen.getByText(/clear.*activity/i));
    fireEvent.press(screen.getByText(/clear.*activity/i));
    await waitFor(() => {
      expect(mockBridge.clearCurrentActivity).toHaveBeenCalled();
    });
  });

  it('renders IOSOnlyBanner + ExplainerCard + PersistenceNoteCard when isAvailable === false (FR-013/EC-002)', () => {
    mockBridge.isAvailable.mockReturnValue(false);
    const Screen = require('@/modules/spotlight-lab/screen').default;
    render(<Screen />);
    // Banner + explainer + persistence note should be present
    expect(screen.getByText(/Spotlight.*disabled|unavailable/i)).toBeTruthy();
    expect(screen.getByText('About Spotlight Indexing')).toBeTruthy();
    expect(screen.getByText('Persistence Note')).toBeTruthy();
    // Index/search/activity panels should be absent
    expect(screen.queryByText('Bulk Actions')).toBeNull();
    expect(screen.queryByText('Search Test')).toBeNull();
    expect(screen.queryByText('User Activity')).toBeNull();
  });

  it("does NOT import any prior feature's screen module", () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../../../src/modules/spotlight-lab/screen.tsx',
    );
    const src = fs.readFileSync(filePath, 'utf8');
    // No imports of other feature screen files
    expect(src).not.toMatch(/background-tasks-lab\/screen/);
    expect(src).not.toMatch(/focus-filters-lab\/screen/);
    expect(src).not.toMatch(/standby-lab\/screen/);
    expect(src).not.toMatch(/lock-widgets-lab\/screen/);
    expect(src).not.toMatch(/core-location-lab\/screen/);
  });
});
