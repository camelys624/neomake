import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SelectRoot = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn("flex min-h-11 w-full items-center justify-between rounded-2xl border border-stone-300 bg-white/90 px-3.5 py-2.5 text-sm text-stone-950 outline-none transition duration-200 hover:border-stone-400 focus:border-stone-950 focus:ring-4 focus:ring-stone-950/10 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500", className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 opacity-70" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content ref={ref} position={position} className={cn("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-950 shadow-[0_16px_50px_rgba(28,25,23,0.14)]", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className)} {...props}>
      <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
        <ChevronUp className="size-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
        <ChevronDown className="size-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item ref={ref} className={cn("relative flex w-full cursor-default select-none items-center rounded-xl py-2 pl-8 pr-2 text-sm outline-none focus:bg-stone-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props}>
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

type CompatSelectProps = {
  className?: string;
  children?: React.ReactNode;
  value?: string | number;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

function isOptionElement(node: React.ReactNode): node is React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>> {
  return React.isValidElement(node) && node.type === "option";
}

export function Select({ className, children, value, onChange, disabled, placeholder }: CompatSelectProps) {
  const items = React.Children.toArray(children).filter(isOptionElement);
  const selectedValue = value === undefined || value === null ? undefined : String(value);

  return (
    <SelectRoot
      value={selectedValue}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (!onChange) return;
        const event = { target: { value: nextValue } } as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }}
    >
      <SelectTrigger className={className} value={selectedValue}>
        <SelectValue placeholder={placeholder ?? "请选择"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item, index) => (
            <SelectItem key={`${String(item.props.value ?? item.props.children)}-${index}`} value={String(item.props.value ?? "")}>
              {item.props.children}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
  );
}

export { SelectContent, SelectGroup, SelectItem, SelectRoot, SelectTrigger, SelectValue };
