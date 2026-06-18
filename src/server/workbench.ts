import type { GenerationMode, ImageGenerationModel, UploadedAsset } from "@/lib/types";
import { generateShoeImages } from "./ai/imageProvider";
import { newId, nowIso, state } from "./dataStore";

export interface SubmitGenerationInput {
  userId: string;
  mode: GenerationMode;
  prompt: string;
  assets: UploadedAsset[];
  model: ImageGenerationModel;
  outputCount: number;
}

export interface SubmitGenerationResult {
  job: {
    id: string;
    userId: string;
    mode: GenerationMode;
    prompt: string;
    sourceAssetIdsJson: string;
    resultImageUrlsJson: string;
    status: "succeeded";
    errorMessage: null;
    createdAt: string;
    updatedAt: string;
  };
  images: { url: string; alt: string }[];
}

export async function submitGeneration(input: SubmitGenerationInput): Promise<SubmitGenerationResult> {
  if (input.mode === "four_view_to_model" && input.assets.length !== 4) throw new Error("请先补齐必需图片");
  if (input.mode === "blank_shoe_style_transfer" && input.assets.length < 1) throw new Error("请先补齐必需图片");
  for (const asset of input.assets) if (!state.assets.some((item) => item.id === asset.id)) state.assets.push(asset);
  const at = nowIso();
  const images = await generateShoeImages(input);
  const job = { id: newId("gen"), userId: input.userId, mode: input.mode, prompt: input.prompt, sourceAssetIdsJson: JSON.stringify(input.assets.map((asset) => asset.id)), resultImageUrlsJson: JSON.stringify(images.map((image) => image.url)), status: "succeeded" as const, errorMessage: null, createdAt: at, updatedAt: at };
  state.generationJobs.push(job);
  return { job, images };
}

export function sendGenerationToSupport(userId: string, jobId: string) {
  const at = nowIso();
  let conversation = state.supportConversations.find((item) => item.userId === userId && item.status === "open");
  if (!conversation) {
    conversation = { id: newId("conv"), userId, guestName: null, status: "open", createdAt: at, updatedAt: at };
    state.supportConversations.push(conversation);
  }
  const message = { id: newId("msg"), conversationId: conversation.id, sender: "user" as const, body: `用户发送了生成效果图：${jobId}`, createdAt: at };
  state.supportMessages.push(message);
  return message;
}
