import * as React from "react";
import { cn } from "@/lib/utils";
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn("min-h-32 w-full rounded-2xl border border-stone-300 bg-white/90 px-3.5 py-2.5 text-sm text-stone-950 outline-none transition duration-200 placeholder:text-stone-400 hover:border-stone-400 focus:border-stone-950 focus:ring-4 focus:ring-stone-950/10 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500", className)} {...props} />; }
