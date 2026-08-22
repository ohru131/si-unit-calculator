export const themeColors: {
  primary: { light: string; dark: string };
  primaryFill: { light: string; dark: string };
  primaryStrong: { light: string; dark: string };
  primarySurface: { light: string; dark: string };
  primaryBorder: { light: string; dark: string };
  background: { light: string; dark: string };
  surface: { light: string; dark: string };
  surfaceSecondary: { light: string; dark: string };
  foreground: { light: string; dark: string };
  muted: { light: string; dark: string };
  placeholder: { light: string; dark: string };
  border: { light: string; dark: string };
  success: { light: string; dark: string };
  successSurface: { light: string; dark: string };
  successBorder: { light: string; dark: string };
  warning: { light: string; dark: string };
  warningSurface: { light: string; dark: string };
  warningBorder: { light: string; dark: string };
  error: { light: string; dark: string };
  errorSurface: { light: string; dark: string };
  errorBorder: { light: string; dark: string };
  onPrimary: { light: string; dark: string };
  overlay: { light: string; dark: string };
};

declare const themeConfig: {
  themeColors: typeof themeColors;
};

export default themeConfig;
