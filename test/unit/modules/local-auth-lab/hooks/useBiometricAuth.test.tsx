/**
 * Test suite for useBiometricAuth hook (feature 022).
 *
 * Covers: capabilities load on mount; authenticate success populates result
 * + history; authenticate failure (cancel / error); bridge throw records
 * 'unknown'; history capped at 10.
 */

import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { useBiometricAuth } from '@/modules/local-auth-lab/hooks/useBiometricAuth';

jest.mock('expo-local-authentication');

const mockLocalAuth = jest.requireMock(
  'expo-local-authentication',
) as typeof import('../../../../__mocks__/expo-local-authentication');

interface ProbeRef {
  state: ReturnType<typeof useBiometricAuth>;
}

function Probe({ onState }: { onState: (s: ReturnType<typeof useBiometricAuth>) => void }) {
  const state = useBiometricAuth();
  onState(state);
  return <Text>{`H=${state.history.length}`}</Text>;
}

function makeRef(): ProbeRef {
  return { state: undefined as unknown as ProbeRef['state'] };
}

function captureProbe(ref: ProbeRef) {
  return (s: ProbeRef['state']) => {
    ref.state = s;
  };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useBiometricAuth', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockLocalAuth.__reset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('mount', () => {
    it('loads capabilities', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();
      expect(mockLocalAuth.hasHardwareAsync).toHaveBeenCalled();
      expect(mockLocalAuth.isEnrolledAsync).toHaveBeenCalled();
      expect(mockLocalAuth.supportedAuthenticationTypesAsync).toHaveBeenCalled();
      expect(mockLocalAuth.getEnrolledLevelAsync).toHaveBeenCalled();
      expect(ref.state.capabilities).toEqual({
        hasHardware: true,
        isEnrolled: true,
        types: [mockLocalAuth.AuthenticationType.FACIAL_RECOGNITION],
        securityLevel: mockLocalAuth.SecurityLevel.BIOMETRIC_STRONG,
      });
    });

    it('tolerates capability throws (defaults each value)', async () => {
      mockLocalAuth.__setThrowOn('hasHardware');
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();
      expect(ref.state.capabilities?.hasHardware).toBe(false);
    });
  });

  describe('authenticate', () => {
    it('records success in lastResult and history', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      await act(async () => {
        await ref.state.authenticate({ promptMessage: 'go' });
      });

      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({ promptMessage: 'go' });
      expect(ref.state.lastResult?.success).toBe(true);
      expect(ref.state.history).toHaveLength(1);
      expect(ref.state.history[0].success).toBe(true);
    });

    it('records error result without throwing', async () => {
      mockLocalAuth.__setAuthenticateResult({ success: false, error: 'user_cancel' });
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      await act(async () => {
        await ref.state.authenticate();
      });

      expect(ref.state.lastResult).toEqual(
        expect.objectContaining({ success: false, error: 'user_cancel' }),
      );
      expect(ref.state.history[0].error).toBe('user_cancel');
    });

    it('records "unknown" when bridge throws', async () => {
      mockLocalAuth.__setAuthenticateResult(new Error('boom'));
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      await act(async () => {
        await ref.state.authenticate();
      });

      expect(ref.state.lastResult).toEqual(
        expect.objectContaining({ success: false, error: 'unknown' }),
      );
      expect(warnSpy).toHaveBeenCalled();
    });

    it('caps history at 10 entries', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      await act(async () => {
        for (let i = 0; i < 15; i += 1) {
          await ref.state.authenticate();
        }
      });

      expect(ref.state.history).toHaveLength(10);
    });

    it('returns the attempt synchronously to callers', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      let returned: unknown;
      await act(async () => {
        returned = await ref.state.authenticate();
      });

      expect(returned).toEqual(expect.objectContaining({ success: true }));
    });
  });

  describe('refreshCapabilities', () => {
    it('re-issues all four capability calls', async () => {
      const ref = makeRef();
      render(<Probe onState={captureProbe(ref)} />);
      await flush();

      mockLocalAuth.hasHardwareAsync.mockClear();
      mockLocalAuth.isEnrolledAsync.mockClear();
      mockLocalAuth.supportedAuthenticationTypesAsync.mockClear();
      mockLocalAuth.getEnrolledLevelAsync.mockClear();

      await act(async () => {
        await ref.state.refreshCapabilities();
      });

      expect(mockLocalAuth.hasHardwareAsync).toHaveBeenCalledTimes(1);
      expect(mockLocalAuth.isEnrolledAsync).toHaveBeenCalledTimes(1);
      expect(mockLocalAuth.supportedAuthenticationTypesAsync).toHaveBeenCalledTimes(1);
      expect(mockLocalAuth.getEnrolledLevelAsync).toHaveBeenCalledTimes(1);
    });
  });
});
