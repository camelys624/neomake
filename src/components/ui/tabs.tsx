import * as React from "react";
export function Tabs(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} />; }
export function TabsList(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="flex flex-wrap gap-2 rounded-2xl bg-stone-100 p-1" {...props} />; }
export function TabsTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <button className="min-h-10 cursor-pointer rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-white hover:text-stone-950" {...props} />; }
export function TabsContent(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="mt-4" {...props} />; }
