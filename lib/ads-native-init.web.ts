// react-native-google-mobile-adsはネイティブ専用モジュールで、静的インポートするだけで
// Web向けバンドルが壊れるため、Web版ではこの空実装に差し替える。
export async function initializeMobileAds(): Promise<boolean> {
  return false;
}
