/**
 * with-universal-links — Expo config plugin for feature 041.
 *
 * Idempotent, additive entitlement mutation:
 *   - union-merges `com.apple.developer.associated-domains` with
 *     `applinks:spot.example.com` (placeholder; replace with the
 *     real domain in your app.json `expo.ios.associatedDomains`).
 *   - preserves every prior entry verbatim in source order.
 *   - coexists with all other entitlement plugins (keychain, sign-in
 *     with apple, app groups, passkit) — none of them touch the
 *     associated-domains key.
 *
 * Pure helper `applyAssociatedDomains(modResults)` is exported so
 * unit tests can assert byte-identical idempotency without driving
 * the full mod runner.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist } from '@expo/config-plugins';

const ASSOCIATED_DOMAINS_KEY = 'com.apple.developer.associated-domains';
export const DEMO_DOMAIN = 'applinks:spot.example.com';

/**
 * Pure mutation: returns a new `Record<string, unknown>` with
 * com.apple.developer.associated-domains union-merged. Preserves prior
 * entries' order; appends DEMO_DOMAIN if not already present. Defensive:
 * missing or non-array input is treated as [].
 */
export function applyAssociatedDomains(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };

  const prior = next[ASSOCIATED_DOMAINS_KEY];
  let priorDomains: string[] = [];

  if (Array.isArray(prior)) {
    priorDomains = prior.filter((v): v is string => typeof v === 'string');
  } else if (prior !== undefined) {
    console.warn(
      'with-universal-links: com.apple.developer.associated-domains was not an array; replacing.',
    );
  }

  const merged = [...priorDomains];
  if (!merged.includes(DEMO_DOMAIN)) {
    merged.push(DEMO_DOMAIN);
  }

  next[ASSOCIATED_DOMAINS_KEY] = merged;
  return next;
}

const withUniversalLinks: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults = applyAssociatedDomains(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withUniversalLinks;
