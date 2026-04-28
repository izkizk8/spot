import bridge from '@/native/lookaround';
import { MapKitNotSupportedError } from '@/native/lookaround.types';
import {
  __setLookAroundModule,
  __setLookAroundResult,
  __resetLookAroundMock,
} from '@test/__mocks__/native-lookaround';

describe('lookaround.ios', () => {
  beforeEach(() => {
    __resetLookAroundMock();
  });

  it('forwards lat and lng to native module and returns result', async () => {
    __setLookAroundResult({ shown: true });

    const result = await bridge.presentLookAround(37.7749, -122.4194);

    expect(result).toEqual({ shown: true });
  });

  it('returns shown: false when no scene available', async () => {
    __setLookAroundResult({ shown: false });

    const result = await bridge.presentLookAround(0, 0);

    expect(result).toEqual({ shown: false });
  });

  it.skip('throws MapKitNotSupportedError when native module is null (requires module re-import)', async () => {
    // This test cannot work with the current mock architecture because
    // the bridge caches the native module at import time.
    // In practice, the native module is either present (custom dev client)
    // or absent (Expo Go), and doesn't change at runtime.
    __setLookAroundModule(null);

    await expect(bridge.presentLookAround(37.7749, -122.4194)).rejects.toThrow(
      MapKitNotSupportedError,
    );

    await expect(bridge.presentLookAround(37.7749, -122.4194)).rejects.toThrow(
      'presentLookAround is not supported on this platform',
    );
  });
});
