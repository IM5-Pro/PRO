
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

// Color definitions for each theme
const themeColors = {
  dark: {
    bg: {
      primary: 'bg-slate-900',
      secondary: 'bg-slate-800',
      tertiary: 'bg-slate-700',
      overlay: 'bg-black/50',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-400',
      muted: 'text-slate-500',
    },
    border: {
      primary: 'border-slate-700',
      secondary: 'border-slate-600',
      light: 'border-slate-700/50',
    },
    gradient: {
      primary: 'from-slate-900 via-slate-800 to-slate-900',
      card: 'from-slate-800 to-slate-700',
      accent: 'from-blue-600 to-purple-600',
    },
    shadow: 'shadow-blue-500/10',
  },
  light: {
    bg: {
      primary: 'bg-im5-canvas',
      secondary: 'bg-im5-surface',
      tertiary: 'bg-im5-subtle',
      overlay: 'bg-black/30',
    },
    text: {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      tertiary: 'text-slate-600',
      muted: 'text-slate-500',
    },
    border: {
      primary: 'border-im5-border',
      secondary: 'border-im5-border-soft',
      light: 'border-im5-border-soft',
    },
    gradient: {
      primary: 'from-im5-subtle via-im5-surface to-im5-subtle',
      card: 'from-im5-surface to-im5-subtle',
      accent: 'from-blue-500 to-indigo-500',
    },
    shadow: 'shadow-blue-500/5',
  },
};

export const ThemeProvider = ({ children }) => {
  // Always use light theme
  const resolvedTheme = 'light';
  const isDark = false;

  const colors = themeColors[resolvedTheme];

  return (
    <ThemeContext.Provider value={{ resolvedTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

