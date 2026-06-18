import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  balanceCents: integer("balance_cents").notNull().default(0),
  ...timestamps,
}, (table) => [uniqueIndex("users_phone_unique").on(table.phone)]);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const smsCodes = sqliteTable("sms_codes", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  purpose: text("purpose", { enum: ["login_or_register"] }).notNull(),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  createdAt: text("created_at").notNull(),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  dataUrl: text("data_url").notNull(),
  createdAt: text("created_at").notNull(),
});

export const generationJobs = sqliteTable("generation_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  mode: text("mode", { enum: ["four_view_to_model", "blank_shoe_style_transfer"] }).notNull(),
  prompt: text("prompt").notNull(),
  sourceAssetIdsJson: text("source_asset_ids_json").notNull(),
  resultImageUrlsJson: text("result_image_urls_json").notNull(),
  status: text("status", { enum: ["queued", "processing", "succeeded", "failed"] }).notNull(),
  errorMessage: text("error_message"),
  ...timestamps,
});

export const imageToolJobs = sqliteTable("image_tool_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  toolKind: text("tool_kind", { enum: ["remove_background", "enhance_clarity", "upscale"] }).notNull(),
  sourceAssetId: text("source_asset_id").notNull().references(() => assets.id),
  resultImageUrl: text("result_image_url"),
  status: text("status", { enum: ["queued", "processing", "succeeded", "failed"] }).notNull(),
  errorMessage: text("error_message"),
  ...timestamps,
});

export const paintOrders = sqliteTable("paint_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status", { enum: ["submitted", "processing", "fulfilled", "cancelled"] }).notNull(),
  note: text("note"),
  ...timestamps,
});

export const paintOrderItems = sqliteTable("paint_order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => paintOrders.id),
  colorName: text("color_name").notNull(),
  colorHex: text("color_hex").notNull(),
  weightGrams: integer("weight_grams").notNull(),
  quantity: integer("quantity").notNull(),
});

export const rechargeOrders = sqliteTable("recharge_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider", { enum: ["alipay", "wechat"] }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { enum: ["pending", "paid", "failed"] }).notNull(),
  providerTradeNo: text("provider_trade_no"),
  ...timestamps,
});

export const supportConversations = sqliteTable("support_conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  guestName: text("guest_name"),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  ...timestamps,
});

export const supportMessages = sqliteTable("support_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => supportConversations.id),
  sender: text("sender", { enum: ["user", "assistant", "admin"] }).notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  createdAt: text("created_at").notNull(),
});
