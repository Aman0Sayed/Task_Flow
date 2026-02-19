import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAppSelector } from '../hooks/hook';

type Theme = 'light' | 'dark' | 'system';
type Color = 'Blue' | 'Purple' | 'Green' | 'Red' | 'Orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  color: Color;
  setColor: (color: Color) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id || 'guest';

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(`theme-${userId}`) as Theme;
    return savedTheme || 'system';
  });

  const [color, setColor] = useState<Color>(() => {
    const savedColor = localStorage.getItem(`color-${userId}`) as Color;
    return savedColor || 'Blue';
  });

  // Update theme when user changes
  useEffect(() => {
    const savedTheme = localStorage.getItem(`theme-${userId}`) as Theme;
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
    const savedColor = localStorage.getItem(`color-${userId}`) as Color;
    if (savedColor && savedColor !== color) {
      setColor(savedColor);
    }
  }, [userId]);

  // Apply color
  useEffect(() => {
    const root = window.document.documentElement;
    const colorMap = {
      Blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554' },
      Purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7c3aed', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
      Green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16' },
      Red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a' },
      Orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407' },
    };
    const colors = colorMap[color];
    Object.entries(colors).forEach(([shade, hex]) => {
      root.style.setProperty(`--primary-${shade}`, hex);
    });
    localStorage.setItem(`color-${userId}`, color);
  }, [color, userId]);

  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
      return;
    }

    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(`theme-${userId}`, theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = { theme, setTheme, color, setColor };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};