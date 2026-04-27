import { describe, it, expect } from '@jest/globals';
import { TINTS, DEFAULT_CONFIG, validate } from '@/modules/widgets-lab/widget-config';
import type { WidgetConfig } from '@/modules/widgets-lab/widget-config';

describe('widget-config', () => {
  describe('TINTS', () => {
    it('should have exactly 4 tint values', () => {
      expect(TINTS).toHaveLength(4);
    });

    it('should contain exact members: blue, green, orange, pink', () => {
      expect(TINTS).toEqual(['blue', 'green', 'orange', 'pink']);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should match data-model.md specification', () => {
      expect(DEFAULT_CONFIG).toEqual({
        showcaseValue: 'Hello, Widget!',
        counter: 0,
        tint: 'blue',
      });
    });
  });

  describe('validate', () => {
    it('should clamp counter to [-9999, 9999] range', () => {
      const overMax: Partial<WidgetConfig> = {
        showcaseValue: 'Test',
        counter: 10000,
        tint: 'blue',
      };
      const validated = validate(overMax);
      expect(validated.counter).toBe(9999);

      const underMin: Partial<WidgetConfig> = {
        showcaseValue: 'Test',
        counter: -10000,
        tint: 'blue',
      };
      const validatedMin = validate(underMin);
      expect(validatedMin.counter).toBe(-9999);

      const withinRange: Partial<WidgetConfig> = {
        showcaseValue: 'Test',
        counter: 50,
        tint: 'blue',
      };
      const validatedOk = validate(withinRange);
      expect(validatedOk.counter).toBe(50);
    });

    it('should fall back to default tint for unknown values', () => {
      const unknownTint: Partial<WidgetConfig> = {
        showcaseValue: 'Test',
        counter: 0,
        tint: 'purple' as any, // invalid tint
      };
      const validated = validate(unknownTint);
      expect(validated.tint).toBe(DEFAULT_CONFIG.tint);
    });

    it('should accept any string for showcaseValue', () => {
      const emptyValue: Partial<WidgetConfig> = {
        showcaseValue: '',
        counter: 0,
        tint: 'blue',
      };
      const validated = validate(emptyValue);
      expect(validated.showcaseValue).toBe('');

      const whitespace: Partial<WidgetConfig> = {
        showcaseValue: '   ',
        counter: 0,
        tint: 'blue',
      };
      const validatedWhitespace = validate(whitespace);
      expect(validatedWhitespace.showcaseValue).toBe('   ');

      const longValue: Partial<WidgetConfig> = {
        showcaseValue: 'A'.repeat(1000),
        counter: 0,
        tint: 'blue',
      };
      const validatedLong = validate(longValue);
      expect(validatedLong.showcaseValue).toBe('A'.repeat(1000));
    });

    it('should return a complete WidgetConfig for valid input', () => {
      const input: Partial<WidgetConfig> = {
        showcaseValue: 'Valid Test',
        counter: 42,
        tint: 'green',
      };
      const validated = validate(input);
      expect(validated).toEqual({
        showcaseValue: 'Valid Test',
        counter: 42,
        tint: 'green',
      });
    });

    it('should handle missing fields with defaults', () => {
      const partial: Partial<WidgetConfig> = {
        showcaseValue: 'Only this',
      };
      const validated = validate(partial);
      expect(validated.showcaseValue).toBe('Only this');
      expect(validated.counter).toBe(DEFAULT_CONFIG.counter);
      expect(validated.tint).toBe(DEFAULT_CONFIG.tint);
    });
  });
});
