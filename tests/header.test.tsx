import { describe, expect, it, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { render, fireEvent } from "@testing-library/react";
import { AuthProvider } from "../src/appState";
import { AppHeader } from "../src/components/site/AppHeader";
import type { SafeUser } from "../src/lib/types";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  localStorage: dom.window.localStorage,
  location: dom.window.location,
  HTMLElement: dom.window.HTMLElement,
});

function renderHeader(user: SafeUser | null = null, url = "http://localhost/") {
  window.history.pushState({}, "", url);
  localStorage.clear();
  if (user) localStorage.setItem("sfa_user", JSON.stringify(user));
  return render(<AuthProvider><AppHeader /></AuthProvider>);
}

describe("AppHeader", () => {
  beforeEach(() => localStorage.clear());
  it("shows 登录 and 充值 when unauthenticated", () => {
    const view = renderHeader();
    expect(view.getByText("登录")).toBeTruthy();
    expect(view.getByText("充值")).toBeTruthy();
  });
  it("opens avatar menu entries when authenticated", () => {
    const view = renderHeader({ id: "usr_1", phone: "16600000000", displayName: "用户", avatarUrl: null, role: "user", balanceCents: 0, createdAt: "now", updatedAt: "now" });
    expect(view.queryByText("用户信息")).toBeNull();
    fireEvent.click(view.getByLabelText("用户菜单"));
    expect(view.getByText("用户信息")).toBeTruthy();
    expect(view.getByText("订单记录")).toBeTruthy();
    expect(view.getAllByText("充值").length).toBeGreaterThan(0);
    expect(view.getByText("退出登录")).toBeTruthy();
  });
  it("hides public navigation and recharge on admin pages", () => {
    const view = renderHeader(null, "http://localhost/admin");
    expect(view.getByText("ShoeForge AI mgmt.")).toBeTruthy();
    expect(view.queryByText("AI 工作台")).toBeNull();
    expect(view.queryByText("颜料采购")).toBeNull();
    expect(view.queryByText("充值")).toBeNull();
  });
});
