/**
 * Tests for the with-app-intents config plugin.
 *
 * Asserts:
 * - All four Swift files are added to the main app target's
 *   compile sources.
 * - No new target is added; Info.plist is not touched.
 * - Idempotent: a second invocation MUST NOT add duplicate file refs.
 * - Disjoint from with-live-activity (FR-030, SC-011): a fixture
 *   pre-seeded with the live-activity widget target / file refs is
 *   left byte-identical for those regions after withAppIntents runs.
 */

interface FileRef {
  uuid: string;
  path: string;
  target: string;
  sourceTree?: string;
}

interface BuildPhaseEntry {
  fileRef: FileRef;
  targetUuid: string;
}

interface MockProject {
  added: FileRef[];
  buildPhase: BuildPhaseEntry[];
  groups: { uuid: string; name: string }[];
  liveActivityTarget: { uuid: string; name: string };
  liveActivityFiles: FileRef[];
  infoPlistTouched: boolean;
  targetsAdded: { uuid: string; name: string }[];
  // Methods
  pbxTargetByName: (name: string) => { uuid: string; name: string } | undefined;
  getFirstTarget: () => { uuid: string; name: string };
  hasFile: (p: string) => boolean;
  addFile: (
    p: string,
    groupUuid: string | undefined,
    opts?: { sourceTree?: string; target?: string },
  ) => FileRef;
  addToPbxSourcesBuildPhase: (fileRef: FileRef, targetUuid: string) => void;
  addPbxGroup: (files: string[], name: string, path: string) => { uuid: string };
  addToPbxGroup: (groupUuid: string, parentUuid: string) => void;
  getFirstProject: () => { firstProject: { mainGroup: string } };
  addTarget: (name: string, type: string) => { uuid: string; name: string };
}

function makeMockProject(): MockProject {
  const liveActivityTargetObj = { uuid: 'live-activity-uuid', name: 'LiveActivityDemoWidget' };
  const liveActivityFiles: FileRef[] = [
    {
      uuid: 'la-file-1',
      path: '../ios-widget/LiveActivityDemoWidget.swift',
      target: liveActivityTargetObj.uuid,
    },
    {
      uuid: 'la-file-2',
      path: '../ios-widget/LiveActivityDemoAttributes.swift',
      target: liveActivityTargetObj.uuid,
    },
    {
      uuid: 'la-file-3',
      path: '../ios-widget/LiveActivityDemoModule.swift',
      target: 'main-target-uuid',
    },
  ];

  const project: MockProject = {
    added: [...liveActivityFiles],
    buildPhase: liveActivityFiles.map((f) => ({ fileRef: f, targetUuid: f.target })),
    groups: [],
    liveActivityTarget: liveActivityTargetObj,
    liveActivityFiles,
    infoPlistTouched: false,
    targetsAdded: [liveActivityTargetObj],
    pbxTargetByName: (name) => {
      if (name === 'spot') return { uuid: 'main-target-uuid', name: 'spot' };
      if (name === liveActivityTargetObj.name) return liveActivityTargetObj;
      return undefined;
    },
    getFirstTarget: () => ({ uuid: 'main-target-uuid', name: 'spot' }),
    hasFile: (p) => project.added.some((f) => f.path === p),
    addFile: (p, _gid, opts) => {
      const ref: FileRef = {
        uuid: `f-${project.added.length + 1}`,
        path: p,
        target: opts?.target ?? '',
        sourceTree: opts?.sourceTree,
      };
      project.added.push(ref);
      return ref;
    },
    addToPbxSourcesBuildPhase: (fileRef, targetUuid) => {
      project.buildPhase.push({ fileRef, targetUuid });
    },
    addPbxGroup: (_files, name, _path) => {
      const g = { uuid: `g-${project.groups.length + 1}`, name };
      project.groups.push(g);
      return g;
    },
    addToPbxGroup: () => {},
    getFirstProject: () => ({ firstProject: { mainGroup: 'main-group-uuid' } }),
    addTarget: (name) => {
      const t = { uuid: `t-${project.targetsAdded.length + 1}`, name };
      project.targetsAdded.push(t);
      return t;
    },
  };
  return project;
}

const projectRef: { current: MockProject | null } = { current: null };

jest.mock('@expo/config-plugins', () => ({
  __esModule: true,
  withXcodeProject: jest.fn((config: unknown, cb: (cfg: unknown) => unknown) => {
    return cb({
      ...(config as object),
      modResults: projectRef.current,
      modRequest: { projectName: 'spot', projectRoot: '/mock/project' },
    });
  }),
}));

const SWIFT_FILES = [
  'LogMoodIntent.swift',
  'GetLastMoodIntent.swift',
  'GreetUserIntent.swift',
  'SpotAppShortcuts.swift',
];

const expectedPaths = SWIFT_FILES.map((f) => `../native/ios/app-intents/${f}`);

function snapshotLiveActivityState(p: MockProject): {
  files: FileRef[];
  buildPhase: BuildPhaseEntry[];
  targets: { uuid: string; name: string }[];
} {
  return {
    files: p.added.filter((f) => f.path.startsWith('../ios-widget/')).map((f) => ({ ...f })),
    buildPhase: p.buildPhase
      .filter((b) => b.fileRef.path.startsWith('../ios-widget/'))
      .map((b) => ({ fileRef: { ...b.fileRef }, targetUuid: b.targetUuid })),
    targets: p.targetsAdded.map((t) => ({ ...t })),
  };
}

describe('with-app-intents config plugin', () => {
  beforeEach(() => {
    projectRef.current = makeMockProject();
    jest.resetModules();
  });

  it('adds all four Swift files to the main app target compile sources', () => {
    const withAppIntents = require('../../../../plugins/with-app-intents/index').default as (
      cfg: unknown,
    ) => unknown;
    withAppIntents({});

    const p = projectRef.current!;
    for (const expected of expectedPaths) {
      const ref = p.added.find((f) => f.path === expected);
      expect(ref).toBeDefined();
      expect(ref!.target).toBe('main-target-uuid');
    }
    // Each file is added to the build phase against the main target.
    for (const expected of expectedPaths) {
      const inPhase = p.buildPhase.find(
        (b) => b.fileRef.path === expected && b.targetUuid === 'main-target-uuid',
      );
      expect(inPhase).toBeDefined();
    }
  });

  it('does not add a new target', () => {
    const before = projectRef.current!.targetsAdded.length;
    const withAppIntents = require('../../../../plugins/with-app-intents/index').default as (
      cfg: unknown,
    ) => unknown;
    withAppIntents({});
    expect(projectRef.current!.targetsAdded).toHaveLength(before);
  });

  it('does not touch Info.plist', () => {
    const withAppIntents = require('../../../../plugins/with-app-intents/index').default as (
      cfg: unknown,
    ) => unknown;
    withAppIntents({});
    expect(projectRef.current!.infoPlistTouched).toBe(false);
  });

  it('leaves the live-activity widget state byte-identical (FR-030, SC-011)', () => {
    const before = snapshotLiveActivityState(projectRef.current!);
    const withAppIntents = require('../../../../plugins/with-app-intents/index').default as (
      cfg: unknown,
    ) => unknown;
    withAppIntents({});
    const after = snapshotLiveActivityState(projectRef.current!);
    expect(after).toEqual(before);
  });

  it('is idempotent: a second run does not duplicate file refs', () => {
    const withAppIntents = require('../../../../plugins/with-app-intents/index').default as (
      cfg: unknown,
    ) => unknown;
    withAppIntents({});
    const afterFirst = projectRef.current!.added.length;
    const buildPhaseAfterFirst = projectRef.current!.buildPhase.length;

    withAppIntents({});
    expect(projectRef.current!.added).toHaveLength(afterFirst);
    expect(projectRef.current!.buildPhase).toHaveLength(buildPhaseAfterFirst);
  });

  it('exports a function as default plugin', () => {
    const withAppIntents = require('../../../../plugins/with-app-intents/index').default;
    expect(typeof withAppIntents).toBe('function');
  });
});
