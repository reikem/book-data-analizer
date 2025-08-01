import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system" | "dracula";

type ThemeContextValue = {
  theme: Theme;                 
  setTheme: (t: Theme) => void; 
  resolved: "light" | "dark" | "dracula"; 
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolved: "light",
});

const STORAGE_KEY = "theme";

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      return saved ?? defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [resolved, setResolved] = useState<"light" | "dark" | "dracula">("light");

  useEffect(() => {
    const root = document.documentElement;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (t: Theme) => {
     
      const r = t === "system" ? (mql.matches ? "dark" : "light") : (t === "dracula" ? "dracula" : t);

    
      root.classList.remove("light", "dark", "dracula");
      root.classList.add(r);

      root.setAttribute("data-theme", r);
      setResolved(r);
    };

    apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}

    const onChange = () => {
      if (theme === "system") apply("system");
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (t: Theme) => setThemeState(t),
      resolved,
    }),
    [theme, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);


export const useIsMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
};
