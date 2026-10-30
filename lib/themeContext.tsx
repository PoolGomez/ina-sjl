'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextType = {
  theme: ResolvedTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveThemeMode(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    root.setAttribute('data-theme', 'dark');
    root.setAttribute('data-color-scheme', 'dark');
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-color-scheme', 'light');
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState<ResolvedTheme>('light');

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode | 'auto' | null;
    const legacySaved = localStorage.getItem('theme') as ResolvedTheme | null;
    const normalizedMode: ThemeMode =
      savedMode === 'auto'
        ? 'system'
        : savedMode === 'light' || savedMode === 'dark' || savedMode === 'system'
        ? savedMode
        : legacySaved === 'dark' || legacySaved === 'light'
        ? legacySaved
        : 'light';

    const resolved = resolveThemeMode(normalizedMode);
    setThemeModeState(normalizedMode);
    setTheme(resolved);
    applyThemeToDOM(resolved);
  }, []);

  // Listen to OS color scheme changes when in 'system' mode
  useEffect(() => {
    const resolved = resolveThemeMode(themeMode);
    setTheme(resolved);
    applyThemeToDOM(resolved);

    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const nextResolved: ResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
      setTheme(nextResolved);
      applyThemeToDOM(nextResolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    const resolved = resolveThemeMode(mode);
    setThemeModeState(mode);
    setTheme(resolved);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', mode);
      localStorage.setItem('theme', resolved);
    }
    applyThemeToDOM(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  }, [theme, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{ theme, themeMode, setThemeMode, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
