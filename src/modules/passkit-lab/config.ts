/**
 * PassKit Lab build-time configuration.
 * Feature: 036-passkit-wallet
 *
 * Educational scaffold defaults — operators substitute these values via
 * `with-passkit` config plugin overrides + a real Pass Type ID.
 *
 * The placeholder Pass Type ID is detected by `usePassKit` (Contract H10)
 * to gate the EntitlementBanner. When operator overrides land, the array
 * no longer contains the literal `pass.example.placeholder` substring and
 * the banner hides.
 *
 * @see specs/036-passkit-wallet/contracts/usePassKit-hook.md
 */

/**
 * Pass Type identifiers configured for the running build. Default placeholder
 * value matches the `with-passkit` plugin's default entitlement array.
 */
export const PASSKIT_ENTITLEMENT: readonly string[] = [
  '$(TeamIdentifierPrefix)pass.example.placeholder',
];

/**
 * Build-time flag indicating whether a signed `.pkpass` sample is bundled
 * with the educational scaffold. Defaults to `false` per FR-006 — no signed
 * binary is shipped with the repo.
 */
export const __PASSKIT_BUNDLED_SAMPLE__ = false;
