import { useAuth } from "@/appState";
import { Card, CardTitle } from "@/components/ui/card";
import { formatCny } from "@/lib/utils";
import { state } from "@/server/dataStore";
import { Page } from "./common";

export function AccountPage() {
  const { user } = useAuth();
  if (!user) return <Page><Card>请先登录</Card></Page>;
  const jobs = state.generationJobs.filter((j) => j.userId === user.id);
  const orders = state.paintOrders.filter((o) => o.userId === user.id);
  const recharges = state.rechargeOrders.filter((o) => o.userId === user.id);

  return <Page><Card><CardTitle>用户信息</CardTitle><p>{user.phone}</p><p>{user.displayName}</p><p>余额 {formatCny(user.balanceCents)}</p></Card><div className="mt-4 grid gap-4 md:grid-cols-3"><Card><CardTitle>生成历史</CardTitle>{jobs.map((j) => <p key={j.id}>{j.prompt}</p>)}</Card><Card><CardTitle>订单记录</CardTitle>{orders.map((o) => <p key={o.id}>{o.status}</p>)}</Card><Card><CardTitle>充值记录</CardTitle>{recharges.map((o) => <p key={o.id}>{formatCny(o.amountCents)} {o.status}</p>)}</Card></div></Page>;
}
