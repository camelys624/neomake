import { beforeEach, describe, expect, it } from "vitest";
import { createUser, resetStore, state } from "../src/server/dataStore";
import { createRechargeOrder, markRechargePaid } from "../src/server/recharge";

describe("recharge", () => {
  beforeEach(() => resetStore());
  it("credits balance once and rejects a second paid transition", () => {
    const user = createUser({ phone: "16600000000" });
    const order = createRechargeOrder({ userId: user.id, provider: "alipay", amountCents: 9900 });
    markRechargePaid(order.id);
    expect(state.users[0].balanceCents).toBe(9900);
    expect(() => markRechargePaid(order.id)).toThrow("订单已支付");
    expect(state.users[0].balanceCents).toBe(9900);
  });
});
