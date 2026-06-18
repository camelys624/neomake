import * as React from "react";
import { History, Layers3, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/appState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { UNSUPPORTED_IMAGE_ERROR } from "@/lib/constants";
import { validateImageMimeType } from "@/lib/imageValidation";
import type { GenerationMode, ImageGenerationModel, UploadedAsset } from "@/lib/types";
import { state } from "@/server/dataStore";
import { submitGeneration, sendGenerationToSupport } from "@/server/workbench";
import { EmptyState, Field, Page, asset, requireUser } from "./common";

export function WorkspacePage() {
  const { user } = useAuth();
  const [mode, setMode] = React.useState<GenerationMode>("four_view_to_model");
  const [prompt, setPrompt] = React.useState("");
  const [files, setFiles] = React.useState<UploadedAsset[]>([]);
  const [results, setResults] = React.useState<string[]>([]);
  const [error, setError] = React.useState("");
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [generationModel, setGenerationModel] = React.useState<ImageGenerationModel>("image2-1k");
  const [outputCount, setOutputCount] = React.useState(2);
  const [loadingCount, setLoadingCount] = React.useState(0);
  const [previewImageUrl, setPreviewImageUrl] = React.useState<string | null>(null);

  function clampOutputCount(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(8, Math.max(1, parsed));
  }

  async function fileToAsset(file: File, userId: string): Promise<UploadedAsset> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
      reader.addEventListener("error", () => reject(new Error("图片读取失败")));
      reader.readAsDataURL(file);
    });
    return { ...asset(file.name, file.type), userId, dataUrl };
  }

  async function gen() {
    try {
      const userId = requireUser(user?.id);
      const required = mode === "four_view_to_model" ? 4 : 1;
      if (files.length < required) throw new Error("请先补齐必需图片");
      const inputFiles = files.slice(0, mode === "four_view_to_model" ? 4 : 2).map((f) => ({ ...f, userId }));
      setError("");
      setResults([]);
      setLoadingCount(outputCount);
      const res = await submitGeneration({ userId, mode, prompt, assets: inputFiles, model: generationModel, outputCount });
      setResults(res.images.map((i) => i.url));
      toast.success("生成成功");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoadingCount(0);
    }
  }

  const labels = mode === "four_view_to_model" ? ["正面", "侧面", "背面", "俯视"] : ["白板鞋图", "参考效果图"];
  const history = state.generationJobs.filter((j) => j.userId === user?.id).slice().reverse();
  const quickPromptOptions = [
    { tag: "极简", prompt: "极简风格，干净留白，单一主色，弱化装饰，突出鞋型轮廓" },
    { tag: "机能", prompt: "机能风格，模块化拼接，耐磨材质，功能绑带与户外细节，工业感配色" },
    { tag: "潮流", prompt: "潮流街头风格，大胆撞色，夸张图案，层次材质与个性配件" },
    { tag: "复古", prompt: "复古运动风格，做旧质感，经典色块，皮革与麂皮拼接，怀旧鞋型比例" },
    { tag: "自定义", prompt: "请按品牌调性补充：目标人群、主色、材质、图案、鞋底造型、使用场景" },
  ] as const;

  return (
    <Page>
      <Dialog open={historyOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle>生成历史</DialogTitle>
              <Button variant="ghost" aria-label="关闭历史" onClick={() => setHistoryOpen(false)}><X className="size-4" aria-hidden="true" /></Button>
            </div>
          </DialogHeader>
          <div className="max-h-96 space-y-3 overflow-auto">
            {history.map((j) => <div key={j.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm"><Badge>{j.status}</Badge><p className="mt-2 text-stone-600">{j.createdAt}</p></div>)}
            {!history.length && <EmptyState>还没有生成记录</EmptyState>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewImageUrl)}>
        <DialogContent className="max-w-5xl p-4">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-lg">查看大图</DialogTitle>
              <Button variant="ghost" aria-label="关闭大图" onClick={() => setPreviewImageUrl(null)}><X className="size-4" aria-hidden="true" /></Button>
            </div>
          </DialogHeader>
          {previewImageUrl && <img src={previewImageUrl} alt="查看大图" className="max-h-[80vh] w-full rounded-2xl object-contain" />}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <Card className="border-stone-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.06)]">
            <Field label="生成模式">
              <Select className="w-full" value={mode} onChange={(e) => { setMode(e.target.value as GenerationMode); setFiles([]); }}>
                <option value="four_view_to_model">四面图生成模特图</option>
                <option value="blank_shoe_style_transfer">白板鞋风格迁移</option>
              </Select>
            </Field>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {labels.map((label, i) => {
                const file = files[i];
                return (
                  <label key={label} aria-label={`${label}上传`} className="group relative aspect-square cursor-pointer overflow-hidden rounded-3xl border border-dashed border-stone-300 bg-[#fbfaf7] text-center transition hover:border-[#b77a2b] hover:bg-amber-50/50">
                    {file ? <>
                      <img src={file.dataUrl} alt={`${label}预览`} className="absolute inset-0 size-full object-cover" />
                      <span className="absolute left-2 top-2 rounded-full bg-stone-950/75 px-2 py-1 text-[11px] font-bold text-white">{label}</span>
                      <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-stone-800 shadow-sm">{file.name}</span>
                      <Input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
                        const selected = e.target.files?.[0];
                        if (!selected) return;
                        const mimeError = validateImageMimeType(selected.type);
                        if (mimeError) { setError(UNSUPPORTED_IMAGE_ERROR); return; }
                        const item = await fileToAsset(selected, user?.id ?? "demo");
                        setFiles((prev) => {
                          const copy = [...prev];
                          copy[i] = item;
                          return copy.filter(Boolean);
                        });
                      }} />
                    </> : <>
                      <Input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
                        const selected = e.target.files?.[0];
                        if (!selected) return;
                        const mimeError = validateImageMimeType(selected.type);
                        if (mimeError) { setError(UNSUPPORTED_IMAGE_ERROR); return; }
                        const item = await fileToAsset(selected, user?.id ?? "demo");
                        setFiles((prev) => {
                          const copy = [...prev];
                          copy[i] = item;
                          return copy.filter(Boolean);
                        });
                      }} />
                      <span className="flex size-full flex-col items-center justify-center px-3">
                        <span className="mb-3 rounded-2xl bg-white p-3 text-[#b77a2b] shadow-sm"><Upload className="size-5" aria-hidden="true" /></span>
                        <span className="text-sm font-black tracking-[-0.02em] text-stone-900">{label}</span>
                        <span className="mt-1 text-xs font-semibold text-stone-500">点击上传</span>
                      </span>
                    </>}
                  </label>
                );
              })}
            </div>
            <CardTitle className="mt-6 flex items-center gap-2"><Sparkles className="size-5 text-[#b77a2b]" aria-hidden="true" />生成设置</CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickPromptOptions.map((option) => (
                <Button key={option.tag} className="min-h-9 rounded-full px-4 py-1.5 text-xs" variant="outline" onClick={() => setPrompt((prev) => (prev ? `${prev}，${option.prompt}` : option.prompt))}>{option.tag}</Button>
              ))}
            </div>
          </Card>
        </aside>

        <section className="flex min-h-[76vh] flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white/95 shadow-[0_24px_70px_rgba(28,25,23,0.07)]">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid min-h-72 place-items-center rounded-[1.5rem] border border-dashed border-stone-200 bg-[#fbfaf7] p-6 text-center">
              {loadingCount > 0 ? <div className="grid w-full gap-4">{Array.from({ length: loadingCount }, (_, i) => <Card key={`skeleton-${i}`} className="overflow-hidden border-stone-200/80 bg-white/90 p-0"><div className="grid gap-0 lg:grid-cols-[1fr_220px]"><Skeleton data-testid="generation-skeleton" className="aspect-[4/3] w-full rounded-none bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200" /><div className="flex flex-col justify-between gap-4 p-4 text-left"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div><div className="flex flex-wrap gap-2"><Skeleton className="h-9 w-14" /><Skeleton className="h-9 w-14" /><Skeleton className="h-9 w-14" /></div></div></div></Card>)}</div> : results.length ? <div className="grid w-full gap-4">{results.map((url, i) => <Card key={url} className="overflow-hidden p-0"><div className="grid gap-0 lg:grid-cols-[1fr_220px]"><img src={url} alt={`结果 ${i + 1}`} className="aspect-[4/3] w-full object-cover" /><div className="flex flex-col justify-between gap-4 p-4 text-left"><div><p className="text-sm font-semibold text-stone-500">生成结果 {i + 1}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPreviewImageUrl(url)}>查看</Button><Button variant="outline">选择</Button><Button onClick={() => { const job = state.generationJobs.at(-1); if (job && user) { sendGenerationToSupport(user.id, job.id); toast.success("已发送到后台"); } }}>发送</Button></div></div></div></Card>)}</div> : <div><Layers3 className="mx-auto mb-3 size-7 text-[#b77a2b]" aria-hidden="true" /><p className="text-sm text-stone-500">等待生成结果</p></div>}
            </div>
          </div>

          <div className="border-t border-stone-200 bg-white p-5">
            <div className="rounded-[1.5rem] border border-[#b77a2b]/50 bg-white p-3 shadow-[0_16px_50px_rgba(183,122,43,0.10)]">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <Textarea className="min-h-24 resize-none border-0 bg-transparent shadow-none focus:border-transparent focus:ring-0" maxLength={1000} placeholder="描述你想调整的颜色、材质、图案、鞋带、鞋底或展示角度..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <div className="flex flex-col justify-end gap-3 lg:w-28">
                  <Button className="w-full bg-[#b77a2b] px-4 hover:bg-[#a66d25]" onClick={() => void gen()}><Sparkles className="size-4" aria-hidden="true" />生成</Button>
                  <p className="text-xs leading-5 text-stone-500">Shift + Enter 换行</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-stone-500">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2">
                      <span className="font-semibold text-stone-600">模型</span>
                      <Select className="min-h-9 w-36 py-1.5" value={generationModel} onChange={(e) => setGenerationModel(e.target.value as ImageGenerationModel)}>
                        <option value="image2-1k">image2 · 1K</option>
                        <option value="image2-2k">image2 · 2K</option>
                        <option value="image2-4k">image2 · 4K</option>
                      </Select>
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="font-semibold text-stone-600">出图数量</span>
                      <Input className="min-h-9 w-20 py-1.5" type="number" min={1} max={8} step={1} value={outputCount} onInput={(e) => setOutputCount(clampOutputCount((e.target as HTMLInputElement).value))} onChange={(e) => setOutputCount(clampOutputCount(e.target.value))} />
                    </label>
                  </div>
                  <Button className="min-h-8 rounded-full px-3 py-1 text-xs" variant="ghost" onClick={() => setHistoryOpen(true)}><History className="size-4" aria-hidden="true" />历史</Button>
                  <Button className="min-h-8 rounded-full px-3 py-1 text-xs" variant="ghost" onClick={() => setPrompt("")}>清空</Button>
                </div>
                <span>{prompt.length} / 1000</span>
              </div>
            </div>
            {error && <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          </div>
        </section>
      </div>
    </Page>
  );
}
