import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/appState";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UNSUPPORTED_IMAGE_ERROR } from "@/lib/constants";
import { validateImageMimeType } from "@/lib/imageValidation";
import type { ImageToolKind, UploadedAsset } from "@/lib/types";
import { processImageTool } from "@/server/ai/imageTools";
import { Page, asset, requireUser } from "./common";

export function ToolsPage() {
  const { user } = useAuth();
  const [kind, setKind] = React.useState<ImageToolKind>("enhance_clarity");
  const [file, setFile] = React.useState<UploadedAsset | null>(null);
  const [out, setOut] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  async function run() {
    try {
      if (!file) throw new Error("请先上传一张图片");
      const userId = requireUser(user?.id);
      const job = await processImageTool({ userId, toolKind: kind, asset: { ...file, userId } });
      setOut(job.resultImageUrl);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "处理失败，请稍后重试");
    }
  }

  return <Page><div className="grid gap-4 md:grid-cols-3">{[["remove_background", "去除背景"], ["enhance_clarity", "提升清晰度"], ["upscale", "放大图片"]].map(([value, label]) => <Card key={value} className={kind === value ? "ring-2 ring-slate-950" : ""}><CardTitle>{label}</CardTitle><Button className="mt-3" onClick={() => setKind(value as ImageToolKind)}>选择</Button></Card>)}</div><Card className="mt-6"><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const mimeError = validateImageMimeType(f.type); if (mimeError) { setError(UNSUPPORTED_IMAGE_ERROR); return; } setFile(asset(f.name, f.type)); }} /><Button className="mt-3" onClick={() => void run()}>处理图片</Button>{error && <p className="text-red-600">{error}</p>}{out && <img src={out} className="mt-4 max-w-md rounded-xl" alt="处理结果" />}</Card></Page>;
}
