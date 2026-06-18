# Workspace upload slots design

## Context
The workspace page already has a history button below the prompt input, so the duplicate history icon in the left upload card should be removed. The upload area should make the four-view workflow clearer by showing square upload slots and replacing each empty slot with an in-slot preview after upload.

## Design
- In `src/App.tsx`, keep the existing `Workspace` component and its state shape (`files: UploadedAsset[]`). Do not move the history dialog or change the input-area history button.
- Remove only the left-card icon button with `aria-label="查看历史"` from the upload card header.
- Render upload slots as a compact grid instead of stacked cards:
  - four-view mode: `grid-cols-2`, labels `正面`, `侧面`, `背面`, `俯视`.
  - blank-shoe mode: same slot component and styling, labels from the current `labels` array.
- Each slot remains a clickable `<label>` containing the existing hidden file `<Input type="file">` so clicking an uploaded preview replaces that slot.
- Empty slot content: dashed square, upload icon, label, `点击上传` hint.
- Filled slot content: `<img src={files[i].dataUrl} alt={`${label}预览`} />` fills the square with `object-cover`; a bottom overlay shows the file name; a top-left badge shows the slot label.
- Keep MIME validation with `validateImageMimeType`; preserve `UNSUPPORTED_IMAGE_ERROR` behavior.
- Do not add drag-and-drop behavior; the old copy said drag upload, but no drop handler exists.

## Verification
- Add/adjust React test coverage for `/workspace`:
  - left upload card no longer has `aria-label="查看历史"`.
  - bottom prompt area still has a visible `历史` button.
  - four-view mode renders four file inputs and four square upload slots.
  - uploading a PNG into the first input shows an image with alt text `正面预览`.
- Run `bun test tests/workspace.test.tsx`.
- Run `bun test`.
- Run `bun run build`.
