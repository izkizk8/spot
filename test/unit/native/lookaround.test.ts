import bridge from '@/native/lookaround';
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
});
