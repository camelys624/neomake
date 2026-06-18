import { describe, expect, it, beforeEach, vi } from "vitest";
import { JSDOM } from "jsdom";
import { cleanup, render, fireEvent, waitFor } from "@testing-library/react";
import type { SafeUser } from "../src/lib/types";
import { AuthProvider } from "../src/appState";
import { App } from "../src/App";
import * as workbench from "../src/server/workbench";
import type { SubmitGenerationResult } from "../src/server/workbench";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/workspace" });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  localStorage: dom.window.localStorage,
  location: dom.window.location,
  HTMLElement: dom.window.HTMLElement,
  File: dom.window.File,
  FileReader: dom.window.FileReader,
});

function renderWorkspace(user?: SafeUser) {
  window.history.pushState({}, "", "http://localhost/workspace");
  localStorage.clear();
  if (user) localStorage.setItem("sfa_user", JSON.stringify(user));
  return render(<AuthProvider><App /></AuthProvider>);
}

function makeUser(): SafeUser {
  const now = new Date().toISOString();
  return { id: "usr_test", phone: "18800000001", displayName: "测试用户", avatarUrl: null, role: "user", balanceCents: 0, createdAt: now, updatedAt: now };
}

describe("Workspace uploads", () => {
  beforeEach(() => { cleanup(); localStorage.clear(); });

  it("removes the duplicate left history icon while keeping the prompt history button", () => {
    const view = renderWorkspace();
    expect(view.queryByLabelText("查看历史")).toBeNull();
    expect(view.getByRole("button", { name: "历史" })).toBeTruthy();
  });

  it("renders four square upload inputs for four-view mode", () => {
    const view = renderWorkspace();
    expect(view.container.querySelectorAll('input[type="file"]').length).toBe(4);
    expect(view.getAllByText("正面").length).toBeGreaterThan(0);
    expect(view.getAllByText("侧面").length).toBeGreaterThan(0);
    expect(view.getAllByText("背面").length).toBeGreaterThan(0);
    expect(view.getAllByText("俯视").length).toBeGreaterThan(0);
  });

  it("shows image2 controls before the history button and clamps count to eight", async () => {
    const view = renderWorkspace();
    const model = view.getByRole("combobox", { name: "模型" }) as unknown as HTMLSelectElement;
    const count = view.getByRole("spinbutton", { name: "出图数量" }) as unknown as HTMLInputElement;

    expect(model.value).toBe("image2-1k");
    expect(count.value).toBe("2");

    fireEvent.input(count, { target: { value: "12" } });
    await waitFor(() => expect(count.value).toBe("8"));
    expect(view.getByRole("button", { name: "历史" })).toBeTruthy();
  });

  it("keeps the conversation area focused on results and the prompt", () => {
    const view = renderWorkspace();

    expect(view.queryByText("生成对话")).toBeNull();
    expect(view.queryByText("结果在中间，输入在底部。")).toBeNull();
    expect(view.queryByText("系统消息")).toBeNull();
    expect(view.queryByText("上传后生成。")).toBeNull();
    expect(view.queryByText("当前输入")).toBeNull();
    expect(view.queryByText("状态")).toBeNull();
    expect(view.getByPlaceholderText("描述你想调整的颜色、材质、图案、鞋带、鞋底或展示角度...")).toBeTruthy();
    expect(view.getByRole("button", { name: "生成" })).toBeTruthy();
  });

  it("shows an in-slot preview after uploading an image", async () => {
    const view = renderWorkspace();
    const file = new File(["fake-png"], "front.png", { type: "image/png" });
    const inputs = view.container.querySelectorAll('input[type="file"]');

    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => expect(view.getByAltText("正面预览")).toBeTruthy());
    expect(view.getAllByText("front.png").length).toBeGreaterThan(0);
  });

  it("inserts detailed prompt content when clicking quick setting tags", () => {
    const view = renderWorkspace();
    const textarea = view.getByPlaceholderText("描述你想调整的颜色、材质、图案、鞋带、鞋底或展示角度...") as unknown as HTMLTextAreaElement;

    fireEvent.click(view.getByRole("button", { name: "极简" }));

    expect(textarea.value).toBe("极简风格，干净留白，单一主色，弱化装饰，突出鞋型轮廓");
  });

  it("shows one loading skeleton per requested output image while generating", async () => {
    let resolveSubmit: ((value: SubmitGenerationResult) => void) | undefined;
    const submitSpy = vi.spyOn(workbench, "submitGeneration").mockImplementation(() => new Promise((resolve) => { resolveSubmit = resolve; }));

    const view = renderWorkspace(makeUser());
    const file = new File(["fake-png"], "front.png", { type: "image/png" });
    const count = view.getByRole("spinbutton", { name: "出图数量" }) as unknown as HTMLInputElement;

    fireEvent.input(count, { target: { value: "3" } });

    const inputs = view.container.querySelectorAll('input[type="file"]');
    for (const input of inputs) fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(view.getByAltText("正面预览")).toBeTruthy());
    fireEvent.click(view.getByRole("button", { name: "生成" }));

    await waitFor(() => expect(view.container.querySelectorAll('[data-testid="generation-skeleton"]').length).toBe(3));

    if (!resolveSubmit) throw new Error("submitGeneration was not invoked");
    resolveSubmit({
      job: {
        id: "gen_1",
        userId: "usr_test",
        mode: "blank_shoe_style_transfer",
        prompt: "",
        sourceAssetIdsJson: "[]",
        resultImageUrlsJson: JSON.stringify(["https://example.com/1.png", "https://example.com/2.png", "https://example.com/3.png"]),
        status: "succeeded",
        errorMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      images: [
        { url: "https://example.com/1.png", alt: "AI 鞋履效果图 1" },
        { url: "https://example.com/2.png", alt: "AI 鞋履效果图 2" },
        { url: "https://example.com/3.png", alt: "AI 鞋履效果图 3" },
      ],
    });

    await waitFor(() => expect(view.queryByAltText("结果 1")).toBeTruthy());
    submitSpy.mockRestore();
  });
});
