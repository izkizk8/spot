---
last_verified: 2026-05-01
prerequisites:
  - macOS with Xcode (optional; expo-document-picker works in Expo Go)
  - iPhone running iOS 11+
  - Apple Developer account (free tier sufficient)
---

# How to verify Document Picker & QuickLook on iPhone

## Goal
Confirm UIDocumentPickerViewController opens and returns files of the configured
UTType filters, QLPreviewController presents document thumbnails and full previews,
and the sharing extension is invoked correctly.

## Prerequisites
- Node 20+, pnpm; `pnpm install` already run
- `expo-document-picker` and `expo-sharing` installed
- `with-documents` plugin registered in `app.json`

## Steps
1. Build the JS layer:
   ```bash
   npx expo install expo-document-picker expo-sharing
   pnpm install && pnpm check
   ```
2. Generate native project and build:
   ```bash
   npx expo prebuild --clean
   pnpm ios:ipa
   ```
3. Install the IPA per [sideload-iphone.md](sideload-iphone.md).
4. In the app, navigate to **"Documents"** in the Modules tab.
5. Confirm empty-state message "No documents picked yet".
6. Tap **Pick Document** → iOS Files picker appears.
7. Select a PDF or image from iCloud Drive or on-device Files.
8. Confirm the file row appears with name, size, and MIME type.
9. Tap the row → QLPreviewController presents the file inline.
10. Tap **Share** icon on the row → iOS share sheet opens.
11. Tap **Pick (Multiple)** and select 2–3 files → confirm all rows appear.

## Verify
- Document picker opens with correct UTType filter
- Selected file row shows name, size, and MIME type
- QuickLook preview renders the file content
- Share opens iOS share sheet with the picked file URI
- Multiple file selection returns all picked files
- On Android: SAF document picker works; no QuickLook (uses platform viewer)

## Troubleshooting
- **Picker does not open** → ensure `expo-document-picker` is installed via
  `npx expo install` and a fresh prebuild ran with `with-documents` plugin
- **QuickLook shows blank white screen** → file URI must be a local file path;
  remote URIs must be downloaded first
- **"iCloud Documents not available"** → ensure iCloud Drive is enabled in
  Settings → Apple ID → iCloud → iCloud Drive

## Implementation references
- Spec: `specs/032-document-picker-quicklook/spec.md`
- Plan: `specs/032-document-picker-quicklook/plan.md`
- Module: `src/modules/documents-lab/`
- Native bridge: `src/native/documents.ts`
- Plugin: `plugins/with-documents/`

## See Also
- [sideload-iphone.md](sideload-iphone.md) — Initial sideloading from Windows