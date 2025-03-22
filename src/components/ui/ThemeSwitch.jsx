import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemeSwitch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-800 data-[state=unchecked]:bg-zinc-300",
      className
    )}
    checked={checked}
    onCheckedChange={onCheckedChange}
    ref={ref}
    {...props}
  >
    {/* Switch Thumb (Contains Icons) */}
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0"
      )}
    >
      {/* Sun Icon (Shown in Light Mode) */}
      <Sun className="w-4 h-4 text-black data-[state=checked]:hidden" />

      {/* Moon Icon (Shown in Dark Mode) */}
      <Moon className="w-4 h-4 text-white hidden data-[state=checked]:block" />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));

ThemeSwitch.displayName = "ThemeSwitch";

export { ThemeSwitch };
