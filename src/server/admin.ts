import type { ProcurementStatus, SafeUser, UserRole } from "@/lib/types";
import { requireAdmin } from "./auth";
import { newId, nowIso, state } from "./dataStore";
import { markRechargePaid } from "./recharge";

const nextStatuses: Record<ProcurementStatus, ProcurementStatus[]> = {
  submitted: ["processing", "cancelled"],
  processing: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

export function adminDashboard(admin: SafeUser) {
  requireAdmin(admin);
  return {
    users: state.users.length,
    generationJobs: state.generationJobs.length,
    submittedProcurementOrders: state.paintOrders.filter((order) => order.status === "submitted").length,
    pendingRechargeOrders: state.rechargeOrders.filter((order) => order.status === "pending").length,
    openSupportConversations: state.supportConversations.filter((conversation) => conversation.status === "open").length,
  };
}

export function updateUserRole(admin: SafeUser, userId: string, role: UserRole) {
  requireAdmin(admin);
  const user = state.users.find((item) => item.id === userId);
  if (!user) throw new Error("用户不存在");
  user.role = role;
  user.updatedAt = nowIso();
  state.adminAuditLogs.push({ id: newId("audit"), adminUserId: admin.id, action: "user.role.update", targetType: "user", targetId: userId, createdAt: nowIso() });
  return user;
}

export function updateProcurementStatus(admin: SafeUser, orderId: string, status: ProcurementStatus) {
  requireAdmin(admin);
  const order = state.paintOrders.find((item) => item.id === orderId);
  if (!order) throw new Error("订单不存在");
  if (!nextStatuses[order.status].includes(status)) throw new Error("非法状态变更");
  order.status = status;
  order.updatedAt = nowIso();
  return order;
}

export function adminMarkRechargePaid(admin: SafeUser, orderId: string) {
  requireAdmin(admin);
  return markRechargePaid(orderId);
}

export function adminReply(admin: SafeUser, conversationId: string, body: string) {
  requireAdmin(admin);
  if (!body.trim()) throw new Error("消息不能为空");
  const conversation = state.supportConversations.find((item) => item.id === conversationId);
  if (!conversation) throw new Error("会话不存在");
  const message = { id: newId("msg"), conversationId, sender: "admin" as const, body, createdAt: nowIso() };
  state.supportMessages.push(message);
  return message;
}
