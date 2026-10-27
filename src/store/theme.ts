import { useEffect } from 'react';
import { create } from 'zustand';
import { useApp } from './app';

/** The theme actually applied (system preference resolved). Charts read this to re-resolve token colors. */
export const useResolvedTheme = create<{ t: 'light' | 'dark'; p: string }>(() => ({ t: 'light', p: 'indigo' }));

export function useThemeSync() {
  const pref = useApp((s) => s.data.theme);
  const palette = useApp((s) => s.data.palette) || 'indigo';
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const t = pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
      const root = document.documentElement;
      root.setAttribute('data-theme', t);
      root.setAttribute('data-palette', palette);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
      useResolvedTheme.setState({ t, p: palette });
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref, palette]);
}

/** Reads the current values of CSS color tokens (Recharts needs real colors, not var()). */
export function useTokens<K extends string>(names: readonly K[]): Record<K, string> {
  useResolvedTheme((s) => s.t + s.p); // re-render on theme or palette change
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(`--${n}`).trim()])) as Record<K, string>;
}
