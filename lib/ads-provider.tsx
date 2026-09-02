import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { initializeMobileAds } from "@/lib/ads-native-init";
import { usePro } from "@/lib/revenuecat-provider";

const AD_FREE_OVERRIDE_KEY = "si-unit-calculator.ad-free-override.v1";

type AdsContextValue = {
  /** 広告SDKが利用できるプラットフォームか（Webでは非対応）。 */
  isAdsPlatformAvailable: boolean;
  /**
   * Pro状態・解除コードの復元が完了しているか。falseの間は「広告を表示すべきでない」が
   * 確定していないため、バナーを描画しない（Pro/解除ユーザーへ一瞬でも広告リクエストが
   * 飛ぶのを防ぐ）。
   */
  isReady: boolean;
  /** Pro購入または解除コードのどちらかにより広告を非表示にすべきか。 */
  adFree: boolean;
  redeemMessage: string | null;
  redeemCode: (code: string) => Promise<void>;
};

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isPro, isReady: isProReady } = usePro();
  const isAdsPlatformAvailable = Platform.OS === "ios" || Platform.OS === "android";
  const [adFreeOverride, setAdFreeOverride] = useState(false);
  const [isAdFreeOverrideRestored, setIsAdFreeOverrideRestored] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);
  const adFree = isPro || adFreeOverride;
  const isReady = isProReady && isAdFreeOverrideRestored;

  useEffect(() => {
    AsyncStorage.getItem(AD_FREE_OVERRIDE_KEY)
      .then((stored) => {
        if (stored === "true") setAdFreeOverride(true);
      })
      .catch(() => undefined)
      .finally(() => setIsAdFreeOverrideRestored(true));
  }, []);

  useEffect(() => {
    // Pro/解除コードのどちらかで広告なしと確定しているユーザーには、同意フォーム表示や
    // SDK初期化そのものを行わない。
    if (!isAdsPlatformAvailable || !isReady || adFree) return;
    void initializeMobileAds();
  }, [adFree, isAdsPlatformAvailable, isReady]);

  const redeemCode = useCallback(async (code: string) => {
    const expected = process.env.EXPO_PUBLIC_ADFREE_REDEEM_CODE;
    if (!expected) {
      setRedeemMessage("解除コードが設定されていません。");
      return;
    }
    if (code.trim() !== expected) {
      setRedeemMessage("コードが違います。");
      return;
    }
    setAdFreeOverride(true);
    await AsyncStorage.setItem(AD_FREE_OVERRIDE_KEY, "true");
    setRedeemMessage("広告を非表示にしました。");
  }, []);

  const value = useMemo<AdsContextValue>(
    () => ({
      isAdsPlatformAvailable,
      isReady,
      adFree,
      redeemMessage,
      redeemCode,
    }),
    [adFree, isAdsPlatformAvailable, isReady, redeemCode, redeemMessage],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const value = useContext(AdsContext);
  if (!value) throw new Error("AdsProvider の内部で使用してください。");
  return value;
}
