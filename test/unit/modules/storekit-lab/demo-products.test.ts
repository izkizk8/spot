/**
 * @jest-environment node
 *
 * Tests for the demo-products catalog and pure helpers.
 */

import {
  byType,
  DEMO_PRODUCT_IDS,
  DEMO_PRODUCTS,
  formatPrice,
  isProductId,
  isSubscriptionType,
  PRODUCT_TYPES,
} from '@/modules/storekit-lab/demo-products';

describe('DEMO_PRODUCTS catalog', () => {
  it('exposes one product per StoreKit 2 type', () => {
    const types = DEMO_PRODUCTS.map((p) => p.type).toSorted();
    expect(types).toEqual([...PRODUCT_TYPES].toSorted());
  });

  it('catalog is frozen', () => {
    expect(Object.isFrozen(DEMO_PRODUCTS)).toBe(true);
  });

  it('every product has a non-empty id, displayName, description', () => {
    DEMO_PRODUCTS.forEach((p) => {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.displayName.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
    });
  });

  it('DEMO_PRODUCT_IDS mirrors DEMO_PRODUCTS in order', () => {
    expect(DEMO_PRODUCT_IDS).toEqual(DEMO_PRODUCTS.map((p) => p.id));
    expect(Object.isFrozen(DEMO_PRODUCT_IDS)).toBe(true);
  });

  it('product ids are reverse-DNS-style', () => {
    DEMO_PRODUCTS.forEach((p) => {
      expect(isProductId(p.id)).toBe(true);
    });
  });
});

describe('isProductId', () => {
  it('rejects empty string', () => {
    expect(isProductId('')).toBe(false);
  });

  it('rejects single-segment ids', () => {
    expect(isProductId('coins')).toBe(false);
  });

  it('accepts well-formed reverse-DNS ids', () => {
    expect(isProductId('com.izkizk8.spot.coins.100')).toBe(true);
    expect(isProductId('com.acme.app')).toBe(true);
  });

  it('rejects ids with invalid characters', () => {
    expect(isProductId('com.izkizk8 spot.coins')).toBe(false);
    expect(isProductId('com..coins')).toBe(false);
  });
});

describe('byType', () => {
  it('filters consumable products', () => {
    const out = byType(DEMO_PRODUCTS, 'consumable');
    expect(out).toHaveLength(1);
    expect(out[0]?.type).toBe('consumable');
  });

  it('filters auto-renewable products', () => {
    const out = byType(DEMO_PRODUCTS, 'autoRenewable');
    expect(out).toHaveLength(1);
    expect(out[0]?.type).toBe('autoRenewable');
  });

  it('returns an empty array when no product matches', () => {
    const out = byType([], 'consumable');
    expect(out).toEqual([]);
  });
});

describe('formatPrice', () => {
  it('returns displayPrice when present', () => {
    expect(formatPrice({ displayPrice: '$0.99', price: '0.99', currencyCode: 'USD' })).toBe(
      '$0.99',
    );
  });

  it('falls back to "<price> <code>" when displayPrice is empty', () => {
    expect(formatPrice({ displayPrice: '', price: '1.00', currencyCode: 'USD' })).toBe('1.00 USD');
  });

  it('returns "—" when nothing is available', () => {
    expect(formatPrice({ displayPrice: '', price: '', currencyCode: '' })).toBe('—');
  });
});

describe('isSubscriptionType', () => {
  it('returns true for autoRenewable and nonRenewing', () => {
    expect(isSubscriptionType('autoRenewable')).toBe(true);
    expect(isSubscriptionType('nonRenewing')).toBe(true);
  });

  it('returns false for consumable and nonConsumable', () => {
    expect(isSubscriptionType('consumable')).toBe(false);
    expect(isSubscriptionType('nonConsumable')).toBe(false);
  });
});
