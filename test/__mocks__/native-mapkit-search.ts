// Mock state for the native module
let mockModule: { search: (query: string, region: unknown) => Promise<unknown[]> } | null = {
  search: jest.fn(async () => {
    if (mockThrow) throw mockThrow;
    return mockResult;
  }),
};
let mockResult: unknown[] = [];
let mockThrow: Error | null = null;

// Mock requireOptionalNativeModule
export function __mockRequireOptionalNativeModule(moduleName: string) {
  if (moduleName === 'SpotMapKitSearch') {
    return mockModule;
  }
  return null;
}

// Mock control helpers
export function __setSearchModule(
  module: { search: (query: string, region: unknown) => Promise<unknown[]> } | null,
) {
  mockModule = module;
}

export function __setSearchResult(results: unknown[]) {
  mockResult = results;
  // Update the search function to return new results
  if (mockModule) {
    mockModule.search = jest.fn(async () => {
      if (mockThrow) throw mockThrow;
      return mockResult;
    });
  }
}

export function __setSearchThrow(error: Error | null) {
  mockThrow = error;
}

export function __resetSearchMock() {
  mockResult = [];
  mockThrow = null;
  mockModule = {
    search: jest.fn(async () => {
      if (mockThrow) throw mockThrow;
      return mockResult;
    }),
  };
}
