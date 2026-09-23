import { memo, useCallback, useRef } from "react";
import { View } from "react-native";
import type { PaidEvent } from "react-native-google-mobile-ads";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

import {
  createBannerImpressionId,
  trackBannerDisplayed,
  trackBannerFailedToLoad,
  trackBannerLoaded,
  trackBannerOpened,
  trackBannerRevenue,
} from "@/lib/ad-revenue-tracker";
import { useAds } from "@/lib/ads-provider";

const PRODUCTION_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID;
// 本番の広告ユニットIDが未設定でも（開発中・レビュー中など）クラッシュせず、
// Googleのテスト広告ユニットIDにフォールバックする。
const BANNER_UNIT_ID = PRODUCTION_BANNER_UNIT_ID || TestIds.BANNER;

/**
 * `BannerAdSize.BANNER` の高さ（320×50）。**電卓のレイアウト段階の判定に渡す**ので、
 * 実際に描く高さと同じ値を1箇所で持つ（`lib/calculator-layout.ts` の `bannerHeight`）。
 * ここを `View` の `minHeight` としても使い、**広告の読み込みが終わった瞬間に画面が
 * 50dp跳ねる**のを防ぐ（跳ねると段階の選択が後から変わってキーの高さまで変わる）。
 */
export const CALCULATOR_BANNER_HEIGHT = 50;

/**
 * フリープランのユーザーにのみ表示するバナー広告。Web版・Pro利用時は
 * 何も描画しない。Pro状態の復元が終わる（isReady）まで、また同意取得と
 * AdMob SDK初期化が完了する（canRequestAds）までは、広告リクエストを送らないよう描画を待つ。
 * 広告イベントはRevenueCat Ads（β）へも転送し、サブスク収益と広告収益をダッシュボード上で
 * まとめて確認できるようにする。
 */
/**
 * **`memo` で包む理由。** この中身は親（電卓画面）の状態に一切依存していないのに、式を1文字
 * 打つたびに親が再レンダーされて一緒に作り直されていた。広告のネイティブビューを持つぶん
 * 1回あたりの費用が大きい（実機のReact Profilerで10.6ms）。propsを取らないので、
 * `memo` を掛ければ親の再レンダーでは呼ばれなくなる（中で見ている `useAds` が変わったときだけ動く）。
 */
export const CalculatorBannerAd = memo(function CalculatorBannerAd() {
  const { isBannerVisible } = useAds();
  // 読み込みが成功するたびに新しいimpressionIdへ更新し、以降のopened/paidイベントに
  // 同じIDを使うことでRevenueCat側が同一インプレッションとして関連付けられるようにする。
  const impressionIdRef = useRef(createBannerImpressionId());

  const handleAdLoaded = useCallback(() => {
    impressionIdRef.current = createBannerImpressionId();
    trackBannerLoaded(BANNER_UNIT_ID, impressionIdRef.current);
  }, []);

  const handleAdImpression = useCallback(() => {
    trackBannerDisplayed(BANNER_UNIT_ID, impressionIdRef.current);
  }, []);

  const handleAdOpened = useCallback(() => {
    trackBannerOpened(BANNER_UNIT_ID, impressionIdRef.current);
  }, []);

  const handleAdFailedToLoad = useCallback(() => {
    trackBannerFailedToLoad(BANNER_UNIT_ID);
  }, []);

  const handlePaid = useCallback((event: PaidEvent) => {
    trackBannerRevenue(BANNER_UNIT_ID, impressionIdRef.current, event);
  }, []);

  if (!isBannerVisible) return null;

  return (
    // 読み込み中でも高さを確保する。確保しないと広告が載った瞬間に下の全部が50dp押し下がり、
    // キーパッドがタブバーへ潜る（レイアウト段階の計算はこの高さを前提にしている）。
    <View style={{ alignItems: "center", minHeight: CALCULATOR_BANNER_HEIGHT }}>
      <BannerAd
        unitId={BANNER_UNIT_ID}
        size={BannerAdSize.BANNER}
        onAdLoaded={handleAdLoaded}
        onAdImpression={handleAdImpression}
        onAdOpened={handleAdOpened}
        onAdFailedToLoad={handleAdFailedToLoad}
        onPaid={handlePaid}
      />
    </View>
  );
});
