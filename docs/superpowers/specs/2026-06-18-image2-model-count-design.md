# Image2 model selector and output count design

## Context
The imported `configurable-image2` skill defines an OpenAI-compatible image2 provider with automatic resolution-tier models (`gpt-image-2-1K`, `gpt-image-2-2K`, `gpt-image-2-4K`) and an `n` count field. The workspace should expose this as a model selector and a batch output-count control before the existing History button, while keeping uploaded four-view/blank-shoe images as inputs.

## Design
- Extract the zip archive into `integrations/configurable-image2/` as reference material only. Do not run the Python script from the React app or server modules.
- Add TypeScript generation options:
  - `ImageGenerationModel = "image2-1k" | "image2-2k" | "image2-4k"`
  - `GenerationOutputCount` is represented as a `number` clamped to `1..8`.
- The workspace bottom toolbar order becomes: model `<Select>`, output count `<Input type="number">`, `历史`, `清空`, prompt length.
- Model selector labels:
  - `image2 · 1K`
  - `image2 · 2K`
  - `image2 · 4K`
- Default model: `image2-1k`. Default output count: `2`, preserving the current two-result placeholder behavior.
- Output count input uses `min={1}`, `max={8}`, `step={1}` and clamps user input on change. Blank or invalid input falls back to `1`; values greater than `8` become `8`.
- `submitGeneration` accepts `{ model, outputCount }` and passes them to `generateShoeImages`.
- `buildGptImageRequest` maps model to provider request shape:
  - `image2-1k` → `{ model: "gpt-image-2-1K", size: "1024x1024" }`
  - `image2-2k` → `{ model: "gpt-image-2-2K", size: "2048x2048" }`
  - `image2-4k` → `{ model: "gpt-image-2-4K", size: "3840x2160" }`
  - `n` equals the clamped output count.
- `generateShoeImages` returns exactly `outputCount` results in placeholder mode so the UI behavior matches the future live API.

## Verification
- Generation unit tests cover model/size/count mapping and 1..8 output count.
- Workspace tests cover presence of the model selector before the History button and count clamping to 8.
- Run `bun test tests/generation.test.ts tests/workspace.test.tsx`.
- Run `bun test`.
- Run `bun run build`.
