/**
 * Universal Links Lab — types (feature 041).
 */

/** Status of a configured `applinks:` domain. */
export type DomainStatus = 'configured' | 'placeholder' | 'unknown';

/** A single configured associated domain entry. */
export interface ConfiguredDomain {
  /** Raw entitlement string, e.g. `applinks:spot.example.com`. */
  readonly raw: string;
  /** Hostname extracted after the `applinks:` prefix. */
  readonly host: string;
  /** Status pill classification. */
  readonly status: DomainStatus;
}

/** A normalised incoming Universal Link event. */
export interface UniversalLinkEvent {
  /** The full URL string as received. */
  readonly url: string;
  /** Hostname parsed from the URL, or empty if it could not be parsed. */
  readonly host: string;
  /** Path portion of the URL, defaults to '/'. */
  readonly path: string;
  /** ISO-8601 timestamp when the event was received. */
  readonly receivedAt: string;
}
