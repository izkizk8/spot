/**
 * T008: vision-types test — Type guards and labelFor for the Observation
 * discriminated union.
 *
 * Coverage:
 *   - isFace / isText / isBarcode for valid inputs of each kind
 *   - Type guards reject invalid inputs (wrong kind, missing kind, extra fields, null, undefined)
 *   - labelFor returns correct values:
 *     - 'Face' for face observations
 *     - The recognized text for text observations (truncated to 80 chars + ellipsis when longer)
 *     - The decoded payload for barcode observations (also truncated)
 */

import {
  isFace,
  isText,
  isBarcode,
  labelFor,
  type FaceObservation,
  type TextObservation,
  type BarcodeObservation,
  type Observation,
} from '@/modules/camera-vision/vision-types';

describe('vision-types', () => {
  describe('Type guards', () => {
    const faceObs: FaceObservation = {
      kind: 'face',
      boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
    };
    const textObs: TextObservation = {
      kind: 'text',
      boundingBox: { x: 0.5, y: 0.6, width: 0.1, height: 0.1 },
      text: 'Hello',
    };
    const barcodeObs: BarcodeObservation = {
      kind: 'barcode',
      boundingBox: { x: 0.7, y: 0.8, width: 0.2, height: 0.1 },
      payload: 'QR-PAYLOAD',
      symbology: 'QR',
    };

    describe('isFace', () => {
      it('returns true for valid face observation', () => {
        expect(isFace(faceObs)).toBe(true);
      });

      it('returns false for text observation', () => {
        expect(isFace(textObs)).toBe(false);
      });

      it('returns false for barcode observation', () => {
        expect(isFace(barcodeObs)).toBe(false);
      });

      it('returns false for invalid kind', () => {
        const invalid = { kind: 'invalid', boundingBox: {} } as unknown as Observation;
        expect(isFace(invalid)).toBe(false);
      });

      it('returns false for missing kind', () => {
        const invalid = { boundingBox: {} } as unknown as Observation;
        expect(isFace(invalid)).toBe(false);
      });

      it('returns false for null', () => {
        expect(isFace(null as unknown as Observation)).toBe(false);
      });

      it('returns false for undefined', () => {
        expect(isFace(undefined as unknown as Observation)).toBe(false);
      });
    });

    describe('isText', () => {
      it('returns true for valid text observation', () => {
        expect(isText(textObs)).toBe(true);
      });

      it('returns false for face observation', () => {
        expect(isText(faceObs)).toBe(false);
      });

      it('returns false for barcode observation', () => {
        expect(isText(barcodeObs)).toBe(false);
      });

      it('returns false for invalid kind', () => {
        const invalid = { kind: 'other', boundingBox: {} } as unknown as Observation;
        expect(isText(invalid)).toBe(false);
      });
    });

    describe('isBarcode', () => {
      it('returns true for valid barcode observation', () => {
        expect(isBarcode(barcodeObs)).toBe(true);
      });

      it('returns false for face observation', () => {
        expect(isBarcode(faceObs)).toBe(false);
      });

      it('returns false for text observation', () => {
        expect(isBarcode(textObs)).toBe(false);
      });

      it('returns false for invalid kind', () => {
        const invalid = { kind: 'wrong', boundingBox: {} } as unknown as Observation;
        expect(isBarcode(invalid)).toBe(false);
      });
    });
  });

  describe('labelFor', () => {
    it('returns "Face" for face observation', () => {
      const obs: FaceObservation = {
        kind: 'face',
        boundingBox: { x: 0, y: 0, width: 0.5, height: 0.5 },
      };
      expect(labelFor(obs)).toBe('Face');
    });

    it('returns the recognized text for text observation', () => {
      const obs: TextObservation = {
        kind: 'text',
        boundingBox: { x: 0, y: 0, width: 0.5, height: 0.1 },
        text: 'Hello World',
      };
      expect(labelFor(obs)).toBe('Hello World');
    });

    it('truncates text to 80 chars + ellipsis when longer', () => {
      const longText = 'a'.repeat(100);
      const obs: TextObservation = {
        kind: 'text',
        boundingBox: { x: 0, y: 0, width: 0.5, height: 0.1 },
        text: longText,
      };
      expect(labelFor(obs)).toBe('a'.repeat(80) + '…');
      expect(labelFor(obs).length).toBe(81); // 80 chars + 1 ellipsis
    });

    it('returns the decoded payload for barcode observation', () => {
      const obs: BarcodeObservation = {
        kind: 'barcode',
        boundingBox: { x: 0, y: 0, width: 0.3, height: 0.2 },
        payload: 'https://example.com',
      };
      expect(labelFor(obs)).toBe('https://example.com');
    });

    it('truncates barcode payload to 80 chars + ellipsis when longer', () => {
      const longPayload = 'b'.repeat(100);
      const obs: BarcodeObservation = {
        kind: 'barcode',
        boundingBox: { x: 0, y: 0, width: 0.3, height: 0.2 },
        payload: longPayload,
      };
      expect(labelFor(obs)).toBe('b'.repeat(80) + '…');
      expect(labelFor(obs).length).toBe(81);
    });

    it('preserves non-ASCII / multi-byte content in text', () => {
      const obs: TextObservation = {
        kind: 'text',
        boundingBox: { x: 0, y: 0, width: 0.5, height: 0.1 },
        text: 'こんにちは世界 🌍',
      };
      expect(labelFor(obs)).toBe('こんにちは世界 🌍');
    });

    it('preserves non-ASCII / multi-byte content in barcode payload', () => {
      const obs: BarcodeObservation = {
        kind: 'barcode',
        boundingBox: { x: 0, y: 0, width: 0.3, height: 0.2 },
        payload: 'Café ☕',
      };
      expect(labelFor(obs)).toBe('Café ☕');
    });
  });
});
