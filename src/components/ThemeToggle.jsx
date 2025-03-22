import { useEffect, useState } from "react";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return <ThemeSwitch checked={isDark} onCheckedChange={setIsDark} />;
};

export default ThemeToggle;
