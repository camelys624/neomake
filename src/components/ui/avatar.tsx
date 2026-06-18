import * as React from "react";
export function Avatar(props: React.HTMLAttributes<HTMLDivElement>) { return <div className="grid size-10 place-items-center rounded-full bg-stone-950 text-sm font-bold text-white shadow-sm" {...props} />; }
export function AvatarFallback(props: React.HTMLAttributes<HTMLSpanElement>) { return <span {...props} />; }
