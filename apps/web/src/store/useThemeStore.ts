import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(isDark: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const savedTheme =
    (typeof localStorage !== 'undefined'
      ? (localStorage.getItem('aica_theme') as Theme)
      : null) || 'system';

  const initialIsDark =
    savedTheme === 'dark' || (savedTheme === 'system' && getSystemTheme());

  // Apply immediately on store creation
  applyTheme(initialIsDark);

  // Setup system listener
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      const currentTheme = get().theme;
      if (currentTheme === 'system') {
        const isDark = e.matches;
        applyTheme(isDark);
        set({ isDark });
      }
    });
  }

  return {
    theme: savedTheme,
    isDark: initialIsDark,

    setTheme: (theme: Theme) => {
      localStorage.setItem('aica_theme', theme);
      const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme());
      applyTheme(isDark);
      set({ theme, isDark });
    },

    toggleTheme: () => {
      const currentIsDark = get().isDark;
      const nextTheme = currentIsDark ? 'light' : 'dark';
      localStorage.setItem('aica_theme', nextTheme);
      applyTheme(!currentIsDark);
      set({ theme: nextTheme, isDark: !currentIsDark });
    }
  };
});
