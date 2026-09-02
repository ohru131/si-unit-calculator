import type { PaidEvent } from "react-native-google-mobile-ads";
import { RevenuePrecisions } from "react-native-google-mobile-ads";
import Purchases, { AdFormat, AdMediatorName, AdRevenuePrecision } from "react-native-purchases";

/**
 * RevenueCat Ads（β）へAdMobのバナー広告イベントを転送する。RevenueCatダッシュボードで
 * サブスク収益と広告収益をまとめて確認できるようにするための連携で、広告表示そのものの
 * 可否には影響しない（失敗しても無視してよいベストエフォート）。
 * https://www.revenuecat.com/docs/ad-monetization/admob
 */

// react-native-google-mobile-adsのRevenuePrecisionsを、RevenueCatのAdRevenuePrecision文字列へ変換する。
const PRECISION_BY_ADMOB_CODE: Record<RevenuePrecisions, string> = {
  [RevenuePrecisions.UNKNOWN]: AdRevenuePrecision.unknown,
  [RevenuePrecisions.ESTIMATED]: AdRevenuePrecision.estimated,
  [RevenuePrecisions.PUBLISHER_PROVIDED]: AdRevenuePrecision.publisherDefined,
  [RevenuePrecisions.PRECISE]: AdRevenuePrecision.exact,
};

export function createBannerImpressionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function trackBannerLoaded(adUnitId: string, impressionId: string) {
  void Purchases.adTracker
    .trackAdLoaded({ mediatorName: AdMediatorName.adMob, adFormat: AdFormat.banner, adUnitId, impressionId })
    .catch(() => undefined);
}

export function trackBannerDisplayed(adUnitId: string, impressionId: string) {
  void Purchases.adTracker
    .trackAdDisplayed({ mediatorName: AdMediatorName.adMob, adFormat: AdFormat.banner, adUnitId, impressionId })
    .catch(() => undefined);
}

export function trackBannerOpened(adUnitId: string, impressionId: string) {
  void Purchases.adTracker
    .trackAdOpened({ mediatorName: AdMediatorName.adMob, adFormat: AdFormat.banner, adUnitId, impressionId })
    .catch(() => undefined);
}

export function trackBannerFailedToLoad(adUnitId: string) {
  void Purchases.adTracker
    .trackAdFailedToLoad({ mediatorName: AdMediatorName.adMob, adFormat: AdFormat.banner, adUnitId })
    .catch(() => undefined);
}

/** react-native-google-mobile-adsのonPaidイベント（valueは通貨単位の小数）をRevenueCatへ転送する。 */
export function trackBannerRevenue(adUnitId: string, impressionId: string, paid: PaidEvent) {
  void Purchases.adTracker
    .trackAdRevenue({
      mediatorName: AdMediatorName.adMob,
      adFormat: AdFormat.banner,
      adUnitId,
      impressionId,
      revenueMicros: Math.round(paid.value * 1_000_000),
      currency: paid.currency,
      precision: PRECISION_BY_ADMOB_CODE[paid.precision] ?? AdRevenuePrecision.unknown,
    })
    .catch(() => undefined);
}
