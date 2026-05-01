// Bundled notification attachment assets
export interface BundledAttachment {
  id: string;
  label: string;
  requireAsset: number;
  mimeType: 'image/png' | 'image/jpeg';
}

export const BUNDLED_ATTACHMENTS: readonly BundledAttachment[] = [
  {
    id: 'sample-1',
    label: 'Sample 1',
    requireAsset: require('@/assets/notifications/sample-1.png'),
    mimeType: 'image/png',
  },
  {
    id: 'sample-2',
    label: 'Sample 2',
    requireAsset: require('@/assets/notifications/sample-2.png'),
    mimeType: 'image/png',
  },
  {
    id: 'sample-3',
    label: 'Sample 3',
    requireAsset: require('@/assets/notifications/sample-3.jpg'),
    mimeType: 'image/jpeg',
  },
] as const;

export const DEFAULT_ATTACHMENT_ID: string | null = null;
