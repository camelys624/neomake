import * as React from "react";
import { cn } from "@/lib/utils";
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) { return <span className={cn("inline-flex items-center rounded-full border border-amber-700/20 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-800", className)} {...props} />; }
