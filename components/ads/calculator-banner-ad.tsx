import { View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

import { useAds } from "@/lib/ads-provider";

const PRODUCTION_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID;
// 本番の広告ユニットIDが未設定でも（開発中・レビュー中など）クラッシュせず、
// Googleのテスト広告ユニットIDにフォールバックする。
const BANNER_UNIT_ID = PRODUCTION_BANNER_UNIT_ID || TestIds.BANNER;

/**
 * フリープランのユーザーにのみ表示するバナー広告。Web版・Pro・広告なし解除コード適用時は
 * 何も描画しない。Pro状態・解除コードの復元が終わる（isReady）まで、また同意取得と
 * AdMob SDK初期化が完了する（canRequestAds）までは、広告リクエストを送らないよう描画を待つ。
 */
export function CalculatorBannerAd() {
  const { isAdsPlatformAvailable, isReady, adFree, canRequestAds } = useAds();
  if (!isAdsPlatformAvailable || !isReady || adFree || !canRequestAds) return null;

  return (
    <View style={{ alignItems: "center", marginTop: 4 }}>
      <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.BANNER} />
    </View>
  );
}
