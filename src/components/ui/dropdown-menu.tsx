import * as React from "react";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenu components must be used inside DropdownMenu");
  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <DropdownMenuContext.Provider value={{ open, setOpen }}><div className="relative inline-block">{children}</div></DropdownMenuContext.Provider>;
}

export function DropdownMenuTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useDropdownMenu();
  return <button {...props} aria-expanded={open} className="inline-grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-full transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-stone-950" onClick={(event) => { props.onClick?.(event); if (!event.defaultPrevented) setOpen((value) => !value); }} />;
}

export function DropdownMenuContent(props: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useDropdownMenu();
  if (!open) return null;
  return <div className="absolute right-0 z-20 mt-3 min-w-48 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-[0_18px_50px_rgba(28,25,23,0.14)] backdrop-blur" {...props} />;
}

export function DropdownMenuItem(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDropdownMenu();
  return <button {...props} className="block min-h-11 w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950" onClick={(event) => { props.onClick?.(event); if (!event.defaultPrevented) setOpen(false); }} />;
}
