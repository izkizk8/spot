import bridge from '@/native/lookaround.android';
import { MapKitNotSupportedError } from '@/native/lookaround.types';

describe('lookaround.android', () => {
  it('always throws MapKitNotSupportedError', async () => {
    await expect(bridge.presentLookAround(37.7749, -122.4194)).rejects.toThrow(
      MapKitNotSupportedError,
    );

    await expect(bridge.presentLookAround(37.7749, -122.4194)).rejects.toThrow(
      'presentLookAround is not supported on this platform',
    );
  });
});
