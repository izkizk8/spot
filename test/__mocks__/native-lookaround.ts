// Mock state for the native module
let mockModule: {
  presentLookAround: (lat: number, lng: number) => Promise<{ shown: boolean }>;
} | null = {
  presentLookAround: jest.fn(async () => {
    if (mockThrow) throw mockThrow;
    return mockResult;
  }),
};
let mockResult: { shown: boolean } = { shown: true };
let mockThrow: Error | null = null;

// Mock requireOptionalNativeModule
export function __mockRequireOptionalNativeModule(moduleName: string) {
  if (moduleName === 'SpotLookAround') {
    return mockModule;
  }
  return null;
}

// Mock control helpers
export function __setLookAroundModule(
  module: { presentLookAround: (lat: number, lng: number) => Promise<{ shown: boolean }> } | null,
) {
  mockModule = module;
}

export function __setLookAroundResult(result: { shown: boolean }) {
  mockResult = result;
  // Update the function to return new result
  if (mockModule) {
    mockModule.presentLookAround = jest.fn(async () => {
      if (mockThrow) throw mockThrow;
      return mockResult;
    });
  }
}

export function __setLookAroundThrow(error: Error | null) {
  mockThrow = error;
}

export function __resetLookAroundMock() {
  mockResult = { shown: true };
  mockThrow = null;
  mockModule = {
    presentLookAround: jest.fn(async () => {
      if (mockThrow) throw mockThrow;
      return mockResult;
    }),
  };
}
