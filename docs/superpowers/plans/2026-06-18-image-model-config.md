# Image Model Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-side config contract for the real image model endpoint and API key.

**Architecture:** `src/server/ai/config.ts` owns the two environment variable names and validation. `src/server/ai/imageProvider.ts` calls the config helper before generating placeholder images so the real generation path fails fast when model config is missing. Tests in `tests/generation.test.ts` prove both missing-config and configured behavior.

**Tech Stack:** TypeScript, Bun, Vitest, Vite path aliases.

---

## File structure

- Create `.env.example`: documents `IMAGE_MODEL_ENDPOINT` and `IMAGE_MODEL_API_KEY` without real values.
- Create `src/server/ai/config.ts`: server-only environment reader and validation.
- Modify `src/server/ai/imageProvider.ts`: call `getImageModelConfig()` at generation start; keep existing placeholder output unchanged.
- Modify `tests/generation.test.ts`: TDD coverage for missing env and configured env.

### Task 1: Add failing config tests

**Files:**
- Modify: `tests/generation.test.ts`

- [ ] **Step 1: Add imports and env preservation**

Add `generateShoeImages` to the existing import from `../src/server/ai/imageProvider`.

Add this helper state inside the `describe("generation adapter", () => { ... })` block before `beforeEach`:

```ts
  const originalEndpoint = process.env.IMAGE_MODEL_ENDPOINT;
  const originalApiKey = process.env.IMAGE_MODEL_API_KEY;

  function clearImageModelEnv() {
    delete process.env.IMAGE_MODEL_ENDPOINT;
    delete process.env.IMAGE_MODEL_API_KEY;
  }

  function setImageModelEnv() {
    process.env.IMAGE_MODEL_ENDPOINT = "https://image.example.test/generate";
    process.env.IMAGE_MODEL_API_KEY = "test-key";
  }
```

- [ ] **Step 2: Restore env around each test**

Replace the current `beforeEach(() => resetStore());` with:

```ts
  beforeEach(() => {
    resetStore();
    clearImageModelEnv();
  });

  afterEach(() => {
    if (originalEndpoint === undefined) delete process.env.IMAGE_MODEL_ENDPOINT;
    else process.env.IMAGE_MODEL_ENDPOINT = originalEndpoint;
    if (originalApiKey === undefined) delete process.env.IMAGE_MODEL_API_KEY;
    else process.env.IMAGE_MODEL_API_KEY = originalApiKey;
  });
```

Also add `afterEach` to the Vitest import list.

- [ ] **Step 3: Add missing-config failing test**

Add this test before the existing success test:

```ts
  it("fails generation when the image model endpoint is missing", async () => {
    const user = createUser({ phone: "16600000000" });
    const assets = makeAssets(user.id);

    await expect(generateShoeImages({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets })).rejects.toThrow("Missing IMAGE_MODEL_ENDPOINT");
  });
```

- [ ] **Step 4: Update existing success test setup**

At the start of the existing `it("creates a succeeded four-view job...` body, add:

```ts
    setImageModelEnv();
```

- [ ] **Step 5: Run the focused test and verify RED**

Run:

```bash
bun test tests/generation.test.ts
```

Expected: fails because `generateShoeImages` does not reject when env is missing, or because `getImageModelConfig` does not exist yet. This confirms the test covers missing config.

### Task 2: Implement config helper and wire provider

**Files:**
- Create: `src/server/ai/config.ts`
- Modify: `src/server/ai/imageProvider.ts`
- Create: `.env.example`

- [ ] **Step 1: Create `src/server/ai/config.ts`**

```ts
export interface ImageModelConfig { endpoint: string; apiKey: string }

function readValue(env: Record<string, string | undefined>, key: string) {
  return env[key]?.trim() ?? "";
}

export function getImageModelConfig(env: Record<string, string | undefined> = process.env): ImageModelConfig {
  const endpoint = readValue(env, "IMAGE_MODEL_ENDPOINT");
  if (!endpoint) throw new Error("Missing IMAGE_MODEL_ENDPOINT");
  const apiKey = readValue(env, "IMAGE_MODEL_API_KEY");
  if (!apiKey) throw new Error("Missing IMAGE_MODEL_API_KEY");
  return { endpoint, apiKey };
}
```

- [ ] **Step 2: Wire `imageProvider.ts`**

Add this import at the top:

```ts
import { getImageModelConfig } from "./config";
```

At the start of `generateShoeImages`, before `buildGptImageRequest(input);`, add:

```ts
  getImageModelConfig();
```

Do not change `buildGptImageRequest`, `svgDataUrl`, image count, model string, or placeholder image generation.

- [ ] **Step 3: Create `.env.example`**

```env
IMAGE_MODEL_ENDPOINT=
IMAGE_MODEL_API_KEY=
```

- [ ] **Step 4: Run focused test and verify GREEN**

Run:

```bash
bun test tests/generation.test.ts
```

Expected: all tests in `tests/generation.test.ts` pass.

### Task 3: Full verification

**Files:**
- No edits.

- [ ] **Step 1: Run full test suite**

```bash
bun test
```

Expected: all Vitest tests pass with no failures.

- [ ] **Step 2: Confirm behavior manually through test evidence**

The missing-config test proves the new endpoint/key contract is enforced. The configured success test proves setting both variables preserves the existing two-result generation behavior.
