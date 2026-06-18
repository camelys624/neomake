import { paintCatalog } from "@/lib/paintCatalog";
import type { PaintOrderItem } from "@/lib/types";
import { newId, nowIso, state } from "./dataStore";

export function validatePaintItem(item: PaintOrderItem) {
  const color = paintCatalog.find((entry) => entry.colorName === item.colorName && entry.colorHex === item.colorHex);
  if (!color || !(color.weights as readonly number[]).includes(item.weightGrams)) throw new Error("请选择有效规格");
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) throw new Error("数量必须是 1–99 的整数");
}

export function createPaintOrder(userId: string, items: PaintOrderItem[], note: string | null = null) {
  if (!userId) throw new Error("请先登录");
  if (items.length === 0) throw new Error("请先选择颜料");
  items.forEach(validatePaintItem);
  const at = nowIso();
  const order = { id: newId("po"), userId, status: "submitted" as const, note, createdAt: at, updatedAt: at };
  state.paintOrders.push(order);
  for (const item of items) state.paintOrderItems.push({ id: newId("poi"), orderId: order.id, ...item });
  return order;
}
