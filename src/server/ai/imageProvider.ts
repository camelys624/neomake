import type { GenerationMode, UploadedAsset } from "@/lib/types";

export interface GenerateShoeImagesInput { userId: string; mode: GenerationMode; prompt: string; assets: UploadedAsset[] }
export interface GeneratedImage { url: string; alt: string }

export function buildGptImageRequest(input: GenerateShoeImagesInput) {
  return { model: "gpt-image-2" as const, prompt: input.prompt, mode: input.mode, image_count: 2, source_asset_ids: input.assets.map((asset) => asset.id) };
}

function svgDataUrl(label: string, prompt: string, index: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640" viewBox="0 0 900 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111827"/><stop offset="0.55" stop-color="#7c3aed"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect width="900" height="640" rx="40" fill="url(#g)"/><ellipse cx="450" cy="385" rx="270" ry="92" fill="#fff" opacity="0.88"/><path d="M230 375 C330 245 515 250 675 350 L720 395 C615 430 385 432 210 405 Z" fill="#f8fafc"/><path d="M310 345 C385 295 505 292 608 345" fill="none" stroke="#111827" stroke-width="16" stroke-linecap="round" opacity="0.72"/><text x="52" y="82" fill="#fff" font-family="Arial" font-size="42" font-weight="700">${label}</text><text x="52" y="132" fill="#fff" font-family="Arial" font-size="24">${prompt.slice(0, 36)}</text><text x="762" y="588" fill="#fff" font-family="Arial" font-size="28">#${index}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function generateShoeImages(input: GenerateShoeImagesInput): Promise<GeneratedImage[]> {
  buildGptImageRequest(input);
  return [1, 2].map((index) => ({ url: svgDataUrl(input.mode === "four_view_to_model" ? "四面图生成" : "白板鞋换风格", input.prompt, index), alt: `AI 鞋履效果图 ${index}` }));
}
