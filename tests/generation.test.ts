import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getImageModelConfig } from "../src/server/ai/config";
import { buildGptImageRequest, generateShoeImages } from "../src/server/ai/imageProvider";
import { submitGeneration } from "../src/server/workbench";
import { createUser, resetStore, state, nowIso } from "../src/server/dataStore";
import type { UploadedAsset } from "../src/lib/types";

function makeAssets(userId: string): UploadedAsset[] {
  return ["front", "side", "back", "top"].map((name) => ({ id: `asset_${name}`, userId, name, mimeType: "image/png", dataUrl: "data:image/png;base64,a", createdAt: nowIso() }));
}

describe("generation adapter", () => {
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

  it("fails generation when the image model endpoint is missing", async () => {
    const user = createUser({ phone: "16600000000" });
    const assets = makeAssets(user.id);

    await expect(generateShoeImages({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 2 })).rejects.toThrow("Missing IMAGE_MODEL_ENDPOINT");
  });

  it("does not require process to exist before reporting missing image model endpoint", async () => {
    const actualProcess = globalThis.process;
    const user = createUser({ phone: "16600000000" });
    const assets = makeAssets(user.id);
    Reflect.deleteProperty(globalThis as typeof globalThis & { process?: unknown }, "process");

    try {
      await expect(generateShoeImages({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 2 })).rejects.toThrow("Missing IMAGE_MODEL_ENDPOINT");
    } finally {
      (globalThis as typeof globalThis & { process?: unknown }).process = actualProcess;
    }
  });

  it("accepts VITE image model env keys", () => {
    const config = getImageModelConfig({ VITE_IMAGE_MODEL_ENDPOINT: "https://image.example.test/generate", VITE_IMAGE_MODEL_API_KEY: "test-key" });

    expect(config.endpoint).toBe("https://image.example.test/generate");
    expect(config.apiKey).toBe("test-key");
  });

  it("maps image2 model, size, and output count into the request", () => {
    const user = createUser({ phone: "16600000000" });
    const assets = makeAssets(user.id);

    const request = buildGptImageRequest({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-4k", outputCount: 8 });

    expect(request.model).toBe("gpt-image-2-4K");
    expect(request.size).toBe("3840x2160");
    expect(request.n).toBe(8);
  });

  it("calls configured image model endpoint instead of local mock generation", async () => {
    setImageModelEnv();
    const user = createUser({ phone: "16600000009" });
    const assets = makeAssets(user.id);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ url: "https://cdn.example.test/r1.png" }, { url: "https://cdn.example.test/r2.png" }] }) });
    const originalFetch = globalThis.fetch;
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    try {
      const images = await generateShoeImages({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 2 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith("https://image.example.test/generate", expect.objectContaining({ method: "POST" }));
      expect(images.map((image) => image.url)).toEqual(["https://cdn.example.test/r1.png", "https://cdn.example.test/r2.png"]);
    } finally {
      (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });

  it("appends images generations path when endpoint is set to /v1 base", async () => {
    const user = createUser({ phone: "16600000010" });
    const assets = makeAssets(user.id);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ url: "https://cdn.example.test/r1.png" }] }) });
    const originalFetch = globalThis.fetch;
    process.env.IMAGE_MODEL_ENDPOINT = "https://image.example.test/v1";
    process.env.IMAGE_MODEL_API_KEY = "test-key";
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    try {
      await generateShoeImages({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 1 });
      expect(fetchMock).toHaveBeenCalledWith("https://image.example.test/v1/images/generations/", expect.objectContaining({ method: "POST" }));
    } finally {
      (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });

  it("creates a succeeded four-view job with requested output count and image2 request shape", async () => {
    setImageModelEnv();
    const user = createUser({ phone: "16600000000" });
    const assets = makeAssets(user.id);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ url: "https://cdn.example.test/f1.png" }, { url: "https://cdn.example.test/f2.png" }, { url: "https://cdn.example.test/f3.png" }] }) });
    const originalFetch = globalThis.fetch;
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    try {
      const result = await submitGeneration({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 3 });
      expect(result.images).toHaveLength(3);
      expect(state.generationJobs[0].status).toBe("succeeded");
      expect(JSON.parse(state.generationJobs[0].resultImageUrlsJson)).toHaveLength(3);
      expect(buildGptImageRequest({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 3 }).model).toBe("gpt-image-2-1K");
    } finally {
      (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });
});
