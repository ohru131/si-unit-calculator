import mobileAds, { AdsConsent } from "react-native-google-mobile-ads";

/**
 * iOS/Androidのみ。Web版はads-native-init.web.tsに差し替わり、この実体は読み込まれない。
 * GDPR圏などで同意が必要な場合はフォームを表示し、広告リクエストが許可されるまでSDK初期化自体を行わない。
 * @returns 同意が得られSDK初期化が完了し、実際に広告をリクエストしてよい状態になったか。
 */
export async function initializeMobileAds(): Promise<boolean> {
  const consentInfo = await AdsConsent.gatherConsent();
  if (!consentInfo.canRequestAds) return false;
  await mobileAds().initialize();
  return true;
}
