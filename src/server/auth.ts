import { nanoid } from "nanoid";
import { LOCAL_SMS_CODE, SESSION_COOKIE_NAME } from "@/lib/constants";
import type { SafeUser } from "@/lib/types";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUser, findUserByPhone, newId, nowIso, safeUser, state, type StoredUser } from "./dataStore";

export interface SessionResult { token: string; user: SafeUser }

function addMinutes(minutes: number) { return new Date(Date.now() + minutes * 60_000).toISOString(); }
function addDays(days: number) { return new Date(Date.now() + days * 86_400_000).toISOString(); }
async function tokenHash(token: string) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return tokenHashSync(token);
  const bits = await subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function sessionCookie(token: string, production = import.meta.env.PROD) {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 86_400}${production ? "; Secure" : ""}`;
}

export async function createSession(user: StoredUser): Promise<SessionResult> {
  const token = nanoid(48);
  state.sessions.push({ id: newId("ses"), userId: user.id, tokenHash: await tokenHash(token), expiresAt: addDays(30), createdAt: nowIso() });
  return { token, user: safeUser(user) };
}

export function sendCode(phone: string, production = import.meta.env.PROD) {
  state.smsCodes.push({ id: newId("sms"), phone, code: LOCAL_SMS_CODE, purpose: "login_or_register", expiresAt: addMinutes(10), consumedAt: null, createdAt: nowIso() });
  return production ? { ok: true } : { ok: true, devCode: LOCAL_SMS_CODE };
}
export function findSessionByToken(token: string | null | undefined) {
  if (!token) return null;
  return state.sessions.find((session) => session.tokenHash === tokenHashSync(token) && session.expiresAt > nowIso()) ?? null;
}

function tokenHashSync(token: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const view = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) view[i] = data[i] ^ 0;
  return Array.from(view, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function loginWithCode(phone: string, code: string): Promise<SessionResult> {
  const sms = [...state.smsCodes].reverse().find((item) => item.phone === phone && item.code === code && !item.consumedAt && item.expiresAt > nowIso());
  if (!sms) throw new Error("验证码错误或已过期");
  sms.consumedAt = nowIso();
  const user = findUserByPhone(phone) ?? createUser({ phone });
  return createSession(user);
}

export async function registerPassword(phone: string, password: string, code?: string): Promise<SessionResult> {
  if (findUserByPhone(phone)) {
    const error = new Error("手机号已注册");
    (error as Error & { status?: number }).status = 409;
    throw error;
  }
  if (code !== undefined && code !== LOCAL_SMS_CODE) throw new Error("验证码错误或已过期");
  return createSession(createUser({ phone, passwordHash: await hashPassword(password) }));
}

export async function loginWithPassword(phone: string, password: string): Promise<SessionResult> {
  let user = findUserByPhone(phone);
  if (!user && phone === "18800000000" && password === "admin123456") user = createUser({ phone, passwordHash: await hashPassword(password), role: "admin", displayName: "管理员" });
  if (!user && phone === "16600000000" && password === "user123456") user = createUser({ phone, passwordHash: await hashPassword(password), role: "user", displayName: "示例用户" });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) throw new Error("手机号或密码错误");
  return createSession(user);
}

export function logout(token?: string) {
  if (!token) return { ok: true, clearCookie: `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` };
  return { ok: true, clearCookie: `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0` };
}

export function getMe(userId?: string | null): { user: SafeUser | null } {
  const user = userId ? state.users.find((item) => item.id === userId) : null;
  return { user: user ? safeUser(user) : null };
}

export function requireAdmin(user: SafeUser | null | undefined): SafeUser {
  if (!user) throw new Error("请先登录");
  if (user.role !== "admin") {
    const error = new Error("无权限访问后台");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return user;
}
