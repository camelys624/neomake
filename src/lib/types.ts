export type UserRole = "user" | "admin";
export type GenerationMode = "four_view_to_model" | "blank_shoe_style_transfer";
export type ImageGenerationModel = "image2-1k" | "image2-2k" | "image2-4k";
export type GenerationStatus = "queued" | "processing" | "succeeded" | "failed";
export type ImageToolKind = "remove_background" | "enhance_clarity" | "upscale";
export type PaymentProvider = "alipay" | "wechat";
export type PaymentStatus = "pending" | "paid" | "failed";
export type ProcurementStatus = "submitted" | "processing" | "fulfilled" | "cancelled";

export interface UploadedAsset {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}

export interface GenerationRecord {
  id: string;
  userId: string;
  mode: GenerationMode;
  prompt: string;
  sourceAssetIds: string[];
  resultImageUrls: string[];
  status: GenerationStatus;
  createdAt: string;
}

export interface PaintOrderItem {
  colorName: string;
  colorHex: string;
  weightGrams: number;
  quantity: number;
}

export interface SafeUser {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  balanceCents: number;
  createdAt: string;
  updatedAt: string;
}
