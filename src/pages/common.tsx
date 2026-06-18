import * as React from "react";
import { AppHeader } from "@/components/site/AppHeader";
import { SupportWidget } from "@/components/site/SupportWidget";
import { Badge } from "@/components/ui/badge";
import { newId, nowIso } from "@/server/dataStore";
import type { UploadedAsset } from "@/lib/types";

export function asset(name: string, mimeType = "image/png"): UploadedAsset {
  return { id: newId("ast"), userId: "demo", name, mimeType, dataUrl: "data:image/png;base64,iVBORw0KGgo=", createdAt: nowIso() };
}

export function requireUser(userId?: string) {
  if (!userId) throw new Error("请先登录");
  return userId;
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main-content" className="mx-auto min-h-[calc(100dvh-4.75rem)] max-w-[1360px] px-6 py-12 sm:px-8 lg:px-10 lg:py-16">
        {children}
      </main>
      <SupportWidget />
    </>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-6 max-w-3xl space-y-3"><Badge>{eyebrow}</Badge><h1 className="text-3xl font-black tracking-[-0.04em] text-stone-950 sm:text-4xl">{title}</h1><p className="text-base leading-7 text-stone-600 sm:text-lg">{description}</p></div>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-stone-500">{children}</p>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="text-sm font-semibold text-stone-700">{label}</span>{children}</label>;
}
