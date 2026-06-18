import type { GenerationMode, ImageGenerationModel, UploadedAsset } from "@/lib/types";
import { getImageModelConfig } from "./config";

export interface GenerateShoeImagesInput { userId: string; mode: GenerationMode; prompt: string; assets: UploadedAsset[]; model: ImageGenerationModel; outputCount: number }
export interface GeneratedImage { url: string; alt: string }

const IMAGE2_MODEL_CONFIG: Record<ImageGenerationModel, { providerModel: "gpt-image-2-1K" | "gpt-image-2-2K" | "gpt-image-2-4K"; size: "1024x1024" | "2048x2048" | "3840x2160" }> = {
  "image2-1k": { providerModel: "gpt-image-2-1K", size: "1024x1024" },
  "image2-2k": { providerModel: "gpt-image-2-2K", size: "2048x2048" },
  "image2-4k": { providerModel: "gpt-image-2-4K", size: "3840x2160" },
};

function clampOutputCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(8, Math.max(1, Math.trunc(value)));
}

export function buildGptImageRequest(input: GenerateShoeImagesInput) {
  const config = IMAGE2_MODEL_CONFIG[input.model];
  return { model: config.providerModel, size: config.size, quality: "high" as const, n: clampOutputCount(input.outputCount), prompt: input.prompt, mode: input.mode, source_asset_ids: input.assets.map((asset) => asset.id) };
}

interface ImageProviderImage {
  url?: string;
  b64_json?: string;
}

interface ImageProviderPayload {
  data?: ImageProviderImage[];
  images?: ImageProviderImage[];
  error?: { message?: string } | string;
}

function resolveImageUrl(item: ImageProviderImage): string | null {
  if (item.url?.trim()) return item.url;
  if (item.b64_json?.trim()) return `data:image/png;base64,${item.b64_json}`;
  return null;
}

function collectImages(payload: ImageProviderPayload): ImageProviderImage[] {
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.images)) return payload.images;
  return [];
}

function payloadErrorMessage(payload: ImageProviderPayload): string {
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
  if (typeof payload.error === "object" && payload.error?.message?.trim()) return payload.error.message;
  return "Image model request failed";
}

function resolveImageEndpoint(endpoint: string): string {
  const url = new URL(endpoint);
  const path = url.pathname.replace(/\/+$/, "");
  if (!path || path === "/" || path === "/v1") {
    url.pathname = "/v1/images/generations/";
    return url.toString();
  }
  if (path === "/v1/images/generations") {
    url.pathname = "/v1/images/generations/";
    return url.toString();
  }
  return endpoint;
}

export async function generateShoeImages(input: GenerateShoeImagesInput): Promise<GeneratedImage[]> {
  const { endpoint, apiKey } = getImageModelConfig();
  if (typeof fetch !== "function") throw new Error("Fetch API is unavailable");
  const request = buildGptImageRequest(input);
  const response = await fetch(resolveImageEndpoint(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });
  const payload = await response.json() as ImageProviderPayload;

  if (!response.ok) throw new Error(payloadErrorMessage(payload));

  const images = collectImages(payload)
    .map(resolveImageUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, request.n)
    .map((url, idx) => ({ url, alt: `AI 鞋履效果图 ${idx + 1}` }));

  if (!images.length) throw new Error("Image model response missing images");
  return images;
}
