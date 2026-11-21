/**
 * Brand palette + engraving "tones".
 *
 * Cinematic teal-orange rule:
 *  - TEAL is never a foreground color. It is the shadow / depth layer:
 *    shadow-side cross-hatching, cast shadows, background lines.
 *  - FOREGROUND data is always warm and VIVID (sunset, not autumn leaves):
 *    a sunset sky stacked bottom-to-top: GOLD (headline, densest) -> ORANGE
 *    (ember) / coral -> PURPLE tops (violet).
 *  - Density carries emphasis (ember is the densest). Color is a hint,
 *    never a flat fill.
 */
export const palette = {
  ink: '#1A1A2E',
  inkSoft: '#2A2A3A',
  paper: '#f8f7f2',
  // Warm foregrounds: vivid sunset, not autumn
  ember: '#FF6A1F',
  emberInk: '#C43A00',
  coral: '#FF4D5E',
  coralInk: '#B8142E',
  gold: '#FFB61E',
  goldInk: '#B86E00',
  goldDeep: '#E08600',
  goldDeepInk: '#7A4300',
  money: '#2E9E57',
  moneyInk: '#16603A',
  lossRed: '#F07070',
  lossRedInk: '#B53636',
  /** Brand accent (adopted 2026-11-21): highlights, active states, headline series. */
  violet: '#9B4DDB',
  violetInk: '#5A1E8C',
  accent: '#F06449',
  // Cool shadow / depth
  teal: '#2EB8CC',
  tealWash: '#E3F5FA',
  tealInk: '#3F7E8C',
  muted: '#8A8A9A',
} as const;

/** Shared shadow treatment (cast shadows, shadow-side hatching). */
export const shadow = {
  ink: palette.tealInk,
  wash: palette.teal,
  washOpacity: 0.14,
  inkOpacity: 0.6,
} as const;

export interface HatchLayer {
  angle: number;
  gap: number;
  weight: number;
  color: string;
  opacity: number;
}

export interface Tone {
  /** Watercolor-like wash under the ink, or null for ink only. */
  wash: { color: string; opacity: number } | null;
  /** Main hatch layers over the whole shape, drawn in order. */
  layers: HatchLayer[];
  /** Ink color for shadow-side cross-hatching (teal for depth). */
  shadowColor: string;
  /** Solid accent for lines/underlines that represent this tone. */
  accent: string;
  /** Optional warm glow: a faint wash over the base color plus a narrow rim light. */
  glow?: { color: string; opacity: number; rim: number };
}

const toneDefs = {
  /** Vivid orange: the middle of the sunset. */
  ember: {
    wash: { color: palette.ember, opacity: 0.38 },
    layers: [{ angle: 40, gap: 5, weight: 0.85, color: palette.emberInk, opacity: 0.78 }],
    shadowColor: shadow.ink,
    accent: palette.ember,
  },
  /** Hot coral / sunset pink. */
  coral: {
    wash: { color: palette.coral, opacity: 0.32 },
    layers: [{ angle: 40, gap: 5.5, weight: 0.85, color: palette.coralInk, opacity: 0.75 }],
    shadowColor: shadow.ink,
    accent: palette.coral,
  },
  /** Bright golden yellow, densest: the headline series, the sun at the bottom of the sky. */
  gold: {
    wash: { color: palette.gold, opacity: 0.5 },
    layers: [
      { angle: 48, gap: 3.4, weight: 0.95, color: palette.goldInk, opacity: 0.85 },
      { angle: -42, gap: 5, weight: 0.75, color: palette.emberInk, opacity: 0.45 },
    ],
    shadowColor: shadow.ink,
    accent: '#F0A000',
  },
  /** Golden shaft: lighter single hatch, for a tall middle segment. */
  goldLight: {
    wash: { color: palette.gold, opacity: 0.42 },
    layers: [{ angle: 40, gap: 5.5, weight: 0.85, color: palette.goldInk, opacity: 0.72 }],
    shadowColor: shadow.ink,
    accent: palette.gold,
  },
  /** Darker amber gold, densest: grounds the bottom of a column. */
  goldDeep: {
    wash: { color: palette.goldDeep, opacity: 0.5 },
    layers: [
      { angle: 48, gap: 3.2, weight: 0.95, color: palette.goldDeepInk, opacity: 0.85 },
      { angle: -42, gap: 4.6, weight: 0.8, color: palette.emberInk, opacity: 0.5 },
    ],
    shadowColor: shadow.ink,
    accent: palette.goldDeep,
  },
  /** Darker grey with a gold glow: column base. */
  greyDeep: {
    wash: { color: '#7E7E8E', opacity: 0.3 },
    layers: [
      { angle: 48, gap: 3.6, weight: 0.9, color: '#3E3E4E', opacity: 0.75 },
      { angle: -42, gap: 5.2, weight: 0.75, color: '#5A5A6A', opacity: 0.5 },
    ],
    shadowColor: shadow.ink,
    accent: '#5A5A6A',
    glow: { color: palette.gold, opacity: 0.07, rim: 0.7 },
  },
  /**
   * Ash grey with a gold glow: column base. Mid-light so it never competes with
   * the violet top; told apart from the off-white shaft mainly by its denser
   * cross-hatching.
   */
  ash: {
    wash: { color: '#B8B4AD', opacity: 0.42 },
    layers: [
      { angle: 48, gap: 3.8, weight: 0.85, color: '#6F6A63', opacity: 0.62 },
      { angle: -42, gap: 5.4, weight: 0.75, color: '#8A857D', opacity: 0.5 },
    ],
    shadowColor: shadow.ink,
    accent: '#8A857D',
    glow: { color: palette.gold, opacity: 0.05, rim: 0.65 },
  },
  /** Off-white with a gold glow: tall column shaft. Sparse single hatch, so it reads as paper. */
  offWhite: {
    wash: { color: '#F6F3EC', opacity: 0.85 },
    layers: [{ angle: 40, gap: 7.5, weight: 0.7, color: '#A8A196', opacity: 0.55 }],
    shadowColor: shadow.ink,
    accent: '#C9C2B6',
    glow: { color: palette.gold, opacity: 0.05, rim: 0.65 },
  },
  /** Light grey with a gold glow: column shaft. */
  greyLight: {
    wash: { color: '#C9CBD6', opacity: 0.26 },
    layers: [{ angle: 40, gap: 6.6, weight: 0.75, color: '#8C8C9C', opacity: 0.55 }],
    shadowColor: shadow.ink,
    accent: '#8A8A9A',
    glow: { color: palette.gold, opacity: 0.06, rim: 0.7 },
  },
  /** Money green: income / profit flows (Sankey). */
  money: {
    wash: { color: palette.money, opacity: 0.34 },
    layers: [{ angle: 40, gap: 4.6, weight: 0.85, color: palette.moneyInk, opacity: 0.8 }],
    shadowColor: shadow.ink,
    accent: palette.money,
  },
  /** Light red: cost flows (Sankey). */
  lossRed: {
    wash: { color: palette.lossRed, opacity: 0.3 },
    layers: [{ angle: 40, gap: 6, weight: 0.8, color: palette.lossRedInk, opacity: 0.68 }],
    shadowColor: shadow.ink,
    accent: palette.lossRed,
  },
  /** Dusk purple: the top of the sky. */
  violet: {
    wash: { color: palette.violet, opacity: 0.3 },
    layers: [{ angle: 66, gap: 4.6, weight: 0.85, color: palette.violetInk, opacity: 0.72 }],
    shadowColor: shadow.ink,
    accent: palette.violet,
  },
  /** Plain ink, no color. */
  ink: {
    wash: null,
    layers: [{ angle: 62, gap: 4.4, weight: 0.85, color: palette.ink, opacity: 0.72 }],
    shadowColor: shadow.ink,
    accent: palette.ink,
  },
} satisfies Record<string, Tone>;

export type ToneName = keyof typeof toneDefs;
export const tones: Record<ToneName, Tone> = toneDefs;
