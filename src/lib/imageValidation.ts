import { SUPPORTED_IMAGE_MIME_TYPES, UNSUPPORTED_IMAGE_ERROR } from "./constants";

export function validateImageMimeType(mimeType: string): string | null {
  return (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType) ? null : UNSUPPORTED_IMAGE_ERROR;
}

export function validateImageSize(bytes: number): string | null {
  return bytes <= 1024 * 1024 ? null : "图片过大，请压缩到 1MB 以下";
}
