import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/appState";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCny } from "@/lib/utils";
import { state, safeUser } from "@/server/dataStore";
import { createRechargeOrder, markRechargePaid, type RechargeOrder } from "@/server/recharge";
import { Page, requireUser } from "./common";

export function RechargePage() {
  const { user, setUser } = useAuth();
  const [amount, setAmount] = React.useState(9900);
  const [provider, setProvider] = React.useState<"alipay" | "wechat">("alipay");
  const [order, setOrder] = React.useState<RechargeOrder | null>(null);

  return <Page><Card><CardTitle>充值</CardTitle><div className="mt-4 flex flex-wrap gap-2">{[9900, 19900, 49900].map((v) => <Button key={v} variant={amount === v ? "default" : "outline"} onClick={() => setAmount(v)}>{formatCny(v)}</Button>)}</div><div className="mt-4 grid gap-3 md:grid-cols-2"><Input type="number" min={10} max={9999} value={amount / 100} onChange={(e) => setAmount(Number(e.target.value) * 100)} /><Select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}><option value="alipay">alipay</option><option value="wechat">wechat</option></Select></div><Button className="mt-4" onClick={() => { try { setOrder(createRechargeOrder({ userId: requireUser(user?.id), provider, amountCents: amount })); } catch (e) { toast.error(e instanceof Error ? e.message : "创建失败"); } }}>创建充值订单</Button>{order && <Card className="mt-4 border-amber-700/20 bg-amber-50/70"><CardTitle>{order.provider === "alipay" ? "支付宝模拟支付" : "微信模拟支付"}</CardTitle><p className="mt-2 text-sm text-stone-600">订单金额 {formatCny(order.amountCents)}，确认后写入账户余额。</p><Button className="mt-3" onClick={() => { try { markRechargePaid(order.id); const u = state.users.find((x) => x.id === user?.id); if (u) setUser(safeUser(u)); toast.success("充值成功"); } catch (e) { toast.error(e instanceof Error ? e.message : "支付失败"); } }}>模拟支付成功</Button></Card>}</Card></Page>;
}
