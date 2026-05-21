/**
 * Theme Colors Utility
 * Provides theme-aware color classes for consistent styling
 */

export const themeColors = {
  light: {
    bg: {
      primary: 'bg-im5-surface',
      secondary: 'bg-im5-subtle',
      tertiary: 'bg-im5-inset',
      card: 'bg-im5-surface',
      hover: 'hover:bg-im5-hover',
      input: 'bg-im5-surface',
    },
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-500',
      inverse: 'text-white',
    },
    border: {
      primary: 'border-im5-border',
      secondary: 'border-im5-border-soft',
      hover: 'hover:border-im5-border',
    },
    gradient: {
      primary: 'from-im5-subtle via-im5-surface to-im5-subtle',
      success: 'from-green-100 to-green-50',
      warning: 'from-yellow-100 to-yellow-50',
      error: 'from-red-100 to-red-50',
      purple: 'from-purple-100 to-purple-50',
    },
    shadow: 'shadow-sm',
  },
  dark: {
    bg: {
      primary: 'bg-slate-900',
      secondary: 'bg-slate-800',
      tertiary: 'bg-slate-700',
      card: 'bg-gradient-to-br from-slate-800 to-slate-700',
      hover: 'hover:bg-slate-700/50',
      input: 'bg-slate-700/50',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-400',
      inverse: 'text-slate-900',
    },
    border: {
      primary: 'border-slate-700',
      secondary: 'border-slate-600',
      hover: 'hover:border-slate-600',
    },
    gradient: {
      primary: 'from-purple-900 via-violet-900 to-indigo-900',
      success: 'from-green-500 to-emerald-500',
      warning: 'from-yellow-500 to-orange-500',
      error: 'from-red-500 to-pink-500',
      purple: 'from-purple-500 to-pink-500',
    },
    shadow: 'shadow-lg shadow-blue-500/10',
  },
};

export const getThemeClasses = (isDark) => {
  return isDark ? themeColors.dark : themeColors.light;
};

export const getDynamicBg = (isDark) =>
  isDark ? 'bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900' : 'bg-im5-page';

export const getDynamicCardBg = (isDark) =>
  isDark
    ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 hover:border-slate-600'
    : 'bg-im5-surface border border-im5-border hover:border-im5-border-soft';

export const getDynamicInput = (isDark) =>
  isDark
    ? 'bg-slate-700/50 border border-slate-600 text-white focus:border-blue-500'
    : 'bg-im5-surface border border-im5-border text-gray-900 focus:border-blue-500';
