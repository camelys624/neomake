import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenu components must be used inside DropdownMenu");
  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
        {children}
      </DropdownMenuPrimitive.Root>
    </DropdownMenuContext.Provider>
  );
}

export const DropdownMenuTrigger = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenuContext();
  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      className={cn("inline-grid min-h-11 min-w-11 place-items-center rounded-full transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-stone-950", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen((value) => !value);
      }}
      {...props}
    />
  );
});
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

export const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(({ className, sideOffset = 12, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn("z-50 min-w-48 rounded-2xl border border-stone-200 bg-white/95 p-2 text-stone-950 shadow-[0_18px_50px_rgba(28,25,23,0.14)] backdrop-blur", className)} {...props} />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Item>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenuContext();
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn("relative flex min-h-11 cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-medium text-stone-700 outline-none transition hover:bg-stone-100 hover:text-stone-950 focus:bg-stone-100 focus:text-stone-950 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
