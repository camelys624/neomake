import * as React from "react";
export function Dialog({ open, children }: { open: boolean; children: React.ReactNode }) { return open ? <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/55 p-4 backdrop-blur-sm">{children}</div> : null; }
export function DialogContent(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(28,25,23,0.22)]" {...props} />; }
export function DialogHeader(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="mb-5 space-y-1" {...props} />; }
export function DialogTitle(props: React.HTMLAttributes<HTMLHeadingElement>) { return <h2 className="text-2xl font-black tracking-[-0.03em] text-stone-950" {...props} />; }
