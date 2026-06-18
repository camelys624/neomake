import type { PaymentProvider, PaymentStatus } from "@/lib/types";
import { newId, nowIso, state } from "./dataStore";

export interface RechargeOrder {
  id: string;
  userId: string;
  provider: PaymentProvider;
  amountCents: number;
  status: PaymentStatus;
  providerTradeNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createRechargeOrder(input: { userId: string; provider: PaymentProvider; amountCents: number }): RechargeOrder {
  if (!input.userId) throw new Error("请先登录");
  if (input.amountCents < 1000 || input.amountCents > 999900) throw new Error("充值金额需在 ¥10 到 ¥9999 之间");
  const at = nowIso();
  const order: RechargeOrder = { id: newId("rch"), userId: input.userId, provider: input.provider, amountCents: input.amountCents, status: "pending", providerTradeNo: null, createdAt: at, updatedAt: at };
  state.rechargeOrders.push(order);
  return order;
}

export function markRechargePaid(orderId: string) {
  const order = state.rechargeOrders.find((item) => item.id === orderId);
  if (!order) throw new Error("订单不存在");
  if (order.status === "paid") throw new Error("订单已支付");
  const user = state.users.find((item) => item.id === order.userId);
  if (!user) throw new Error("用户不存在");
  order.status = "paid";
  order.providerTradeNo = `sim_${order.id}`;
  order.updatedAt = nowIso();
  user.balanceCents += order.amountCents;
  user.updatedAt = nowIso();
  return order;
}
