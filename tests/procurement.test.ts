import { beforeEach, describe, expect, it } from "vitest";
import { createUser, resetStore, state } from "../src/server/dataStore";
import { createPaintOrder } from "../src/server/procurement";

describe("procurement", () => {
  beforeEach(() => resetStore());
  it("creates a submitted 宝蓝 100g quantity 2 order", () => {
    const user = createUser({ phone: "16600000000" });
    const order = createPaintOrder(user.id, [{ colorName: "宝蓝", colorHex: "#2563eb", weightGrams: 100, quantity: 2 }]);
    expect(order.status).toBe("submitted");
    expect(state.paintOrders).toHaveLength(1);
    expect(state.paintOrderItems[0]).toMatchObject({ orderId: order.id, colorName: "宝蓝", weightGrams: 100, quantity: 2 });
  });
});
