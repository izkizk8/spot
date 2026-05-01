/**
 * PassKit Lab Screen tests — iOS variant.
 * Feature: 036-passkit-wallet
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import type { ClassifiedError } from '@/modules/passkit-lab/hooks/usePassKit';

interface HookState {
  capabilities: { isPassLibraryAvailable: boolean; canAddPasses: boolean };
  passes: unknown[];
  inFlight: boolean;
  lastError: ClassifiedError | null;
  lastResult: { added: boolean } | null;
  refresh: jest.Mock;
  addFromBytes: jest.Mock;
  addFromURL: jest.Mock;
  openPass: jest.Mock;
  entitlementStatus: { isPlaceholder: boolean };
}

let mockHookState: HookState;

jest.mock('@/modules/passkit-lab/hooks/usePassKit', () => ({
  __esModule: true,
  usePassKit: () => mockHookState,
}));

jest.mock('@/native/passkit', () => ({
  __esModule: true,
  canAddPasses: jest.fn().mockResolvedValue(true),
  isPassLibraryAvailable: jest.fn().mockResolvedValue(true),
  passes: jest.fn().mockResolvedValue([]),
  addPassFromBytes: jest.fn(),
  addPassFromURL: jest.fn(),
  openPass: jest.fn(),
}));

import Screen from '@/modules/passkit-lab/screen';

function makeHookState(overrides: Partial<HookState> = {}): HookState {
  return {
    capabilities: { isPassLibraryAvailable: true, canAddPasses: true },
    passes: [],
    inFlight: false,
    lastError: null,
    lastResult: null,
    refresh: jest.fn(),
    addFromBytes: jest.fn(),
    addFromURL: jest.fn(),
    openPass: jest.fn(),
    entitlementStatus: { isPlaceholder: false },
    ...overrides,
  };
}

describe('PassKit Lab Screen (iOS)', () => {
  beforeEach(() => {
    mockHookState = makeHookState();
  });

  it('renders five cards in fixed order (FR-004)', () => {
    const { getByText } = render(<Screen />);

    expect(getByText(/capabilities/i)).toBeTruthy();
    expect(getByText(/bundled sample/i)).toBeTruthy();
    expect(getByText(/my passes/i)).toBeTruthy();
    expect(getByText(/add from url/i)).toBeTruthy();
    expect(getByText(/setup guide/i)).toBeTruthy();
  });

  it('EntitlementBanner visible when isPlaceholder is true', () => {
    mockHookState = makeHookState({ entitlementStatus: { isPlaceholder: true } });
    const { getByText } = render(<Screen />);
    expect(getByText(/pass type id required/i)).toBeTruthy();
  });

  it('EntitlementBanner hidden when isPlaceholder is false', () => {
    mockHookState = makeHookState({ entitlementStatus: { isPlaceholder: false } });
    const { queryByText } = render(<Screen />);
    expect(queryByText(/pass type id required/i)).toBeNull();
  });

  it('surfaces "Pass signing required" when no bundle present (US1)', () => {
    const { getByText } = render(<Screen />);
    expect(getByText(/pass signing required/i)).toBeTruthy();
  });
});
