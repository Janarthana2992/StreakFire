import type { PaletteId } from './types';

/** Colour themes the user can pick in Settings. Swatch colours are the light-mode gradient. */
export const PALETTES: { id: PaletteId; name: string; a: string; b: string }[] = [
  { id: 'indigo', name: 'Indigo', a: '#8C8DFF', b: '#3B2FC9' },
  { id: 'emerald', name: 'Emerald', a: '#34D399', b: '#065F46' },
  { id: 'ocean', name: 'Ocean', a: '#38BDF8', b: '#0E7490' },
  { id: 'sunset', name: 'Sunset', a: '#FDBA74', b: '#C2410C' },
  { id: 'rose', name: 'Rose', a: '#F9A8D4', b: '#9D174D' },
];
