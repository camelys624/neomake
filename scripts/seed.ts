import { hashPassword } from "../src/lib/password";
import { createUser, findUserByPhone, state } from "../src/server/dataStore";

async function upsert(phone: string, password: string, role: "admin" | "user") {
  const existing = findUserByPhone(phone);
  if (existing) {
    existing.passwordHash = existing.passwordHash ?? await hashPassword(password);
    existing.role = role;
    return existing;
  }
  return createUser({ phone, passwordHash: await hashPassword(password), role });
}

await upsert("18800000000", "admin123456", "admin");
await upsert("16600000000", "user123456", "user");
console.log(`Seeded ${state.users.length} users: 18800000000(admin), 16600000000(user).`);
