/**
 * AASA template generation — feature 041 / Universal Links Lab.
 *
 * Produces the recommended `apple-app-site-association` JSON for the
 * configured iOS bundle identifier. The file MUST be hosted at
 * `https://<your-domain>/.well-known/apple-app-site-association`,
 * served with `Content-Type: application/json`, **without** a `.json`
 * extension and **without** any redirects.
 *
 * @see https://developer.apple.com/documentation/xcode/supporting-associated-domains
 */

/** The Apple App ID prefix placeholder; users must replace with their Team ID. */
export const TEAM_ID_PLACEHOLDER = 'TEAMID';

export interface AASADetailEntry {
  readonly appID: string;
  readonly paths: readonly string[];
}

export interface AASADocument {
  readonly applinks: {
    readonly details: readonly AASADetailEntry[];
  };
}

export interface BuildAASAOptions {
  /** Reverse-DNS bundle identifier, e.g. `com.izkizk8.spot`. */
  readonly bundleIdentifier: string;
  /** Apple Developer Team ID. Defaults to the `TEAMID` placeholder. */
  readonly teamId?: string;
  /** Optional path patterns; defaults to `["*"]` (match every path). */
  readonly paths?: readonly string[];
}

/**
 * Build a minimal, valid AASA document for a single app/bundle.
 * Returned object is JSON-serialisable; see {@link aasaToJsonString}
 * for a deterministic, pretty-printed string representation.
 */
export function buildAASA(options: BuildAASAOptions): AASADocument {
  const teamId = options.teamId ?? TEAM_ID_PLACEHOLDER;
  const paths = options.paths !== undefined && options.paths.length > 0 ? options.paths : ['*'];
  return {
    applinks: {
      details: [
        {
          appID: `${teamId}.${options.bundleIdentifier}`,
          paths: [...paths],
        },
      ],
    },
  };
}

/**
 * Pretty-print an AASA document to a deterministic JSON string
 * (2-space indent, trailing newline) suitable for clipboard / file
 * output.
 */
export function aasaToJsonString(doc: AASADocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}
