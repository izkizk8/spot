/**
 * usePassKit hook tests.
 * Feature: 036-passkit-wallet
 *
 * Tests all hook invariants from contracts/usePassKit-hook.md (H1–H10).
 * The bridge is mocked at the import boundary (FR-027). Each method on the
 * mocked bridge delegates to a corresponding `jest.fn()` that the test
 * mutates per-case via `mockBridge.<method>.mockResolvedValue(...)`.
 *
 * @see specs/036-passkit-wallet/contracts/usePassKit-hook.md
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';

import { PassKitCancelled, PassKitOpenUnsupported } from '@/native/passkit.types';

// Mutable bridge holder: methods are populated in `beforeEach` so the
// jest.mock factory (hoisted above all const declarations by babel-jest)
// can close over a stable reference and look up live jest.fn instances at
// call time.
const mockBridge: {
  canAddPasses: jest.Mock;
  isPassLibraryAvailable: jest.Mock;
  passes: jest.Mock;
  addPassFromBytes: jest.Mock;
  addPassFromURL: jest.Mock;
  openPass: jest.Mock;
} = {
  canAddPasses: jest.fn(),
  isPassLibraryAvailable: jest.fn(),
  passes: jest.fn(),
  addPassFromBytes: jest.fn(),
  addPassFromURL: jest.fn(),
  openPass: jest.fn(),
};

jest.mock('@/native/passkit', () => ({
  __esModule: true,
  canAddPasses: (...args: unknown[]) => mockBridge.canAddPasses(...args),
  isPassLibraryAvailable: (...args: unknown[]) => mockBridge.isPassLibraryAvailable(...args),
  passes: (...args: unknown[]) => mockBridge.passes(...args),
  addPassFromBytes: (...args: unknown[]) => mockBridge.addPassFromBytes(...args),
  addPassFromURL: (...args: unknown[]) => mockBridge.addPassFromURL(...args),
  openPass: (...args: unknown[]) => mockBridge.openPass(...args),
}));

// Mutable config holder: the hook reads PASSKIT_ENTITLEMENT each call via a
// namespace import, so the getter forwards to the live mockConfig value.
const mockConfig: { PASSKIT_ENTITLEMENT: readonly string[] } = {
  PASSKIT_ENTITLEMENT: ['$(TeamIdentifierPrefix)pass.example.placeholder'],
};
jest.mock('@/modules/passkit-lab/config', () => ({
  __esModule: true,
  get PASSKIT_ENTITLEMENT() {
    return mockConfig.PASSKIT_ENTITLEMENT;
  },
}));

import { usePassKit } from '@/modules/passkit-lab/hooks/usePassKit';

function resetMockBridge(): void {
  mockBridge.canAddPasses.mockReset().mockResolvedValue(false);
  mockBridge.isPassLibraryAvailable.mockReset().mockResolvedValue(false);
  mockBridge.passes.mockReset().mockResolvedValue([]);
  mockBridge.addPassFromBytes.mockReset().mockResolvedValue({ added: true });
  mockBridge.addPassFromURL.mockReset().mockResolvedValue({ added: true });
  mockBridge.openPass.mockReset().mockResolvedValue(undefined);
}

describe('usePassKit hook', () => {
  beforeEach(() => {
    resetMockBridge();
    mockConfig.PASSKIT_ENTITLEMENT = ['$(TeamIdentifierPrefix)pass.example.placeholder'];
  });

  it('H2: default state on mount', async () => {
    const { result } = renderHook(() => usePassKit());
    expect(result.current.capabilities).toEqual({
      isPassLibraryAvailable: false,
      canAddPasses: false,
    });
    expect(result.current.passes).toEqual([]);
  });

  it('H3: mount calls refresh() exactly once', async () => {
    mockBridge.canAddPasses.mockResolvedValue(true);
    mockBridge.isPassLibraryAvailable.mockResolvedValue(true);
    renderHook(() => usePassKit());

    await waitFor(() => {
      expect(mockBridge.canAddPasses).toHaveBeenCalledTimes(1);
      expect(mockBridge.isPassLibraryAvailable).toHaveBeenCalledTimes(1);
      expect(mockBridge.passes).toHaveBeenCalledTimes(1);
    });
  });

  it('H4: refresh() updates capabilities and passes atomically', async () => {
    mockBridge.canAddPasses.mockResolvedValue(true);
    mockBridge.isPassLibraryAvailable.mockResolvedValue(true);
    mockBridge.passes.mockResolvedValue([
      {
        passTypeIdentifier: 'pass.example.test',
        serialNumber: '12345',
        organizationName: 'Test Org',
        localizedDescription: 'Test Pass',
        passType: 'generic',
      },
    ]);

    const { result } = renderHook(() => usePassKit());

    await waitFor(() => {
      expect(result.current.capabilities.canAddPasses).toBe(true);
    });

    expect(result.current.capabilities).toEqual({
      isPassLibraryAvailable: true,
      canAddPasses: true,
    });
    expect(result.current.passes).toHaveLength(1);
  });

  it('H5: addFromBytes() happy path sets lastResult', async () => {
    mockBridge.addPassFromBytes.mockResolvedValue({ added: true });

    const { result } = renderHook(() => usePassKit());

    await waitFor(() => {
      expect(result.current.inFlight).toBe(false);
    });

    await act(async () => {
      await result.current.addFromBytes('base64string');
    });

    await waitFor(() => {
      expect(result.current.lastResult).toEqual({ added: true });
    });
  });

  it('H5: addFromURL() serialisation — two rapid calls run in submission order', async () => {
    const calls: string[] = [];
    mockBridge.addPassFromURL.mockImplementation((url: string) => {
      calls.push(url);
      return Promise.resolve({ added: true });
    });

    const { result } = renderHook(() => usePassKit());

    await waitFor(() => {
      expect(result.current.inFlight).toBe(false);
    });

    await act(async () => {
      await Promise.all([
        result.current.addFromURL('https://example.com/1.pkpass'),
        result.current.addFromURL('https://example.com/2.pkpass'),
      ]);
    });

    expect(calls).toEqual(['https://example.com/1.pkpass', 'https://example.com/2.pkpass']);
  });

  it('H6: openPass() classifies PassKitOpenUnsupported when bridge throws', async () => {
    mockBridge.openPass.mockRejectedValue(new PassKitOpenUnsupported());

    const { result } = renderHook(() => usePassKit());

    await waitFor(() => {
      expect(result.current.inFlight).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.openPass('pass.example.test', '12345');
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(result.current.lastError).toMatchObject({ type: 'openUnsupported' });
    });
  });

  it('H7: error classification for PassKitCancelled', async () => {
    mockBridge.addPassFromBytes.mockRejectedValue(new PassKitCancelled('User cancelled'));

    const { result } = renderHook(() => usePassKit());

    await waitFor(() => {
      expect(result.current.inFlight).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.addFromBytes('base64');
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(result.current.lastError).toMatchObject({ type: 'cancelled' });
    });
  });

  it('H8: lastError/lastResult mutual exclusion', async () => {
    mockBridge.addPassFromBytes
      .mockResolvedValueOnce({ added: true })
      .mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => usePassKit());

    await waitFor(() => {
      expect(result.current.inFlight).toBe(false);
    });

    await act(async () => {
      await result.current.addFromBytes('base64-1');
    });

    await waitFor(() => {
      expect(result.current.lastResult).toEqual({ added: true });
    });

    await act(async () => {
      try {
        await result.current.addFromBytes('base64-2');
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(result.current.lastError).not.toBeNull();
      expect(result.current.lastResult).toBeNull();
    });
  });

  it('H9: action functions have stable identities across renders', async () => {
    const { result, rerender } = renderHook(() => usePassKit());

    const firstRefresh = result.current.refresh;
    const firstAddFromBytes = result.current.addFromBytes;
    const firstAddFromURL = result.current.addFromURL;
    const firstOpenPass = result.current.openPass;

    rerender({});

    expect(result.current.refresh).toBe(firstRefresh);
    expect(result.current.addFromBytes).toBe(firstAddFromBytes);
    expect(result.current.addFromURL).toBe(firstAddFromURL);
    expect(result.current.openPass).toBe(firstOpenPass);
  });

  it('H9/FR-024: unmount during in-flight call does not throw', async () => {
    let resolveAdd: ((value: { added: boolean }) => void) | null = null;
    mockBridge.addPassFromURL.mockImplementation(
      () =>
        new Promise<{ added: boolean }>((resolve) => {
          resolveAdd = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => usePassKit());

    await waitFor(() => {
      expect(result.current.inFlight).toBe(false);
    });

    act(() => {
      void result.current.addFromURL('https://example.com/pass.pkpass');
    });

    unmount();

    await act(async () => {
      resolveAdd?.({ added: true });
    });
  });

  it('H10: detects placeholder entitlement', async () => {
    mockConfig.PASSKIT_ENTITLEMENT = ['$(TeamIdentifierPrefix)pass.example.placeholder'];
    const { result } = renderHook(() => usePassKit());
    expect(result.current.entitlementStatus.isPlaceholder).toBe(true);
  });

  it('H10: real Pass Type ID flips placeholder flag to false', async () => {
    mockConfig.PASSKIT_ENTITLEMENT = ['$(TeamIdentifierPrefix)pass.acme.real'];
    const { result } = renderHook(() => usePassKit());
    expect(result.current.entitlementStatus.isPlaceholder).toBe(false);
  });
});
