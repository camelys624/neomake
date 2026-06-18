import { nanoid } from "nanoid";
import type { GenerationMode, GenerationStatus, ImageToolKind, PaymentProvider, PaymentStatus, ProcurementStatus, SafeUser, UserRole } from "@/lib/types";

export type StoredUser = SafeUser & { passwordHash: string | null };
export interface StoredSmsCode { id: string; phone: string; code: string; purpose: "login_or_register"; expiresAt: string; consumedAt: string | null; createdAt: string }
export interface StoredSession { id: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string }
export interface StoredAsset { id: string; userId: string; name: string; mimeType: string; dataUrl: string; createdAt: string }
export interface StoredGenerationJob { id: string; userId: string; mode: GenerationMode; prompt: string; sourceAssetIdsJson: string; resultImageUrlsJson: string; status: GenerationStatus; errorMessage: string | null; createdAt: string; updatedAt: string }
export interface StoredImageToolJob { id: string; userId: string; toolKind: ImageToolKind; sourceAssetId: string; resultImageUrl: string | null; status: GenerationStatus; errorMessage: string | null; createdAt: string; updatedAt: string }
export interface StoredPaintOrder { id: string; userId: string; status: ProcurementStatus; note: string | null; createdAt: string; updatedAt: string }
export interface StoredPaintOrderItem { id: string; orderId: string; colorName: string; colorHex: string; weightGrams: number; quantity: number }
export interface StoredRechargeOrder { id: string; userId: string; provider: PaymentProvider; amountCents: number; status: PaymentStatus; providerTradeNo: string | null; createdAt: string; updatedAt: string }
export interface StoredSupportConversation { id: string; userId: string | null; guestName: string | null; status: "open" | "closed"; createdAt: string; updatedAt: string }
export interface StoredSupportMessage { id: string; conversationId: string; sender: "user" | "assistant" | "admin"; body: string; createdAt: string }
export interface StoredAdminAuditLog { id: string; adminUserId: string; action: string; targetType: string; targetId: string; createdAt: string }

export interface StoreState {
  users: StoredUser[];
  sessions: StoredSession[];
  smsCodes: StoredSmsCode[];
  assets: StoredAsset[];
  generationJobs: StoredGenerationJob[];
  imageToolJobs: StoredImageToolJob[];
  paintOrders: StoredPaintOrder[];
  paintOrderItems: StoredPaintOrderItem[];
  rechargeOrders: StoredRechargeOrder[];
  supportConversations: StoredSupportConversation[];
  supportMessages: StoredSupportMessage[];
  adminAuditLogs: StoredAdminAuditLog[];
}

export const state: StoreState = {
  users: [], sessions: [], smsCodes: [], assets: [], generationJobs: [], imageToolJobs: [], paintOrders: [], paintOrderItems: [], rechargeOrders: [], supportConversations: [], supportMessages: [], adminAuditLogs: [],
};

export function nowIso() { return new Date().toISOString(); }
export function newId(prefix: string) { return `${prefix}_${nanoid(12)}`; }
export function resetStore() { for (const key of Object.keys(state) as Array<keyof StoreState>) state[key].splice(0); }
export function safeUser(user: StoredUser): SafeUser { const { passwordHash: _passwordHash, ...safe } = user; return safe; }
export function findUserByPhone(phone: string) { return state.users.find((user) => user.phone === phone); }
export function createUser(input: { phone: string; passwordHash?: string | null; role?: UserRole; displayName?: string }) {
  const at = nowIso();
  const user: StoredUser = { id: newId("usr"), phone: input.phone, passwordHash: input.passwordHash ?? null, displayName: input.displayName ?? `鞋履用户 ${input.phone.slice(-4)}`, avatarUrl: null, role: input.role ?? "user", balanceCents: 0, createdAt: at, updatedAt: at };
  state.users.push(user);
  return user;
}

function demoSvg(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" rx="28" fill="#0f172a"/><path d="M120 265 C210 150 388 145 512 250 L548 290 C420 330 238 328 104 300 Z" fill="#f8fafc"/><text x="44" y="72" fill="#fff" font-family="Arial" font-size="34" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ensureAdminDemoData() {
  const at = nowIso();
  const user = findUserByPhone("16600000000") ?? createUser({ phone: "16600000000", role: "user", displayName: "示例客户" });
  if (state.generationJobs.length === 0) {
    state.generationJobs.push({ id: "gen_demo_001", userId: user.id, mode: "four_view_to_model", prompt: "红色鞋面，银色鞋底，街头风", sourceAssetIdsJson: JSON.stringify(["asset_front", "asset_side", "asset_back", "asset_top"]), resultImageUrlsJson: JSON.stringify([demoSvg("红色街头风鞋履"), demoSvg("银色鞋底展示")]), status: "succeeded", errorMessage: null, createdAt: at, updatedAt: at });
    state.generationJobs.push({ id: "gen_demo_002", userId: user.id, mode: "blank_shoe_style_transfer", prompt: "白板鞋改成森林绿户外机能风", sourceAssetIdsJson: JSON.stringify(["asset_blank"]), resultImageUrlsJson: JSON.stringify([demoSvg("森林绿机能风")]), status: "processing", errorMessage: null, createdAt: at, updatedAt: at });
  }
  if (state.paintOrders.length === 0) {
    state.paintOrders.push({ id: "po_demo_001", userId: user.id, status: "submitted", note: "客户希望本周内确认库存", createdAt: at, updatedAt: at });
    state.paintOrderItems.push({ id: "poi_demo_001", orderId: "po_demo_001", colorName: "宝蓝", colorHex: "#2563eb", weightGrams: 100, quantity: 2 });
    state.paintOrderItems.push({ id: "poi_demo_002", orderId: "po_demo_001", colorName: "金属银", colorHex: "#94a3b8", weightGrams: 50, quantity: 1 });
  }
  if (state.rechargeOrders.length === 0) {
    state.rechargeOrders.push({ id: "rch_demo_001", userId: user.id, provider: "alipay", amountCents: 9900, status: "pending", providerTradeNo: null, createdAt: at, updatedAt: at });
    state.rechargeOrders.push({ id: "rch_demo_002", userId: user.id, provider: "wechat", amountCents: 19900, status: "paid", providerTradeNo: "sim_rch_demo_002", createdAt: at, updatedAt: at });
  }
  if (state.supportConversations.length === 0) {
    state.supportConversations.push({ id: "conv_demo_001", userId: user.id, guestName: null, status: "open", createdAt: at, updatedAt: at });
    state.supportMessages.push({ id: "msg_demo_001", conversationId: "conv_demo_001", sender: "user", body: "我想确认采购的宝蓝颜料什么时候处理", createdAt: at });
    state.supportMessages.push({ id: "msg_demo_002", conversationId: "conv_demo_001", sender: "assistant", body: "采购需求已记录，后台会尽快处理。", createdAt: at });
  }
  return user;
}
