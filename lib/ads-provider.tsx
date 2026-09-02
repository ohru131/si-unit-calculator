import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { initializeMobileAds } from "@/lib/ads-native-init";
import { useGlobalSettings } from "@/lib/global-settings";
import { type AppLanguage } from "@/lib/i18n";
import { usePro } from "@/lib/revenuecat-provider";

const AD_FREE_OVERRIDE_KEY = "si-unit-calculator.ad-free-override.v1";

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  redeemCodeNotConfigured: "The unlock code is not configured.",
  redeemCodeIncorrect: "That code is incorrect.",
  redeemCodeSuccess: "Ads are now hidden.",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    redeemCodeNotConfigured: "解除コードが設定されていません。",
    redeemCodeIncorrect: "コードが違います。",
    redeemCodeSuccess: "広告を非表示にしました。",
  },
  es: {
    redeemCodeNotConfigured: "El código de desbloqueo no está configurado.",
    redeemCodeIncorrect: "Ese código no es correcto.",
    redeemCodeSuccess: "Los anuncios ahora están ocultos.",
  },
  "pt-BR": {
    redeemCodeNotConfigured: "O código de desbloqueio não está configurado.",
    redeemCodeIncorrect: "Esse código está incorreto.",
    redeemCodeSuccess: "Os anúncios agora estão ocultos.",
  },
  de: {
    redeemCodeNotConfigured: "Der Freischaltcode ist nicht konfiguriert.",
    redeemCodeIncorrect: "Dieser Code ist falsch.",
    redeemCodeSuccess: "Werbung ist jetzt ausgeblendet.",
  },
  fr: {
    redeemCodeNotConfigured: "Le code de déverrouillage n'est pas configuré.",
    redeemCodeIncorrect: "Ce code est incorrect.",
    redeemCodeSuccess: "Les publicités sont désormais masquées.",
  },
};

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
  /** 同意取得とAdMob SDKの初期化が完了し、実際に広告をリクエストしてよい状態か。 */
  canRequestAds: boolean;
  redeemMessage: string | null;
  redeemCode: (code: string) => Promise<void>;
};

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isPro, isReady: isProReady } = usePro();
  const { language } = useGlobalSettings();
  const copy = COPY[language];
  const isAdsPlatformAvailable = Platform.OS === "ios" || Platform.OS === "android";
  const [adFreeOverride, setAdFreeOverride] = useState(false);
  const [isAdFreeOverrideRestored, setIsAdFreeOverrideRestored] = useState(false);
  const [canRequestAds, setCanRequestAds] = useState(false);
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
    // SDK初期化そのものを行わない。canRequestAdsはinitializeMobileAdsが実際に
    // 同意取得・SDK初期化まで終えるまでtrueにならないため、バナー側もそれまで描画されない。
    if (!isAdsPlatformAvailable || !isReady || adFree) return;
    let active = true;
    void initializeMobileAds().then((ok) => {
      if (active) setCanRequestAds(ok);
    });
    return () => {
      active = false;
    };
  }, [adFree, isAdsPlatformAvailable, isReady]);

  const redeemCode = useCallback(async (code: string) => {
    const expected = process.env.EXPO_PUBLIC_ADFREE_REDEEM_CODE;
    if (!expected) {
      setRedeemMessage(copy.redeemCodeNotConfigured);
      return;
    }
    if (code.trim() !== expected) {
      setRedeemMessage(copy.redeemCodeIncorrect);
      return;
    }
    setAdFreeOverride(true);
    await AsyncStorage.setItem(AD_FREE_OVERRIDE_KEY, "true");
    setRedeemMessage(copy.redeemCodeSuccess);
  }, [copy]);

  const value = useMemo<AdsContextValue>(
    () => ({
      isAdsPlatformAvailable,
      isReady,
      adFree,
      canRequestAds,
      redeemMessage,
      redeemCode,
    }),
    [adFree, canRequestAds, isAdsPlatformAvailable, isReady, redeemCode, redeemMessage],
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds() {
  const value = useContext(AdsContext);
  if (!value) throw new Error("AdsProvider の内部で使用してください。");
  return value;
}
