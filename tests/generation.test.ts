import { beforeEach, describe, expect, it } from "vitest";
import { buildGptImageRequest } from "../src/server/ai/imageProvider";
import { submitGeneration } from "../src/server/workbench";
import { createUser, resetStore, state, nowIso } from "../src/server/dataStore";
import type { UploadedAsset } from "../src/lib/types";

function makeAssets(userId: string): UploadedAsset[] {
  return ["front", "side", "back", "top"].map((name) => ({ id: `asset_${name}`, userId, name, mimeType: "image/png", dataUrl: "data:image/png;base64,a", createdAt: nowIso() }));
}

describe("generation adapter", () => {
  beforeEach(() => resetStore());
  it("creates a succeeded four-view job with two result URLs and gpt-image-2 request shape", async () => {
    const user = createUser({ phone: "16600000000" });
    const assets = makeAssets(user.id);
    const result = await submitGeneration({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets });
    expect(result.images).toHaveLength(2);
    expect(state.generationJobs[0].status).toBe("succeeded");
    expect(JSON.parse(state.generationJobs[0].resultImageUrlsJson)).toHaveLength(2);
    expect(buildGptImageRequest({ userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面", assets }).model).toBe("gpt-image-2");
  });
});
