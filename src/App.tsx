import { Activity, ArrowRight, BarChart3, Bot, Bookmark, Database, Folder, History, ImageIcon, Layers3, MessageSquare, Palette, PieChart, Play, ShoppingCart, Sparkles, Upload, Users, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import * as React from "react";
import { AppHeader } from "@/components/site/AppHeader";
import { SupportWidget } from "@/components/site/SupportWidget";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { BRAND_NAME, UNSUPPORTED_IMAGE_ERROR } from "@/lib/constants";
import { paintCatalog, type PaintCatalogColor } from "@/lib/paintCatalog";
import { formatCny } from "@/lib/utils";
import { validateImageMimeType } from "@/lib/imageValidation";
import type { GenerationMode, ImageToolKind, PaintOrderItem, UploadedAsset } from "@/lib/types";
import { useAuth } from "@/appState";
import { state, newId, nowIso, safeUser, ensureAdminDemoData } from "@/server/dataStore";
import { submitGeneration, sendGenerationToSupport } from "@/server/workbench";
import { processImageTool } from "@/server/ai/imageTools";
import { createPaintOrder } from "@/server/procurement";
import { createRechargeOrder, markRechargePaid, type RechargeOrder } from "@/server/recharge";
import { adminDashboard, adminMarkRechargePaid, adminReply, updateProcurementStatus } from "@/server/admin";

function asset(name: string, mimeType = "image/png"): UploadedAsset { return { id: newId("ast"), userId: "demo", name, mimeType, dataUrl: "data:image/png;base64,iVBORw0KGgo=", createdAt: nowIso() }; }
function requireUser(userId?: string) { if (!userId) throw new Error("请先登录"); return userId; }
function Page({ children }: { children: React.ReactNode }) { return <><AppHeader /><main id="main-content" className="mx-auto min-h-[calc(100dvh-4.75rem)] max-w-[1180px] px-6 py-12 sm:px-8 lg:px-10 lg:py-16">{children}</main><SupportWidget /></>; }
function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-6 max-w-3xl space-y-3"><Badge>{eyebrow}</Badge><h1 className="text-3xl font-black tracking-[-0.04em] text-stone-950 sm:text-4xl">{title}</h1><p className="text-base leading-7 text-stone-600 sm:text-lg">{description}</p></div>; }
function EmptyState({ children }: { children: React.ReactNode }) { return <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-500">{children}</p>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2"><span className="text-sm font-semibold text-stone-700">{label}</span>{children}</label>; }
function Landing() {
  const valueCards = [
    [Palette, "热门色系", "掌握流行色趋势"],
    [Layers3, "材质趋势", "洞察材质风向"],
    [Bookmark, "风格关键词", "精准定位风格"],
    [ShoppingCart, "采购建议", "智能推荐颜料"],
    [Bot, "AI 生成", "图像生成与优化"],
    [Folder, "后台管理", "结果同步与管理"],
  ] as const;
  const highlights = [
    [Sparkles, "AI 智能生成", "高效设计"],
    [Palette, "打样视觉", "细节更真实"],
    [ShoppingCart, "采购闭环", "一键下单"],
    [ImageIcon, "云端图片", "团队协作"],
  ] as const;

  return <Page><section className="relative grid items-center gap-10 py-8 md:grid-cols-[1.08fr_0.92fr] lg:py-12"><div className="space-y-7"><Badge>AI 轻量设计 × 打样采购闭环</Badge><h1 className="max-w-2xl text-4xl font-black leading-[1.03] tracking-[-0.055em] text-stone-950 sm:text-5xl lg:text-[4.35rem]"><span>用 AI 快速生成</span><br /><span className="text-[#b77a2b]">可打样的鞋履效果图</span></h1><p className="max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">上传四面鞋图或白板鞋参考图，几分钟生成可沟通、可采购、可迭代的设计效果图，并把结果同步给运营后台。</p><div className="flex flex-col gap-3 sm:flex-row"><Button onClick={() => { location.href = "/workspace"; }}>进入 AI 工作台 <ArrowRight className="size-4" aria-hidden="true" /></Button><Button className="border-transparent bg-white text-stone-950 shadow-[0_14px_32px_rgba(28,25,23,0.08)] hover:bg-stone-50" variant="outline" onClick={() => { location.href = "/procurement"; }}>查看采购颜料 <ArrowRight className="size-4" aria-hidden="true" /></Button></div><div className="grid max-w-2xl grid-cols-2 gap-4 pt-3 sm:grid-cols-4">{highlights.map(([Icon, title, body]) => <div key={title} className="flex items-center gap-3"><Icon className="size-5 shrink-0 text-[#b77a2b]" aria-hidden="true" /><div><p className="text-sm font-bold text-stone-900">{title}</p><p className="text-xs text-stone-500">{body}</p></div></div>)}</div></div><div className="relative"><div className="absolute -right-10 top-1/2 h-40 w-64 -translate-y-1/2 rounded-full border border-[#c58a38]/40 opacity-70" /><Card className="relative overflow-hidden rounded-[2rem] bg-stone-950 p-0 text-white shadow-[0_28px_90px_rgba(28,25,23,0.18)]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(183,122,43,0.36),transparent_18rem),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.18))]" /><div className="relative grid min-h-[25rem] grid-cols-2 gap-3 p-6 opacity-70">{["白板鞋", "配色稿", "俯视图", "侧面图"].map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.07] p-3"><div className="mb-3 h-20 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.22))] shadow-inner" /><p className="text-xs text-white/70">{index + 1}. {item}</p></div>)}</div><div className="absolute inset-0 grid place-items-center bg-stone-950/30"><div className="text-center"><div className="mx-auto mb-4 grid size-20 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur"><Play className="size-9" aria-hidden="true" /></div><p className="text-3xl font-black tracking-[-0.04em]">产品演示视频</p><p className="mt-2 text-sm text-stone-200">从素材上传到后台流转的完整路径</p></div></div></Card></div></section><section className="mt-10 rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-[0_22px_60px_rgba(28,25,23,0.055)]"><h2 className="text-center text-xl font-black tracking-[-0.03em] text-stone-950">为鞋履设计与采购全流程提效</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{valueCards.map(([Icon, title, body]) => <div key={title} className="rounded-2xl border border-stone-100 bg-[#fbfaf7] p-5 text-center"><Icon className="mx-auto mb-4 size-7 text-[#b77a2b]" aria-hidden="true" /><h3 className="font-bold text-stone-950">{title}</h3><p className="mt-2 text-xs text-stone-500">{body}</p></div>)}</div><div className="my-7 h-px bg-stone-200" /><h2 className="text-center text-xl font-black tracking-[-0.03em] text-stone-950">三步完成设计到采购闭环</h2><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr]"><div><Badge>01</Badge><h3 className="mt-3 font-black text-stone-950">上传图片</h3><p className="mt-1 text-sm text-stone-500">上传四面鞋图或参考图</p><div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-center"><Upload className="mx-auto mb-2 size-6 text-stone-700" aria-hidden="true" /><p className="font-semibold text-stone-900">拖拽或点击上传</p><p className="text-xs text-stone-500">支持 JPG / PNG / WEBP</p></div></div><ArrowRight className="mt-20 hidden size-5 text-[#b77a2b] lg:block" aria-hidden="true" /><div><Badge>02</Badge><h3 className="mt-3 font-black text-stone-950">AI 生成效果</h3><p className="mt-1 text-sm text-stone-500">AI 自动生成多种设计效果</p><div className="mt-4 grid grid-cols-3 gap-3">{["#f3eadb", "#d8a45c", "#22201e"].map((color) => <div key={color} className="h-20 rounded-2xl border border-stone-200" style={{ background: `linear-gradient(135deg, ${color}, #fff)` }} />)}</div></div><ArrowRight className="mt-20 hidden size-5 text-[#b77a2b] lg:block" aria-hidden="true" /><div><Badge>03</Badge><h3 className="mt-3 font-black text-stone-950">发送采购/后台</h3><p className="mt-1 text-sm text-stone-500">一键同步至采购与运营后台</p><div className="mt-4 flex items-center justify-center gap-4 rounded-2xl bg-[#fbfaf7] p-8"><ShoppingCart className="size-8 text-[#b77a2b]" aria-hidden="true" /><span className="h-px w-12 bg-[#b77a2b]/40" /><Database className="size-8 text-[#b77a2b]" aria-hidden="true" /></div></div></div></section><section id="faq" className="mt-8 rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_18px_50px_rgba(28,25,23,0.045)]"><div className="grid gap-6 md:grid-cols-[1fr_auto]"><div><h2 className="text-xl font-black tracking-[-0.03em] text-stone-950">常见问题</h2><p className="mt-5 font-semibold text-stone-800">占位生成的结果可以替换为真实 GPT-image-2 供应商吗？</p><p className="mt-2 text-sm leading-6 text-stone-500">可以。当前为 MVP，后续将支持接入真实 GPT-image-2 供应商。</p></div><Button variant="outline" onClick={() => { location.hash = "faq"; }}>查看全部问题 <ArrowRight className="size-4" aria-hidden="true" /></Button></div></section><footer className="mt-8 rounded-[2rem] bg-stone-950 px-7 py-6 text-white"><div className="grid gap-5 md:grid-cols-[1.2fr_1fr_1fr]"><div><div className="flex items-center gap-2 font-black"><span className="grid size-8 place-items-center rounded-xl bg-[#b77a2b]"><Sparkles className="size-4" aria-hidden="true" /></span>{BRAND_NAME}</div><p className="mt-2 text-sm text-stone-400">AI 鞋履设计与采购，让鞋履创新更高效。</p></div><nav className="flex flex-wrap items-center gap-5 text-sm text-stone-300"><a href="/">首页</a><a href="/workspace">AI 工作台</a><a href="/tools">图片工具</a><a href="/procurement">颜料采购</a><a href="#faq">帮助中心</a></nav><p className="text-sm text-stone-400 md:text-right">© 2024 ShoeForge AI. 保留所有权利。</p></div></footer></Page>;
}
function Workspace() {
  const { user } = useAuth();
  const [mode, setMode] = React.useState<GenerationMode>("four_view_to_model");
  const [prompt, setPrompt] = React.useState("");
  const [files, setFiles] = React.useState<UploadedAsset[]>([]);
  const [results, setResults] = React.useState<string[]>([]);
  const [error, setError] = React.useState("");
  const [historyOpen, setHistoryOpen] = React.useState(false);

  async function gen() {
    try {
      const userId = requireUser(user?.id);
      const required = mode === "four_view_to_model" ? 4 : 1;
      if (files.length < required) throw new Error("请先补齐必需图片");
      const inputFiles = files.slice(0, mode === "four_view_to_model" ? 4 : 2).map((f) => ({ ...f, userId }));
      const res = await submitGeneration({ userId, mode, prompt, assets: inputFiles });
      setResults(res.images.map((i) => i.url));
      setError("");
      toast.success("生成成功");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    }
  }

  const labels = mode === "four_view_to_model" ? ["正面", "侧面", "背面", "俯视"] : ["白板鞋图", "参考效果图"];
  const history = state.generationJobs.filter((j) => j.userId === user?.id).slice().reverse();

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

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <Card className="border-stone-200 bg-white/95 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.06)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2"><Upload className="size-5 text-[#b77a2b]" aria-hidden="true" />上传图片</CardTitle>
              <Button variant="ghost" aria-label="查看历史" onClick={() => setHistoryOpen(true)}><History className="size-5 text-[#b77a2b]" aria-hidden="true" /></Button>
            </div>
            <Field label="生成模式">
              <Select className="w-full" value={mode} onChange={(e) => { setMode(e.target.value as GenerationMode); setFiles([]); }}>
                <option value="four_view_to_model">四面图生成模特图</option>
                <option value="blank_shoe_style_transfer">白板鞋风格迁移</option>
              </Select>
            </Field>
            <div className="mt-5 space-y-3">
              {labels.map((label, i) => (
                <div key={label} className="rounded-2xl border border-stone-200 bg-[#fbfaf7] p-4">
                  <Label>{label}</Label>
                  <label className="mt-3 grid cursor-pointer place-items-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-5 text-center transition hover:border-[#b77a2b] hover:bg-amber-50/40">
                    <Input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const mimeError = validateImageMimeType(file.type);
                      if (mimeError) { setError(UNSUPPORTED_IMAGE_ERROR); return; }
                      const item = { ...asset(file.name, file.type), userId: user?.id ?? "demo" };
                      setFiles((prev) => {
                        const copy = [...prev];
                        copy[i] = item;
                        return copy.filter(Boolean);
                      });
                    }} />
                    <Upload className="mb-2 size-5 text-[#b77a2b]" aria-hidden="true" />
                    <span className="text-sm font-semibold text-stone-800">点击或拖拽上传</span>
                    <span className="mt-1 text-xs text-stone-500">支持 JPG、PNG、最大 10MB</span>
                  </label>
                  {files[i] && <p className="mt-2 truncate text-xs font-semibold text-emerald-700">已选择 {files[i].name}</p>}
                </div>
              ))}
            </div>
            <CardTitle className="mt-6 flex items-center gap-2"><Sparkles className="size-5 text-[#b77a2b]" aria-hidden="true" />生成设置</CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              {["极简", "机能", "潮流", "复古", "自定义"].map((tag) => (
                <Button key={tag} className="min-h-9 rounded-full px-4 py-1.5 text-xs" variant="outline" onClick={() => setPrompt((prev) => (prev ? `${prev}，${tag}` : tag))}>{tag}</Button>
              ))}
            </div>
          </Card>
        </aside>

        <section className="flex min-h-[76vh] flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white/95 shadow-[0_24px_70px_rgba(28,25,23,0.07)]">
          <div className="border-b border-stone-200 px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black tracking-[-0.03em] text-stone-950"><Sparkles className="size-5 text-[#b77a2b]" aria-hidden="true" />生成对话</h2>
                <p className="mt-1 text-sm text-stone-500">结果在中间，输入在底部。</p>
              </div>
              <Badge>{mode === "four_view_to_model" ? "四面图" : "白板迁移"}</Badge>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div className="rounded-[1.5rem] border border-[#b77a2b]/20 bg-amber-50/35 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-stone-600"><Sparkles className="size-4 text-[#b77a2b]" aria-hidden="true" />系统消息</p>
              <p className="mt-2 text-stone-900">上传后生成。</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Card className="relative overflow-hidden border-stone-800 bg-[linear-gradient(135deg,#11100f,#2b2926)] p-5 text-white shadow-[0_20px_50px_rgba(28,25,23,0.18)]">
                <CardTitle className="text-white">当前输入</CardTitle>
                <p className="mt-2 text-sm leading-6 text-stone-300">{prompt || "未填写描述"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {files.map((file) => <Badge key={file.id}>{file.name}</Badge>)}
                  {!files.length && <Badge>等待上传</Badge>}
                </div>
              </Card>
              <Card className="border-stone-200 bg-white p-5">
                <CardTitle>状态</CardTitle>
                <div className="mt-4 grid gap-3 text-sm text-stone-600">
                  <p className="flex items-center gap-3"><ImageIcon className="size-4 text-[#b77a2b]" aria-hidden="true" />需要图片：{mode === "four_view_to_model" ? 4 : 1}</p>
                  <p className="flex items-center gap-3"><Upload className="size-4 text-[#b77a2b]" aria-hidden="true" />已上传：{files.length}</p>
                  <p className="flex items-center gap-3"><Layers3 className="size-4 text-[#b77a2b]" aria-hidden="true" />结果数量：{results.length}</p>
                </div>
              </Card>
            </div>

            <div className="grid min-h-72 place-items-center rounded-[1.5rem] border border-dashed border-stone-200 bg-[#fbfaf7] p-6 text-center">
              {results.length ? <div className="grid w-full gap-4">{results.map((url, i) => <Card key={url} className="overflow-hidden p-0"><div className="grid gap-0 lg:grid-cols-[1fr_220px]"><img src={url} alt={`结果 ${i + 1}`} className="aspect-[4/3] w-full object-cover" /><div className="flex flex-col justify-between gap-4 p-4 text-left"><div><p className="text-sm font-semibold text-stone-500">生成结果 {i + 1}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline">查看</Button><Button variant="outline">选择</Button><Button onClick={() => { const job = state.generationJobs.at(-1); if (job && user) { sendGenerationToSupport(user.id, job.id); toast.success("已发送到后台"); } }}>发送</Button></div></div></div></Card>)}</div> : <div><Layers3 className="mx-auto mb-3 size-7 text-[#b77a2b]" aria-hidden="true" /><p className="text-sm text-stone-500">等待生成结果</p></div>}
            </div>
          </div>

          <div className="border-t border-stone-200 bg-white p-5">
            <div className="rounded-[1.5rem] border border-[#b77a2b]/50 bg-white p-3 shadow-[0_16px_50px_rgba(183,122,43,0.10)]">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <Textarea className="min-h-24 resize-none border-0 bg-transparent shadow-none focus:border-transparent focus:ring-0" maxLength={1000} placeholder="描述你想调整的颜色、材质、图案、鞋带、鞋底或展示角度..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <div className="flex flex-col justify-end gap-3 lg:w-44">
                  <Button className="w-full bg-[#b77a2b] hover:bg-[#a66d25]" onClick={() => void gen()}><Sparkles className="size-4" aria-hidden="true" />生成效果图</Button>
                  <p className="text-xs leading-5 text-stone-500">Shift + Enter 换行</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-stone-500">
                <div className="flex gap-2"><Button className="min-h-8 rounded-full px-3 py-1 text-xs" variant="ghost" onClick={() => setHistoryOpen(true)}><History className="size-4" aria-hidden="true" />历史</Button><Button className="min-h-8 rounded-full px-3 py-1 text-xs" variant="ghost" onClick={() => setPrompt("")}>清空</Button></div>
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
function Tools() { const {user}=useAuth(); const [kind,setKind]=React.useState<ImageToolKind>("enhance_clarity"); const [file,setFile]=React.useState<UploadedAsset|null>(null); const [out,setOut]=React.useState<string|null>(null); const [error,setError]=React.useState(""); async function run(){try{if(!file) throw new Error("请先上传一张图片"); const userId=requireUser(user?.id); const job=await processImageTool({userId,toolKind:kind,asset:{...file,userId}}); setOut(job.resultImageUrl); setError("");}catch(e){setError(e instanceof Error?e.message:"处理失败，请稍后重试");}} return <Page><div className="grid gap-4 md:grid-cols-3">{[["remove_background","去除背景"],["enhance_clarity","提升清晰度"],["upscale","放大图片"]].map(([value,label])=><Card key={value} className={kind===value?"ring-2 ring-slate-950":""}><CardTitle>{label}</CardTitle><Button className="mt-3" onClick={()=>setKind(value as ImageToolKind)}>选择</Button></Card>)}</div><Card className="mt-6"><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>{const f=e.target.files?.[0]; if(!f) return; const mimeError=validateImageMimeType(f.type); if(mimeError){setError(UNSUPPORTED_IMAGE_ERROR); return;} setFile(asset(f.name,f.type));}}/><Button className="mt-3" onClick={()=>void run()}>处理图片</Button>{error&&<p className="text-red-600">{error}</p>}{out&&<img src={out} className="mt-4 max-w-md rounded-xl" alt="处理结果"/>}</Card></Page>; }
function Procurement() { const {user}=useAuth(); const [color,setColor]=React.useState<PaintCatalogColor>(paintCatalog[4]); const [weight,setWeight]=React.useState(100); const [qty,setQty]=React.useState(2); const [cart,setCart]=React.useState<PaintOrderItem[]>([]); return <Page><div className="grid gap-4 md:grid-cols-4">{paintCatalog.map(c=><Card key={c.colorName}><div className="size-10 rounded-full border" style={{background:c.colorHex}}/><CardTitle>{c.colorName}</CardTitle><Button onClick={()=>setColor(c)}>选择</Button></Card>)}</div><Card className="mt-6"><Select value={weight} onChange={e=>setWeight(Number(e.target.value))}>{color.weights.map(w=><option key={w} value={w}>{w}g</option>)}</Select><Input className="mt-3" type="number" min={1} max={99} value={qty} onChange={e=>setQty(Number(e.target.value))}/><Button className="mt-3" onClick={()=>setCart([...cart,{colorName:color.colorName,colorHex:color.colorHex,weightGrams:weight,quantity:qty}])}>加入采购车</Button><Table><THead><TR><TH>颜色</TH><TH>规格</TH><TH>数量</TH></TR></THead><TBody>{cart.map((i,idx)=><TR key={idx}><TD>{i.colorName}</TD><TD>{i.weightGrams}g</TD><TD>{i.quantity}</TD></TR>)}</TBody></Table><Button onClick={()=>{try{createPaintOrder(requireUser(user?.id),cart); toast.success("采购需求已发送到后台");}catch(e){toast.error(e instanceof Error?e.message:"提交失败");}}}>发送采购需求</Button></Card></Page>; }
function Recharge() { const {user,setUser}=useAuth(); const [amount,setAmount]=React.useState(9900); const [provider,setProvider]=React.useState<"alipay"|"wechat">("alipay"); const [order,setOrder]=React.useState<RechargeOrder|null>(null); return <Page><Card><CardTitle>充值</CardTitle><div className="mt-4 flex flex-wrap gap-2">{[9900,19900,49900].map(v=><Button key={v} variant={amount===v?"default":"outline"} onClick={()=>setAmount(v)}>{formatCny(v)}</Button>)}</div><div className="mt-4 grid gap-3 md:grid-cols-2"><Input type="number" min={10} max={9999} value={amount/100} onChange={e=>setAmount(Number(e.target.value)*100)}/><Select value={provider} onChange={e=>setProvider(e.target.value as typeof provider)}><option value="alipay">alipay</option><option value="wechat">wechat</option></Select></div><Button className="mt-4" onClick={()=>{try{setOrder(createRechargeOrder({userId:requireUser(user?.id),provider,amountCents:amount}));}catch(e){toast.error(e instanceof Error?e.message:"创建失败");}}}>创建充值订单</Button>{order&&<Card className="mt-4 border-amber-700/20 bg-amber-50/70"><CardTitle>{order.provider==="alipay"?"支付宝模拟支付":"微信模拟支付"}</CardTitle><p className="mt-2 text-sm text-stone-600">订单金额 {formatCny(order.amountCents)}，确认后写入账户余额。</p><Button className="mt-3" onClick={()=>{try{markRechargePaid(order.id); const u=state.users.find(x=>x.id===user?.id); if(u) setUser(safeUser(u)); toast.success("充值成功");}catch(e){toast.error(e instanceof Error?e.message:"支付失败");}}}>模拟支付成功</Button></Card>}</Card></Page>; }
function Account() { const {user}=useAuth(); if(!user) return <Page><Card>请先登录</Card></Page>; const jobs=state.generationJobs.filter(j=>j.userId===user.id); const orders=state.paintOrders.filter(o=>o.userId===user.id); const recharges=state.rechargeOrders.filter(o=>o.userId===user.id); return <Page><Card><CardTitle>用户信息</CardTitle><p>{user.phone}</p><p>{user.displayName}</p><p>余额 {formatCny(user.balanceCents)}</p></Card><div className="mt-4 grid gap-4 md:grid-cols-3"><Card><CardTitle>生成历史</CardTitle>{jobs.map(j=><p key={j.id}>{j.prompt}</p>)}</Card><Card><CardTitle>订单记录</CardTitle>{orders.map(o=><p key={o.id}>{o.status}</p>)}</Card><Card><CardTitle>充值记录</CardTitle>{recharges.map(o=><p key={o.id}>{formatCny(o.amountCents)} {o.status}</p>)}</Card></div></Page>; }
function AdminLogin() { const {loginPassword}=useAuth(); const [phone,setPhone]=React.useState("18800000000"); const [password,setPassword]=React.useState("admin123456"); const [error,setError]=React.useState(""); return <Page><Card className="mx-auto max-w-md"><CardTitle>后台登录</CardTitle><Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="管理员手机号" /><Input className="mt-3" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="管理员密码" /><Button className="mt-3 w-full" onClick={async()=>{try{await loginPassword(phone,password); location.href="/admin";}catch(e){setError(e instanceof Error?e.message:"登录失败");}}}>进入后台</Button>{error&&<p className="mt-2 text-sm text-red-600">{error}</p>}</Card></Page>; }
function Admin() {
  const { user } = useAuth();
  if (!user) return <AdminLogin />;
  if (user.role !== "admin") return <AdminLogin />;
  ensureAdminDemoData();

  const stats = adminDashboard(user);
  const section = location.pathname.split("/")[2] ?? "dashboard";
  const nav = [
    { href: "/admin", label: "总览", count: null },
    { href: "/admin/users", label: "用户", count: state.users.length },
    { href: "/admin/generations", label: "生成", count: state.generationJobs.length },
    { href: "/admin/procurement", label: "采购", count: state.paintOrders.length },
    { href: "/admin/recharge", label: "充值", count: state.rechargeOrders.length },
    { href: "/admin/support", label: "客服", count: state.supportConversations.length },
  ];
  const kpis = [
    [Users, "用户", stats.users, "+12%"],
    [Sparkles, "生成", stats.generationJobs, "+24%"],
    [ShoppingCart, "待采购", stats.submittedProcurementOrders, "待办"],
    [WalletCards, "待充值", stats.pendingRechargeOrders, "核销"],
    [MessageSquare, "客服", stats.openSupportConversations, "开放"],
  ] as const;
  const bars = [72, 48, 66, 84, 57, 92, 76];
  const procurementTotal = Math.max(state.paintOrders.length, 1);
  const submitted = state.paintOrders.filter((order) => order.status === "submitted").length;
  const processing = state.paintOrders.filter((order) => order.status === "processing").length;
  const fulfilled = state.paintOrders.filter((order) => order.status === "fulfilled").length;
  const rechargeTotal = Math.max(state.rechargeOrders.length, 1);
  const paidRecharge = state.rechargeOrders.filter((order) => order.status === "paid").length;

  return (
    <Page>
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card className="overflow-hidden p-3">
            <div className="px-3 py-3">
              <Badge>Mgmt</Badge>
              <p className="mt-3 text-lg font-black tracking-[-0.03em] text-stone-950">运营后台</p>
            </div>
            <nav className="mt-2 grid gap-1" aria-label="后台导航">
              {nav.map((item) => {
                const active = (section === "dashboard" && item.href === "/admin") || item.href.endsWith(`/${section}`);
                return <a className={`flex min-h-11 items-center justify-between rounded-2xl px-3 text-sm font-semibold transition ${active ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`} key={item.href} href={item.href}><span>{item.label}</span>{item.count !== null && <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15 text-white" : "bg-stone-100 text-stone-500"}`}>{item.count}</span>}</a>;
              })}
            </nav>
          </Card>
        </aside>

        <section className="min-w-0 space-y-5">
          {section === "dashboard" && <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><Badge>Dashboard</Badge><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-stone-950">运营总览</h1></div>
              <p className="text-sm font-medium text-stone-500">实时演示数据 · 最近 7 天</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map(([Icon, label, value, trend]) => <Card key={label} className="p-5"><div className="flex items-start justify-between"><Icon className="size-5 text-[#b77a2b]" aria-hidden="true" /><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-[#8a5a20]">{trend}</span></div><p className="mt-5 text-sm font-semibold text-stone-500">{label}</p><p className="mt-2 text-3xl font-black tracking-[-0.04em] text-stone-950">{value}</p></Card>)}
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
              <Card><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-[#b77a2b]" aria-hidden="true" />生成趋势</CardTitle><Badge>7 days</Badge></div><div className="mt-6 flex h-72 items-end gap-3 rounded-3xl bg-[#fbfaf7] p-5" aria-label="最近七天生成趋势柱状图">{bars.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-2xl bg-[#b77a2b] transition" style={{ height: `${height}%`, opacity: 0.38 + index * 0.07 }} /><span className="text-xs text-stone-500">D{index + 1}</span></div>)}</div></Card>
              <Card><CardTitle className="flex items-center gap-2"><PieChart className="size-5 text-[#b77a2b]" aria-hidden="true" />采购状态</CardTitle><div className="mt-6 grid place-items-center"><div className="grid size-48 place-items-center rounded-full" style={{ background: `conic-gradient(#b77a2b 0 ${Math.round(submitted / procurementTotal * 100)}%, #d8b079 0 ${Math.round((submitted + processing) / procurementTotal * 100)}%, #e7e5e4 0 100%)` }}><div className="grid size-30 place-items-center rounded-full bg-white text-center shadow-inner"><p className="text-3xl font-black text-stone-950">{state.paintOrders.length}</p><p className="text-xs text-stone-500">订单</p></div></div></div><div className="mt-5 grid gap-2 text-sm text-stone-600"><p>待处理：{submitted}</p><p>处理中：{processing}</p><p>已完成：{fulfilled}</p></div></Card>
            </div>
            <div className="grid gap-5 xl:grid-cols-3">
              <Card><CardTitle className="flex items-center gap-2"><Activity className="size-5 text-[#b77a2b]" aria-hidden="true" />充值转化</CardTitle><div className="mt-5 h-3 rounded-full bg-stone-100"><div className="h-3 rounded-full bg-[#b77a2b]" style={{ width: `${Math.round(paidRecharge / rechargeTotal * 100)}%` }} /></div><p className="mt-3 text-sm text-stone-500">已支付 {paidRecharge} / {state.rechargeOrders.length}</p></Card>
              <Card><CardTitle>待办</CardTitle><div className="mt-4 space-y-3 text-sm text-stone-600"><p>待处理采购：{stats.submittedProcurementOrders}</p><p>待支付充值：{stats.pendingRechargeOrders}</p><p>开放客服：{stats.openSupportConversations}</p></div></Card>
              <Card><CardTitle>最新生成</CardTitle><div className="mt-4 space-y-2 text-sm text-stone-600">{state.generationJobs.slice(-3).reverse().map((job) => <p key={job.id} className="truncate">{job.prompt || job.mode}</p>)}{!state.generationJobs.length && <EmptyState>暂无记录</EmptyState>}</div></Card>
            </div>
          </>}
          {section === "users" && <Card><div className="mb-4 flex items-center justify-between"><CardTitle>用户管理</CardTitle><Badge>{state.users.length} users</Badge></div><div className="overflow-x-auto"><Table><THead><TR><TH>手机号</TH><TH>角色</TH><TH>余额</TH><TH>注册时间</TH></TR></THead><TBody>{state.users.map((item) => <TR key={item.id}><TD>{item.phone}</TD><TD>{item.role}</TD><TD>{formatCny(item.balanceCents)}</TD><TD>{item.createdAt}</TD></TR>)}</TBody></Table></div></Card>}
          {section === "generations" && <div className="grid gap-4">{state.generationJobs.map((job) => <Card key={job.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{state.users.find((item) => item.id === job.userId)?.phone ?? "未知用户"}</CardTitle><p className="mt-1 text-sm text-stone-500">{job.mode} · {job.status}</p></div><Badge>{job.status}</Badge></div><p className="mt-4 text-sm text-stone-600">{job.prompt || "无提示词"}</p><img className="mt-4 max-w-40 rounded-2xl" src={JSON.parse(job.resultImageUrlsJson)[0]} alt="生成结果" /></Card>)}</div>}
          {section === "procurement" && <div className="grid gap-4">{state.paintOrders.map((order) => <Card key={order.id}><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{order.status}</CardTitle><Badge>{order.createdAt}</Badge></div><p className="mt-3 text-sm text-stone-600">{state.paintOrderItems.filter((item) => item.orderId === order.id).map((item) => `${item.colorName} ${item.weightGrams}g x${item.quantity}`).join("，")}</p><div className="mt-4 flex gap-2"><Button variant="outline" onClick={() => { try { updateProcurementStatus(user, order.id, "processing"); toast.success("已更新"); } catch (e) { toast.error(e instanceof Error ? e.message : "非法状态变更"); } }}>processing</Button><Button onClick={() => { try { updateProcurementStatus(user, order.id, "fulfilled"); toast.success("已更新"); } catch (e) { toast.error(e instanceof Error ? e.message : "非法状态变更"); } }}>fulfilled</Button></div></Card>)}</div>}
          {section === "recharge" && <div className="grid gap-4">{state.rechargeOrders.map((order) => <Card key={order.id}><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{formatCny(order.amountCents)}</CardTitle><Badge>{order.status}</Badge></div><p className="mt-2 text-sm text-stone-600">{order.provider}</p><Button className="mt-4" onClick={() => { try { adminMarkRechargePaid(user, order.id); toast.success("已支付"); } catch (e) { toast.error(e instanceof Error ? e.message : "订单已支付"); } }}>标记已支付</Button></Card>)}</div>}
          {section === "support" && <div className="grid gap-4">{state.supportConversations.map((conversation) => <Card key={conversation.id}><CardTitle>{conversation.guestName ?? conversation.userId}</CardTitle><div className="mt-4 space-y-2 text-sm text-stone-600">{state.supportMessages.filter((message) => message.conversationId === conversation.id).map((message) => <p key={message.id}>{message.sender}: {message.body}</p>)}</div><Button className="mt-4" onClick={() => adminReply(user, conversation.id, "后台已收到")}>回复</Button></Card>)}</div>}
        </section>
      </div>
    </Page>
  );
}
export function App() { const path = location.pathname; if (path.startsWith("/admin")) return <Admin />; if (path === "/workspace") return <Workspace />; if (path === "/tools") return <Tools />; if (path === "/procurement") return <Procurement />; if (path === "/recharge") return <Recharge />; if (path === "/account") return <Account />; return <Landing />; }
