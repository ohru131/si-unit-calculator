import mobileAds from "react-native-google-mobile-ads";

/** iOS/Androidのみ。Web版はads-native-init.web.tsに差し替わり、この実体は読み込まれない。 */
export async function initializeMobileAds() {
  await mobileAds().initialize();
}
