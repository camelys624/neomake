# Image model endpoint and API key setup

## Context
The repo is ready to move from the current SVG placeholder generation path to a real image model integration. Before any provider call is wired up, the codebase needs a single source of truth for the two runtime inputs that the model adapter will depend on: an endpoint URL and an API key.

The end state is a repo that standardizes `IMAGE_MODEL_ENDPOINT` and `IMAGE_MODEL_API_KEY`, documents how to supply them locally and in deployment, and exposes a server-only accessor that future image-generation code can reuse without inventing a second config path.

## Approach
1. Create `src/server/ai/config.ts` as the only place that knows the variable names. Export a server-only helper with the exact signature `export function getImageModelConfig(env?: Record<string, string | undefined>): { endpoint: string; apiKey: string }`. When `env` is omitted, read from `process.env`. Trim both values, and throw `new Error("Missing IMAGE_MODEL_ENDPOINT")` or `new Error("Missing IMAGE_MODEL_API_KEY")` when either is empty after trimming.
2. Add `.env.example` at the repository root with the two exact keys and empty placeholder values:
   - `IMAGE_MODEL_ENDPOINT=`
   - `IMAGE_MODEL_API_KEY=`
   This file is the local onboarding source; do not add a real secret value anywhere in the repo.
3. Update `src/server/ai/imageProvider.ts` to call `getImageModelConfig()` at the start of `generateShoeImages`. Keep the current SVG fallback output unchanged for now; the new behavior is only that missing configuration fails fast before generation starts. This avoids teaching the provider a second config source.
4. Update `tests/generation.test.ts` to cover the configuration contract directly. Add one test that clears both env vars and expects `generateShoeImages(...)` to reject with `Missing IMAGE_MODEL_ENDPOINT`. Add a second test that sets both env vars to non-empty strings and verifies `generateShoeImages(...)` still returns the existing two-image placeholder result. Restore the original env after each test so the suite stays isolated.
5. Leave `wrangler.toml` unchanged for now. The endpoint is represented by the new env names, and the API key stays out of the repo so it can be supplied as a Wrangler secret later without adding a second deployment convention.

## Critical files & anchors
- `src/server/ai/imageProvider.ts` — current generation entrypoint; the new config check belongs here.
- `tests/generation.test.ts` — existing generation adapter coverage; extend it to prove the env contract.
- `src/server/workbench.ts` — call path into generation; confirms the new config check affects the actual user flow.
- `src/lib/constants.ts` — current home for shared literal constants; use it only if the config helper needs a shared error string, otherwise avoid adding a second constant bucket.
- `.gitignore` — `node_modules/` is already ignored; keep the new env example separate from any real `.env` file.

## Verification
- Run `bun test tests/generation.test.ts` from `~/projects/neomake`.
- Expected new-behavior check: with `IMAGE_MODEL_ENDPOINT` and `IMAGE_MODEL_API_KEY` unset, the test should observe `Missing IMAGE_MODEL_ENDPOINT`. With both set, the same generation path should still produce exactly two images and the existing `gpt-image-2` request shape.
- Then run `bun test` from `~/projects/neomake` to confirm the rest of the suite still passes with the new config guard in place.

## Assumptions & contingencies
- Assumption: this step is only about standardizing and plumbing the config contract, not switching the app to a live provider yet.
- If the first implementation shows that `process.env` is unavailable in the target runtime, keep the same helper signature but source values from the worker/runtime env object passed in by the real integration point instead of inventing a third variable name.
