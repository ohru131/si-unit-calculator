import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { initializeMobileAds } from "@/lib/ads-native-init";
import { usePro } from "@/lib/revenuecat-provider";

const AD_FREE_OVERRIDE_KEY = "si-unit-calculator.ad-free-override.v1";

type AdsContextValue = {
  /** 広告SDKが利用できるプラットフォームか（Webでは非対応）。 */
  isAdsPlatformAvailable: boolean;
  /** Pro購入または解除コードのどちらかにより広告を非表示にすべきか。 */
  adFree: boolean;
  redeemMessage: string | null;
  redeemCode: (code: string) => Promise<void>;
};

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isPro } = usePro();
  const isAdsPlatformAvailable = Platform.OS === "ios" || Platform.OS === "android";
  const [adFreeOverride, setAdFreeOverride] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AD_FREE_OVERRIDE_KEY)
      .then((stored) => {
        if (stored === "true") setAdFreeOverride(true);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAdsPlatformAvailable) return;
    void initializeMobileAds();
  }, [isAdsPlatformAvailable]);

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
      adFree: isPro || adFreeOverride,
      redeemMessage,
      redeemCode,
    }),
    [adFreeOverride, isAdsPlatformAvailable, isPro, redeemCode, redeemMessage],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const value = useContext(AdsContext);
  if (!value) throw new Error("AdsProvider の内部で使用してください。");
  return value;
}
