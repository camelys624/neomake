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
const MODE_UPLOAD_FILE_BASE_NAMES: Record<GenerationMode, string[]> = {
  four_view_to_model: ["正面", "侧面", "背面", "俯视"],
  blank_shoe_style_transfer: ["白板鞋", "参考图"],
};

function resolveUploadExtension(asset: UploadedAsset): string {
  if (asset.mimeType === "image/jpeg") return "jpg";
  if (asset.mimeType === "image/png") return "png";
  if (asset.mimeType === "image/webp") return "webp";
  const dotIndex = asset.name.lastIndexOf(".");
  if (dotIndex > 0 && dotIndex < asset.name.length - 1) return asset.name.slice(dotIndex + 1).toLowerCase();
  return "png";
}

function resolveUploadFileName(asset: UploadedAsset, mode: GenerationMode, index: number): string {
  const baseName = MODE_UPLOAD_FILE_BASE_NAMES[mode][index] ?? (asset.name.replace(/\.[^.]+$/, "") || asset.id);
  const extension = resolveUploadExtension(asset);
  return `${baseName}.${extension}`;
}

function clampOutputCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(8, Math.max(1, Math.trunc(value)));
}

function buildModeAwarePrompt(mode: GenerationMode, prompt: string, assetCount: number): string {
  const labels = MODE_UPLOAD_FILE_BASE_NAMES[mode].slice(0, Math.max(0, assetCount));
  if (!labels.length) return prompt;
  const roleHints = labels.map((label, index) => `${index + 1}. ${label}`).join("；");
  return `输入图顺序：${roleHints}。\n请按上述顺序理解每张输入图角色，并保持同一鞋款结构一致。\n${prompt}`;
}

export function buildGptImageRequest(input: GenerateShoeImagesInput) {
  const config = IMAGE2_MODEL_CONFIG[input.model];
  return {
    model: config.providerModel,
    size: config.size,
    quality: "high" as const,
    n: clampOutputCount(input.outputCount),
    prompt: buildModeAwarePrompt(input.mode, input.prompt, input.assets.length),
    mode: input.mode,
  };
}

function resolveOpenAIBaseUrl(endpoint: string): string {
  const url = new URL(endpoint);
  const normalizedPath = url.pathname.replace(/\/+$/, "");
  if (!normalizedPath || normalizedPath === "/") {
    url.pathname = "/v1";
    return url.toString();
  }
  if (normalizedPath === "/v1") return endpoint;
  if (normalizedPath === "/v1/images/generations" || normalizedPath === "/v1/images/edits") {
    url.pathname = "/v1";
    return url.toString();
  }
  return endpoint;
}

function decodeBase64(base64: string): ArrayBuffer {
  if (typeof Buffer !== "undefined") {
    const buffer = Buffer.from(base64, "base64");
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function assetToUploadFile(asset: UploadedAsset, mode: GenerationMode, index: number): File {
  const prefix = "base64,";
  const base64Index = asset.dataUrl.indexOf(prefix);
  if (base64Index < 0) throw new Error("Invalid uploaded image content");
  const base64 = asset.dataUrl.slice(base64Index + prefix.length);
  const bytes = decodeBase64(base64);
  return new File([bytes], resolveUploadFileName(asset, mode, index), { type: asset.mimeType || "image/png" });
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
  const response = await client.images.edit({ ...request, stream: false, image: input.assets.map((asset, index) => assetToUploadFile(asset, input.mode, index)) } as OpenAI.Images.ImageEditParams);
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
