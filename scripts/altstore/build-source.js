#!/usr/bin/env node
/**
 * Generate or update `docs/altstore/source.json` for the AltStore source channel.
 *
 * Reads:
 *   - app.json: bundleIdentifier, app name, deploymentTarget
 *   - existing source.json (if any): prior versions[]
 *   - the IPA file on disk: byte size
 *   - CLI args: --version, --build-version, --ipa, --date, --out [, --app-json, --source-json]
 *
 * Writes:
 *   - source.json with the new version merged in (idempotent on re-run for same version+build).
 *
 * Exits non-zero with a clear message on any validation or IO failure.
 *
 * See specs/088-altstore-source/plan.md and docs/_decisions/0006-altstore-source-distribution.md.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO = 'izkizk8/spot';
const SOURCE_DEFAULTS = {
  name: 'spot dev',
  subtitle: 'Personal Expo lab build',
  description: 'OTA channel for spot. Re-signed on-device by AltStore using your free Apple ID.',
  iconURL: `https://raw.githubusercontent.com/${REPO}/dev/assets/images/icon.png`,
  tintColor: '#0A84FF',
  website: `https://github.com/${REPO}`,
};

const APP_DEFAULTS = {
  developerName: 'izkizk8',
  subtitle: 'Expo iOS playground',
  localizedDescription:
    'Personal lab app exploring Expo + native iOS APIs. Distributed via AltStore source.',
  category: 'developer',
  appPermissions: { entitlements: [], privacy: [] },
};

function parseArgs(argv) {
  const args = {};
  const aliases = {
    v: 'version',
    b: 'buildVersion',
    i: 'ipa',
    d: 'date',
    o: 'out',
  };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('-')) continue;
    const flag = token.replace(/^--?/, '');
    const key = toCamel(aliases[flag] ?? flag);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('-')) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function toCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function usage() {
  const text = [
    'Usage: node scripts/altstore/build-source.js \\',
    '  --version <semver> \\',
    '  --build-version <int> \\',
    '  --ipa <path-to-ipa> \\',
    '  --date <YYYY-MM-DD> \\',
    '  --out <path-to-source.json> \\',
    '  [--app-json <path>] [--source-json <existing-source-path>]',
    '',
    'Idempotent: re-running with the same --version/--build-version overwrites that entry instead of duplicating.',
  ].join('\n');
  console.error(text);
}

function fail(msg) {
  console.error(`build-source: ${msg}`);
  process.exit(1);
}

function compareSemver(a, b) {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

function loadJSON(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

function buildSkeleton(app) {
  return {
    ...SOURCE_DEFAULTS,
    apps: [
      {
        name: app.name,
        bundleIdentifier: app.bundleIdentifier,
        developerName: APP_DEFAULTS.developerName,
        subtitle: APP_DEFAULTS.subtitle,
        localizedDescription: APP_DEFAULTS.localizedDescription,
        iconURL: SOURCE_DEFAULTS.iconURL,
        tintColor: SOURCE_DEFAULTS.tintColor,
        category: APP_DEFAULTS.category,
        screenshots: [],
        versions: [],
        appPermissions: APP_DEFAULTS.appPermissions,
      },
    ],
    news: [],
  };
}

function mergeVersion(versions, entry) {
  const matchIdx = versions.findIndex(
    (v) => v.version === entry.version && v.buildVersion === entry.buildVersion,
  );
  const next = [...versions];
  if (matchIdx >= 0) {
    next[matchIdx] = entry;
  } else {
    next.push(entry);
  }
  next.sort((a, b) => {
    const cmp = compareSemver(b.version, a.version);
    if (cmp !== 0) return cmp;
    const ba = Number.parseInt(a.buildVersion, 10) || 0;
    const bb = Number.parseInt(b.buildVersion, 10) || 0;
    return bb - ba;
  });
  return next;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    usage();
    process.exit(0);
  }

  const required = ['version', 'buildVersion', 'ipa', 'date', 'out'];
  const missing = required.filter((k) => !args[k] || args[k] === true);
  if (missing.length > 0) {
    usage();
    fail(
      `missing required arg(s): ${missing
        .map((m) => `--${m.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`)
        .join(', ')}`,
    );
  }

  if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(args.version)) {
    fail(`--version must be semver (e.g. 1.2.3); got "${args.version}"`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    fail(`--date must be YYYY-MM-DD; got "${args.date}"`);
  }
  if (!fs.existsSync(args.ipa)) {
    fail(`IPA not found: ${args.ipa}`);
  }

  const appJsonPath = args.appJson ?? path.resolve('app.json');
  if (!fs.existsSync(appJsonPath)) {
    fail(`app.json not found at ${appJsonPath}`);
  }
  const appJson = loadJSON(appJsonPath);
  const expo = appJson.expo ?? {};
  const bundleIdentifier = expo.ios?.bundleIdentifier;
  const appName = expo.name;
  const deploymentTarget = expo.ios?.deploymentTarget ?? '16.0';
  if (!bundleIdentifier) fail('app.json: missing expo.ios.bundleIdentifier');
  if (!appName) fail('app.json: missing expo.name');

  if (expo.version && expo.version !== args.version) {
    fail(
      `version mismatch: --version=${args.version} but app.json expo.version=${expo.version}. Bump app.json before tagging.`,
    );
  }

  const sourcePath = args.sourceJson ?? args.out;
  let source;
  if (fs.existsSync(sourcePath)) {
    source = loadJSON(sourcePath);
  } else {
    source = buildSkeleton({ name: appName, bundleIdentifier });
  }

  if (!Array.isArray(source.apps) || source.apps.length === 0) {
    fail('source.json has no apps[]; cannot merge version');
  }
  const app = source.apps.find((a) => a.bundleIdentifier === bundleIdentifier) ?? source.apps[0];
  if (app.bundleIdentifier !== bundleIdentifier) {
    fail(
      `bundleIdentifier mismatch: source.json has ${app.bundleIdentifier}, app.json has ${bundleIdentifier}`,
    );
  }

  const ipaSize = fs.statSync(args.ipa).size;
  const downloadURL = `https://github.com/${REPO}/releases/download/v${args.version}/spot-${args.version}.ipa`;

  const versionEntry = {
    version: args.version,
    buildVersion: String(args.buildVersion),
    date: args.date,
    localizedDescription: `Release v${args.version}.`,
    downloadURL,
    size: ipaSize,
    minOSVersion: deploymentTarget,
  };

  app.versions = mergeVersion(app.versions ?? [], versionEntry);

  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(source, null, 2)}\n`);

  console.log(
    `build-source: wrote ${outPath} (app=${bundleIdentifier}, versions=${app.versions.length}, latest=${app.versions[0].version})`,
  );
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
}

module.exports = { mergeVersion, compareSemver, buildSkeleton };
