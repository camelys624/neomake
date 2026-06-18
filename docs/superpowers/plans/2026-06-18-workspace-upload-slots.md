# Workspace Upload Slots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicate left-card history icon and make workspace uploads use square preview slots.

**Architecture:** Keep the existing `Workspace` component in `src/App.tsx`. Add focused UI tests that render `/workspace`, then update only the upload-card header and upload-slot markup. File previews use the uploaded asset `dataUrl`; the upload handler reads the selected file into a data URL before storing it.

**Tech Stack:** React, TypeScript, Testing Library, Vitest, Bun, Vite.

---

## File structure

- Create `tests/workspace.test.tsx`: workspace UI regression coverage.
- Modify `src/App.tsx`: upload-slot rendering and file data URL handling.

### Task 1: Write failing workspace UI tests

**Files:**
- Create: `tests/workspace.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { describe, expect, it, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "../src/appState";
import { App } from "../src/App";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/workspace" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  localStorage: dom.window.localStorage,
  location: dom.window.location,
  HTMLElement: dom.window.HTMLElement,
  File: dom.window.File,
  FileReader: dom.window.FileReader,
});

function renderWorkspace() {
  window.history.pushState({}, "", "http://localhost/workspace");
  localStorage.clear();
  return render(<AuthProvider><App /></AuthProvider>);
}

describe("Workspace uploads", () => {
  beforeEach(() => localStorage.clear());

  it("removes the duplicate left history icon while keeping the prompt history button", () => {
    const view = renderWorkspace();
    expect(view.queryByLabelText("查看历史")).toBeNull();
    expect(view.getByRole("button", { name: /历史/ })).toBeTruthy();
  });

  it("renders four square upload inputs for four-view mode", () => {
    const view = renderWorkspace();
    expect(view.getAllByLabelText(/上传$/)).toHaveLength(4);
    expect(view.getByText("正面")).toBeTruthy();
    expect(view.getByText("侧面")).toBeTruthy();
    expect(view.getByText("背面")).toBeTruthy();
    expect(view.getByText("俯视")).toBeTruthy();
  });

  it("shows an in-slot preview after uploading an image", async () => {
    const view = renderWorkspace();
    const file = new File(["fake-png"], "front.png", { type: "image/png" });

    fireEvent.change(view.getByLabelText("正面上传"), { target: { files: [file] } });

    await waitFor(() => expect(view.getByAltText("正面预览")).toBeTruthy());
    expect(view.getByText("front.png")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run RED test**

```bash
bun test tests/workspace.test.tsx
```

Expected: fails because `查看历史` still exists and the square-slot accessible names / preview image do not exist yet.

### Task 2: Implement upload slot UI

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add async file data reader inside `Workspace`**

Inside `Workspace`, before `gen`, add:

```ts
  async function fileToAsset(file: File, userId: string): Promise<UploadedAsset> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(new Error("图片读取失败")));
      reader.readAsDataURL(file);
    });
    return { ...asset(file.name, file.type), userId, dataUrl };
  }
```

- [ ] **Step 2: Remove duplicate left history icon**

In the upload card header, remove the `<Button variant="ghost" aria-label="查看历史" ...>` element and keep only the `CardTitle`.

- [ ] **Step 3: Replace stacked upload rows with square slot grid**

Replace the `div` wrapping `labels.map` with a grid. Each slot label must have `aria-label={`${label}上传`}`. The file input remains `sr-only`. On file change, validate MIME, await `fileToAsset(file, user?.id ?? "demo")`, replace `copy[i]`, and keep `copy.filter(Boolean)`.

Filled slot markup must include:

```tsx
<img src={files[i].dataUrl} alt={`${label}预览`} className="absolute inset-0 size-full object-cover" />
<span className="absolute left-2 top-2 rounded-full bg-stone-950/75 px-2 py-1 text-[11px] font-bold text-white">{label}</span>
<span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-stone-800 shadow-sm">{files[i].name}</span>
```

Empty slot markup must include the upload icon and text `点击上传`.

- [ ] **Step 4: Run GREEN focused test**

```bash
bun test tests/workspace.test.tsx
```

Expected: all tests in `tests/workspace.test.tsx` pass.

### Task 3: Full verification

- [ ] **Step 1: Run full tests**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 2: Run production build**

```bash
bun run build
```

Expected: TypeScript and Vite build complete successfully.
