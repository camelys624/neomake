import * as React from "react";
import { Activity, BarChart3, MessageSquare, PieChart, ShoppingCart, Sparkles, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/appState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCny } from "@/lib/utils";
import { state, ensureAdminDemoData } from "@/server/dataStore";
import { adminDashboard, adminMarkRechargePaid, adminReply, updateProcurementStatus } from "@/server/admin";
import { EmptyState, Page } from "./common";

function AdminLoginPage() { const {loginPassword}=useAuth(); const [phone,setPhone]=React.useState("18800000000"); const [password,setPassword]=React.useState("admin123456"); const [error,setError]=React.useState(""); return <Page><Card className="mx-auto max-w-md"><CardTitle>后台登录</CardTitle><Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="管理员手机号" /><Input className="mt-3" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="管理员密码" /><Button className="mt-3 w-full" onClick={async()=>{try{await loginPassword(phone,password); location.href="/admin";}catch(e){setError(e instanceof Error?e.message:"登录失败");}}}>进入后台</Button>{error&&<p className="mt-2 text-sm text-red-600">{error}</p>}</Card></Page>; }

export function AdminPage() {
  const { user } = useAuth();
  if (!user) return <AdminLoginPage />;
  if (user.role !== "admin") return <AdminLoginPage />;
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
