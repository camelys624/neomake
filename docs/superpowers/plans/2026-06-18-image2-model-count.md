# Image2 Model Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an image2 model selector and 1-8 output-count control to workspace generation.

**Architecture:** Keep `configurable-image2` as copied reference material under `integrations/`. Implement runtime behavior in TypeScript: shared option types in `src/lib/types.ts`, request mapping in `src/server/ai/imageProvider.ts`, pass-through in `src/server/workbench.ts`, and controls in `src/App.tsx`.

**Tech Stack:** React, TypeScript, Bun, Vitest, Testing Library.

---

## File structure

- Create/copy `integrations/configurable-image2/`: archived skill reference.
- Modify `src/lib/types.ts`: model union type.
- Modify `src/server/ai/imageProvider.ts`: option shape, model/size/count mapping, output count.
- Modify `src/server/workbench.ts`: accept and pass generation options.
- Modify `src/App.tsx`: model selector and output count input before History.
- Modify `tests/generation.test.ts`: request mapping and count behavior.
- Modify `tests/workspace.test.tsx`: control rendering and count clamp behavior.

### Task 1: Tests first

- [ ] **Step 1: Update `tests/generation.test.ts`**

Add tests that call `buildGptImageRequest` with `{ model: "image2-4k", outputCount: 8 }` and expect `model === "gpt-image-2-4K"`, `size === "3840x2160"`, and `n === 8`. Add a generation test that uses `outputCount: 3` and expects `submitGeneration(...).images` to have length `3`.

- [ ] **Step 2: Update `tests/workspace.test.tsx`**

Add a test that renders the workspace and expects a combobox named `模型` with value `image2 · 1K`, a spinbutton named `出图数量` with value `2`, then changes the count to `12` and expects the spinbutton value to become `8`.

- [ ] **Step 3: Run RED tests**

```bash
bun test tests/generation.test.ts tests/workspace.test.tsx
```

Expected: fails because option fields and controls do not exist yet.

### Task 2: Implement model and count plumbing

- [ ] **Step 1: Extract the skill reference**

Use Python or another archive-safe command to extract `/mnt/c/Users/Janssen/Downloads/02 - Configurable-image2(2).zip` into `integrations/configurable-image2/`. Preserve `SKILL.md`, `agents/openai.yaml`, and `scripts/image2_cli.py`.

- [ ] **Step 2: Update `src/lib/types.ts`**

Add:

```ts
export type ImageGenerationModel = "image2-1k" | "image2-2k" | "image2-4k";
```

- [ ] **Step 3: Update `src/server/ai/imageProvider.ts`**

Import `ImageGenerationModel`. Extend `GenerateShoeImagesInput` with `model: ImageGenerationModel; outputCount: number`. Add `IMAGE2_MODEL_CONFIG` mapping. `buildGptImageRequest` must return `model`, `size`, `quality: "high"`, `n`, `prompt`, `mode`, and `source_asset_ids`. Add `clampOutputCount(value: number)` returning an integer between 1 and 8. `generateShoeImages` must return `clampOutputCount(input.outputCount)` placeholder images.

- [ ] **Step 4: Update `src/server/workbench.ts`**

Accept `model: ImageGenerationModel` and `outputCount: number` in `submitGeneration` input and pass them through to `generateShoeImages`.

### Task 3: Implement workspace controls

- [ ] **Step 1: Update `src/App.tsx` state**

Add `const [generationModel, setGenerationModel] = React.useState<ImageGenerationModel>("image2-1k");` and `const [outputCount, setOutputCount] = React.useState(2);`.

- [ ] **Step 2: Pass options in `gen`**

Call `submitGeneration({ userId, mode, prompt, assets: inputFiles, model: generationModel, outputCount })`.

- [ ] **Step 3: Add toolbar controls before History**

In the bottom toolbar left group, render:

```tsx
<Field label="模型"><Select value={generationModel} onChange={(e) => setGenerationModel(e.target.value as ImageGenerationModel)}>...</Select></Field>
<Field label="出图数量"><Input type="number" min={1} max={8} step={1} value={outputCount} onChange={...clamp...} /></Field>
```

Use compact styling so the controls sit before `历史` and `清空`.

- [ ] **Step 4: Run GREEN focused tests**

```bash
bun test tests/generation.test.ts tests/workspace.test.tsx
```

Expected: all focused tests pass.

### Task 4: Verification

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
