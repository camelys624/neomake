import type { ImageToolKind, UploadedAsset } from "@/lib/types";
import { newId, nowIso, state } from "@/server/dataStore";

export interface ProcessImageToolInput { userId: string; toolKind: ImageToolKind; asset: UploadedAsset }
const toolLabels: Record<ImageToolKind, string> = { remove_background: "去除背景", enhance_clarity: "提升清晰度", upscale: "放大图片" };

function outputUrl(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480"><rect width="720" height="480" fill="#eff6ff"/><rect x="80" y="80" width="560" height="320" rx="32" fill="#fff" stroke="#2563eb" stroke-width="8"/><text x="120" y="245" font-family="Arial" font-size="52" font-weight="700" fill="#1e3a8a">${label}</text><text x="120" y="306" font-family="Arial" font-size="26" fill="#475569">GPT-image 工具边界占位结果</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function processImageTool(input: ProcessImageToolInput) {
  const at = nowIso();
  const resultImageUrl = outputUrl(toolLabels[input.toolKind]);
  const job = { id: newId("tool"), userId: input.userId, toolKind: input.toolKind, sourceAssetId: input.asset.id, resultImageUrl, status: "succeeded" as const, errorMessage: null, createdAt: at, updatedAt: at };
  state.imageToolJobs.push(job);
  return job;
}
