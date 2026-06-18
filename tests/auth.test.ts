import { describe, expect, it, beforeEach } from "vitest";
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
});
