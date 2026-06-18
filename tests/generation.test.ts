import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getImageModelConfig } from "../src/server/ai/config";
import { buildGptImageRequest, generateShoeImages } from "../src/server/ai/imageProvider";
import { submitGeneration } from "../src/server/workbench";
import { createUser, resetStore, state, nowIso } from "../src/server/dataStore";
import type { UploadedAsset } from "../src/lib/types";

function makeAssets(userId: string): UploadedAsset[] {
  return ["front", "side", "back", "top"].map((name) => ({ id: `asset_${name}`, userId, name, mimeType: "image/png", dataUrl: "data:image/png;base64,a", createdAt: nowIso() }));
}

function mockImagesApiResponse(urls: string[]): Response {
  return new Response(JSON.stringify({ created: 0, data: urls.map((url) => ({ url })) }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("generation adapter", () => {
  const originalEndpoint = process.env.IMAGE_MODEL_ENDPOINT;
  const originalApiKey = process.env.IMAGE_MODEL_API_KEY;

  function clearImageModelEnv() {
    delete process.env.IMAGE_MODEL_ENDPOINT;
    delete process.env.IMAGE_MODEL_API_KEY;
  }

  function setImageModelEnv() {
    process.env.IMAGE_MODEL_ENDPOINT = "https://image.example.test/v1";
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

    expect(request.model).toBe("gpt-image-2-vip");
    expect(request.size).toBe("3840x2160");
    expect(request.n).toBe(8);
  });

  it("sends uploaded image content via images edit endpoint", async () => {
    setImageModelEnv();
    const user = createUser({ phone: "16600000009" });
    const assets = makeAssets(user.id);
    const fetchMock = vi.fn().mockResolvedValue(mockImagesApiResponse(["https://cdn.example.test/r1.png", "https://cdn.example.test/r2.png"]));
    const originalFetch = globalThis.fetch;
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    try {
      const images = await generateShoeImages({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 2 });
      const imageEditCall = fetchMock.mock.calls.find((call) => {
        const target = call[0] as RequestInfo;
        const url = typeof target === "string" ? target : target.url;
        return url.includes("/images/edits");
      });
      expect(imageEditCall).toBeTruthy();

      const calledTarget = imageEditCall?.[0] as RequestInfo;
      const calledInit = imageEditCall?.[1] as RequestInit | undefined;
      const calledUrl = typeof calledTarget === "string" ? calledTarget : calledTarget.url;
      const calledMethod = typeof calledTarget === "string"
        ? String(calledInit?.method ?? "POST").toUpperCase()
        : calledTarget.method.toUpperCase();
      expect(calledUrl).toBe("https://image.example.test/v1/images/edits");
      expect(calledMethod).toBe("POST");

      const form = typeof calledTarget === "string"
        ? (calledInit?.body as FormData)
        : await calledTarget.clone().formData();
      const multipartPreview = await new Request("https://local.test/upload", { method: "POST", body: form }).text();
      const imageFieldMatches = multipartPreview.match(/name="image\[\]"/g) ?? [];
      expect(imageFieldMatches).toHaveLength(4);
      const uploadedFiles = form.getAll("image[]") as File[];
      expect(uploadedFiles.map((file) => file.name)).toEqual(["正面.png", "侧面.png", "背面.png", "俯视.png"]);
      expect(form.get("model")).toBe("gpt-image-2-vip");
      expect(form.get("size")).toBe("1024x1024");
      const promptValue = String(form.get("prompt") ?? "");
      expect(promptValue).toContain("输入图顺序");
      expect(promptValue).toContain("1. 正面");
      expect(promptValue).toContain("2. 侧面");
      expect(promptValue).toContain("3. 背面");
      expect(promptValue).toContain("4. 俯视");
      expect(promptValue).toContain("红色鞋面");
      expect(images.map((image) => image.url)).toEqual(["https://cdn.example.test/r1.png", "https://cdn.example.test/r2.png"]);
    } finally {
      (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });
  it("normalizes images edits endpoint when endpoint already contains the route", async () => {
    const user = createUser({ phone: "16600000010" });
    const assets = makeAssets(user.id);
    const fetchMock = vi.fn().mockResolvedValue(mockImagesApiResponse(["https://cdn.example.test/r1.png"]));
    const originalFetch = globalThis.fetch;
    process.env.IMAGE_MODEL_ENDPOINT = "https://image.example.test/v1/images/edits/";
    process.env.IMAGE_MODEL_API_KEY = "test-key";
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    try {
      await generateShoeImages({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 1 });
      const imageEditCall = fetchMock.mock.calls.find((call) => {
        const target = call[0] as RequestInfo;
        const url = typeof target === "string" ? target : target.url;
        return url.includes("/images/edits");
      });
      expect(imageEditCall).toBeTruthy();
      const calledTarget = imageEditCall?.[0] as RequestInfo;
      const calledUrl = typeof calledTarget === "string" ? calledTarget : calledTarget.url;
      expect(calledUrl).toBe("https://image.example.test/v1/images/edits");
    } finally {
      (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });

  it("uses semantic filenames for blank shoe style transfer inputs", async () => {
    setImageModelEnv();
    const user = createUser({ phone: "16600000011" });
    const assets = makeAssets(user.id).slice(0, 2);
    const fetchMock = vi.fn().mockResolvedValue(mockImagesApiResponse(["https://cdn.example.test/r1.png"]));
    const originalFetch = globalThis.fetch;
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    try {
      await generateShoeImages({ userId: user.id, mode: "blank_shoe_style_transfer", prompt: "白板鞋改成森林绿", assets, model: "image2-1k", outputCount: 1 });
      const imageEditCall = fetchMock.mock.calls.find((call) => {
        const target = call[0] as RequestInfo;
        const url = typeof target === "string" ? target : target.url;
        return url.includes("/images/edits");
      });
      expect(imageEditCall).toBeTruthy();
      const calledTarget = imageEditCall?.[0] as RequestInfo;
      const calledInit = imageEditCall?.[1] as RequestInit | undefined;
      const form = typeof calledTarget === "string"
        ? (calledInit?.body as FormData)
        : await calledTarget.clone().formData();
      const uploadedFiles = form.getAll("image[]") as File[];
      expect(uploadedFiles.map((file) => file.name)).toEqual(["白板鞋.png", "参考图.png"]);
      const promptValue = String(form.get("prompt") ?? "");
      expect(promptValue).toContain("输入图顺序");
      expect(promptValue).toContain("1. 白板鞋");
      expect(promptValue).toContain("2. 参考图");
      expect(promptValue).toContain("白板鞋改成森林绿");
    } finally {
      (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });

  it("creates a succeeded four-view job with requested output count and image2 request shape", async () => {
    setImageModelEnv();
    const user = createUser({ phone: "16600000000" });
    const assets = makeAssets(user.id);
    const fetchMock = vi.fn().mockResolvedValue(mockImagesApiResponse(["https://cdn.example.test/f1.png", "https://cdn.example.test/f2.png", "https://cdn.example.test/f3.png"]));
    const originalFetch = globalThis.fetch;
    (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    try {
      const result = await submitGeneration({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 3 });
      expect(result.images).toHaveLength(3);
      expect(state.generationJobs[0].status).toBe("succeeded");
      expect(JSON.parse(state.generationJobs[0].resultImageUrlsJson)).toHaveLength(3);
      expect(buildGptImageRequest({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets, model: "image2-1k", outputCount: 3 }).model).toBe("gpt-image-2-vip");
    } finally {
      (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });
});
