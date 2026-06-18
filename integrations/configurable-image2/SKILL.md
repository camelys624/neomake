---
name: "configurable-image2"
description: "Generate or edit images through a user-provided OpenAI-compatible image2 API. Always collect the request website/base URL, API key, and 1K/2K/4K resolution before generation, then use automatic resolution-tier model selection. Use when the user asks to use Configurable-image2, configurable-image2, image2, or a custom image generation relay."
---

# Configurable Image2

Use this skill for image generation or image editing through a user-provided OpenAI-compatible image2 endpoint. The bundled client is `scripts/image2_cli.py`.

Do not assume or recommend any fixed relay website. The user controls the relay, model, and key.

## Required Request Info

Before calling the script, make sure the current request includes all three items:

- Request website/base URL, such as `https://example.com/v1`
- API key for that base URL
- Resolution tier: `1K`, `2K`, or `4K`

If any item is missing, stop and ask the user for the missing value before generating. When asking, explicitly mention all missing items; for resolution, ask the user to choose `1K`, `2K`, or `4K`. Do not invent a website, do not reuse an unrelated provider key, and do not store keys in files or skill instructions.

Pass values only for the current command:

```powershell
$env:IMAGE2_BASE_URL="https://example.com/v1"
$env:IMAGE2_API_KEY="sk-..."
```

You may also pass the base URL as `--base-url`. Prefer environment variables for secrets.

## Workflow

1. Understand the user's image goal.
2. If the user gives a rough idea, improve it into a clear production prompt with composition, style, constraints, and avoid-list. If the user says the prompt must be exact, use it directly.
3. Choose operation:
   - Use `generate` for text-to-image.
   - Use `edit` only when the user provides a local input image path.
4. Confirm all required request information before generation:
   - If the user did not provide the request website/base URL, ask for it.
   - If the user did not provide the API key, ask for it.
   - If the user did not specify a resolution, ask exactly which resolution they want: `1K`, `2K`, or `4K`.
   - Do not generate until the user has chosen one of those tiers.
   - If the user provides an exact valid size, infer the nearest tier from the long edge and proceed.
5. Choose practical parameters:
   - Use `1024x1024` for 1K square output unless the user requests another 1K aspect ratio.
   - Use `2048x1152` for cinematic 2K landscape output or `2048x2048` for polished 2K square output.
   - Use `3840x2160` for cinematic 4K landscape output or `2160x3840` for 4K portrait output.
   - Use `high` for final assets and `low` or `medium` for drafts or timeout-prone relays.
6. Choose the resolution-tier model unless the user explicitly requests a different model:
   - Use `gpt-image-2-1K` for 1K output.
   - Use `gpt-image-2-2K` for 2K output.
   - Use `gpt-image-2-4K` for 4K output.
   - The script default `--model auto` applies the same selection from `--size`.
7. Output into the current working directory unless the user specifies an output path.
8. For generation, set `--timeout 600` unless the user asks for a different timeout.
9. Run the command with a shell timeout of at least 11 minutes.
10. Wait for the script to return and verify the output file exists before reporting success.
11. For failures, report the HTTP status and returned message. If the failure suggests auth, permission, quota, unavailable accounts, or group/channel mismatch, say the key or relay configuration may be wrong.

## Commands

Generate:

```powershell
$env:IMAGE2_BASE_URL="https://example.com/v1"
$env:IMAGE2_API_KEY="sk-..."
python <skill_dir>\scripts\image2_cli.py generate "final prompt here" --model auto --size 1024x1024 --quality high --slug short-request-slug --timeout 600
```

Edit:

```powershell
$env:IMAGE2_BASE_URL="https://example.com/v1"
$env:IMAGE2_API_KEY="sk-..."
python <skill_dir>\scripts\image2_cli.py edit "edit instruction here" --input .\source.png --model auto --size 1024x1024 --quality high --slug edited-output-slug --timeout 600
```

Useful script options:

- `--base-url`: OpenAI-compatible base URL. Overrides `IMAGE2_BASE_URL`.
- `--api-key`: API key. Prefer `IMAGE2_API_KEY` instead.
- `--model`: Default `auto`, which selects `gpt-image-2-1K`, `gpt-image-2-2K`, or `gpt-image-2-4K` from `--size`. Pass an explicit model to override this behavior.
- `--size`: Default `1024x1024`.
- `--quality`: `low`, `medium`, `high`, or `auto`.
- `--output`: Exact PNG output path.
- `--output-dir`: Directory for generated filenames.
- `--slug`: Filename slug when `--output` is omitted.
- `--retries`: Gateway timeout retries. Default `3`.
- `--timeout`: Request timeout seconds. Default `600`.

If `python` is unavailable, try `py -3` on Windows or `python3` on Unix-like systems. If `httpx` is unavailable, install it in the Python environment with:

```powershell
python -m pip install httpx
```

## Size Rules

For custom sizes, make sure:

- The long edge is no more than `3840` pixels.
- Both width and height are multiples of `16`.
- The aspect ratio is no more extreme than `3:1`.
- Total pixels are between `655360` and `8294400`.

Examples:

- `3840x2160` is valid landscape 4K.
- `2160x3840` is valid portrait 4K.
- `4096x2160` is invalid because the long edge is greater than `3840`.
- `4096x4096` is invalid because the long edge and total pixels exceed the limits.

## Failure Notes

- `502`, `504`, `522`, or `524`: the relay, image channel, or upstream service timed out or returned a gateway error. The script retries these by default.
- `503` with unavailable-account wording: the relay may have no compatible image account available.
- `401` or `403`: likely invalid key, missing permission, or wrong relay/channel.
- Local file errors in edit mode usually mean the input path is missing or not readable.

Always wait for concrete script feedback before giving the user a conclusion.
