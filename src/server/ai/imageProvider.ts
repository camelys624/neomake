import OpenAI from "openai";
import type { GenerationMode, ImageGenerationModel, UploadedAsset } from "@/lib/types";
import { getImageModelConfig } from "./config";

export interface GenerateShoeImagesInput { userId: string; mode: GenerationMode; prompt: string; assets: UploadedAsset[]; model: ImageGenerationModel; outputCount: number }
export interface GeneratedImage { url: string; alt: string }

const IMAGE2_MODEL_CONFIG: Record<ImageGenerationModel, { providerModel: "gpt-image-2-vip"; size: "1024x1024" | "2048x2048" | "3840x2160" }> = {
  "image2-1k": { providerModel: "gpt-image-2-vip", size: "1024x1024" },
  "image2-2k": { providerModel: "gpt-image-2-vip", size: "2048x2048" },
  "image2-4k": { providerModel: "gpt-image-2-vip", size: "3840x2160" },
};

function clampOutputCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(8, Math.max(1, Math.trunc(value)));
}

export function buildGptImageRequest(input: GenerateShoeImagesInput) {
  const config = IMAGE2_MODEL_CONFIG[input.model];
  return { model: config.providerModel, size: config.size, quality: "high" as const, n: clampOutputCount(input.outputCount), prompt: input.prompt, mode: input.mode, source_asset_ids: input.assets.map((asset) => asset.id) };
}

function resolveOpenAIBaseUrl(endpoint: string): string {
  const url = new URL(endpoint);
  const normalizedPath = url.pathname.replace(/\/+$/, "");
  if (!normalizedPath || normalizedPath === "/") {
    url.pathname = "/v1";
    return url.toString();
  }
  if (normalizedPath === "/v1") return endpoint;
  if (normalizedPath === "/v1/images/generations") {
    url.pathname = "/v1";
    return url.toString();
  }
  return endpoint;
}

function resolveImageUrl(image: { url?: string | null; b64_json?: string | null }): string | null {
  if (typeof image.url === "string" && image.url.trim()) return image.url;
  if (typeof image.b64_json === "string" && image.b64_json.trim()) return `data:image/png;base64,${image.b64_json}`;
  return null;
}

export async function generateShoeImages(input: GenerateShoeImagesInput): Promise<GeneratedImage[]> {
  const { endpoint, apiKey } = getImageModelConfig();
  const request = buildGptImageRequest(input);
  const client = new OpenAI({
    apiKey,
    baseURL: resolveOpenAIBaseUrl(endpoint),
    dangerouslyAllowBrowser: true,
  });
  const response = await client.images.generate({ ...request, stream: false } as OpenAI.Images.ImageGenerateParams);
  const responseData = Array.isArray((response as { data?: unknown }).data)
    ? ((response as { data: { url?: string | null; b64_json?: string | null }[] }).data)
    : [];

  const imageUrls = responseData
    .map(resolveImageUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, request.n);

  const images: GeneratedImage[] = imageUrls.map((url, idx) => ({ url, alt: `AI 鞋履效果图 ${idx + 1}` }));

  if (!images.length) throw new Error("Image model response missing images");
  return images;
}
