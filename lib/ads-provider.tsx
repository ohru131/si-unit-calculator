import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { initializeMobileAds } from "@/lib/ads-native-init";
import { usePro } from "@/lib/revenuecat-provider";

type AdsContextValue = {
  /** 広告SDKが利用できるプラットフォームか（Webでは非対応）。 */
  isAdsPlatformAvailable: boolean;
  /**
   * Pro状態の復元が完了しているか。falseの間は「広告を表示すべきでない」が
   * 確定していないため、バナーを描画しない（Proユーザーへ一瞬でも広告リクエストが
   * 飛ぶのを防ぐ）。
   */
  isReady: boolean;
  /** Pro購入により広告を非表示にすべきか。 */
  adFree: boolean;
  /** 同意取得とAdMob SDKの初期化が完了し、実際に広告をリクエストしてよい状態か。 */
  canRequestAds: boolean;
};

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isPro, isReady: isProReady } = usePro();
  const isAdsPlatformAvailable = Platform.OS === "ios" || Platform.OS === "android";
  const [canRequestAds, setCanRequestAds] = useState(false);
  const adFree = isPro;
  const isReady = isProReady;

  useEffect(() => {
    // Proで広告なしと確定しているユーザーには、同意フォーム表示やSDK初期化そのものを
    // 行わない。canRequestAdsはinitializeMobileAdsが実際に同意取得・SDK初期化まで
    // 終えるまでtrueにならないため、バナー側もそれまで描画されない。
    if (!isAdsPlatformAvailable || !isReady || adFree) return;
    let active = true;
    void initializeMobileAds().then((ok) => {
      if (active) setCanRequestAds(ok);
    });
    return () => {
      active = false;
    };
  }, [adFree, isAdsPlatformAvailable, isReady]);

  const value = useMemo<AdsContextValue>(
    () => ({
      isAdsPlatformAvailable,
      isReady,
      adFree,
      canRequestAds,
    }),
    [adFree, canRequestAds, isAdsPlatformAvailable, isReady],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const value = useContext(AdsContext);
  if (!value) throw new Error("AdsProvider の内部で使用してください。");
  return value;
}
