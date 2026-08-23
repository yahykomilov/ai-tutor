/**
 * Design System — Socratic AI Learning App (мобильный)
 * Палитра и типографика из ТЗ финала. 8px spacing system.
 */
export const C = {
  primary: "#C98B72",
  primaryHover: "#B87960",
  primaryLight: "#F5E4DC",
  bg: "#FAF8F7",
  card: "#FFFFFF",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  border: "#ECECEC",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

/** Типографика Inter: H1 32/700, H2 24/700, H3 20/600, Body 16/400, Small 14/400, Caption 12/400 */
export const T = {
  h1: { fontSize: 32, fontWeight: "700" as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "700" as const, lineHeight: 31 },
  h3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 27 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  small: { fontSize: 14, fontWeight: "400" as const, lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 17 },
};

/** 8px spacing system */
export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = { card: 16, btn: 14, chip: 999 } as const;

/** Шрифтовые семейства после загрузки useFonts (см. App.tsx) */
export const FONT = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semi: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;
