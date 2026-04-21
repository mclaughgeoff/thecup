/**
 * Year theme — the app reskins each year with a new name, logo, and tagline.
 * Core app stays the same; swap this object to rebrand for 2027+.
 *
 * Palette lives in tailwind.config.ts (the `masters` + `format` tokens), so
 * if you want to retheme colors too, update both places.
 */

export interface YearTheme {
  /** Short brand name shown in the header, e.g. "SeaPines Cup". */
  name: string;
  /** Trip year. */
  year: number;
  /** Human-friendly title combining name + year, e.g. "SeaPines Cup 2026". */
  title: string;
  /** Short tagline / description shown in metadata + PWA manifest. */
  tagline: string;
  /** Absolute path to the logo SVG (served from /public). */
  logo: string;
  /** Absolute path to a PNG favicon, used in layout metadata. */
  favicon: string;
  /** Apple touch icon (PNG, 180×180). */
  appleTouchIcon: string;
  /** PWA theme color (browser chrome / standalone status bar). */
  themeColor: string;
  /** Location label used in subtitles / metadata, e.g. "Sea Pines · Hilton Head". */
  location: string;
}

export const theme: YearTheme = {
  name: 'SeaPines Cup',
  year: 2026,
  title: 'SeaPines Cup 2026',
  tagline: 'Annual 16-player Ryder Cup golf trip · Sea Pines, Hilton Head',
  logo: '/lighthouse.svg',
  favicon: '/favicon.ico',
  appleTouchIcon: '/apple-touch-icon.png',
  themeColor: '#006747',
  location: 'Sea Pines · Hilton Head',
};
