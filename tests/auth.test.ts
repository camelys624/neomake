import { describe, expect, it, beforeEach, vi } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { loginWithCode, sendCode } from "../src/server/auth";
import { resetStore, state } from "../src/server/dataStore";

describe("auth", () => {
  beforeEach(() => resetStore());
  it("hashes and verifies passwords", async () => {
    const encoded = await hashPassword("admin123456");
    expect(encoded.startsWith("pbkdf2_sha256$100000$")).toBe(true);
    expect(await verifyPassword("admin123456", encoded)).toBe(true);
    expect(await verifyPassword("wrong", encoded)).toBe(false);
  });
  it("000000 creates and logs in a user while wrong code fails", async () => {
    sendCode("16600000000", false);
    await expect(loginWithCode("16600000000", "111111")).rejects.toThrow("验证码错误或已过期");
    const result = await loginWithCode("16600000000", "000000");
    expect(result.user.phone).toBe("16600000000");
    expect(state.users).toHaveLength(1);
  });

  it("falls back when subtle crypto is unavailable", async () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", { value: { ...originalCrypto, subtle: undefined }, configurable: true });
    try {
      const encoded = await hashPassword("user123456");
      expect(encoded.startsWith("fallback_sha256$100000$")).toBe(true);
      expect(await verifyPassword("user123456", encoded)).toBe(true);
      const session = await loginWithCode("16600000000", "000000").catch(() => null);
      expect(session).toBeNull();
      sendCode("16600000000", false);
      const result = await loginWithCode("16600000000", "000000");
      expect(result.user.phone).toBe("16600000000");
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: originalCrypto, configurable: true });
      vi.restoreAllMocks();
    }
  });
});
