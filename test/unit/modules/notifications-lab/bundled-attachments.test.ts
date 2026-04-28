import {
  BUNDLED_ATTACHMENTS,
  DEFAULT_ATTACHMENT_ID,
} from '@/modules/notifications-lab/bundled-attachments';

describe('bundled-attachments', () => {
  it('has exactly 3 entries with unique ids', () => {
    expect(BUNDLED_ATTACHMENTS).toHaveLength(3);
    const ids = BUNDLED_ATTACHMENTS.map((a) => a.id);
    expect(ids).toEqual(['sample-1', 'sample-2', 'sample-3']);
  });

  it('each requireAsset is a non-zero number (module reference)', () => {
    BUNDLED_ATTACHMENTS.forEach((attachment) => {
      // require() returns a number (React Native asset ID) or object (metro bundler reference)
      expect(attachment.requireAsset).toBeDefined();
      expect(attachment.requireAsset).not.toBe(0);
    });
  });

  it('mimeType matches the entry (sample-1/2 are PNG, sample-3 is JPEG)', () => {
    const sample1 = BUNDLED_ATTACHMENTS.find((a) => a.id === 'sample-1');
    expect(sample1?.mimeType).toBe('image/png');

    const sample2 = BUNDLED_ATTACHMENTS.find((a) => a.id === 'sample-2');
    expect(sample2?.mimeType).toBe('image/png');

    const sample3 = BUNDLED_ATTACHMENTS.find((a) => a.id === 'sample-3');
    expect(sample3?.mimeType).toBe('image/jpeg');
  });

  it('DEFAULT_ATTACHMENT_ID is null', () => {
    expect(DEFAULT_ATTACHMENT_ID).toBeNull();
  });
});
