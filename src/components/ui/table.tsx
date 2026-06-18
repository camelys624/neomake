import * as React from "react";
export function Table(props: React.TableHTMLAttributes<HTMLTableElement>) { return <table className="w-full border-separate border-spacing-0 text-sm" {...props} />; }
export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <thead className="text-left text-xs font-bold uppercase tracking-[0.12em] text-stone-500" {...props} />; }
export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <tbody className="divide-y divide-stone-200" {...props} />; }
export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) { return <tr className="transition hover:bg-stone-50" {...props} />; }
export function TH(props: React.ThHTMLAttributes<HTMLTableCellElement>) { return <th className="px-3 py-3" {...props} />; }
export function TD(props: React.TdHTMLAttributes<HTMLTableCellElement>) { return <td className="px-3 py-3 text-stone-700" {...props} />; }
