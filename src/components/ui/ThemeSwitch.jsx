import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ThemeSwitch = ({ className, theme, onThemeChange }) => {
  return (
    <Tabs
      value={theme}
      onValueChange={onThemeChange}
      className={cn("w-full max-w-[8rem]", className)}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="light" className="flex items-center gap-1">
          <Sun className="w-4 h-4" /> Light
        </TabsTrigger>
        <TabsTrigger value="dark" className="flex items-center gap-1">
          <Moon className="w-4 h-4" /> Dark
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export { ThemeSwitch };
