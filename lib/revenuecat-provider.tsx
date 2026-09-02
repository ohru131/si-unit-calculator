import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import Purchases, { CustomerInfo, LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

import { useGlobalSettings } from "@/lib/global-settings";
import { type AppLanguage } from "@/lib/i18n";

export const PRO_ENTITLEMENT_IDENTIFIER = "pro";

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  purchaseStoreOnly: "Purchases are available in the iOS or Android store version.",
  revenueCatKeyMissing: "The RevenueCat public SDK key is not configured.",
  customerInfoFetchFailed: "Could not fetch purchase information. Please try again in the store version.",
  proUpgradeStoreOnly: "Upgrading to Pro is available in the published iOS or Android app.",
  paywallOpenFailed: "Could not open the purchase screen. Please check your store settings and network connection.",
  restoreStoreOnly: "Restoring purchases is available in the published iOS or Android app.",
  proRestored: "Your Pro purchase has been restored.",
  noRestorablePurchase: "No restorable Pro purchase was found.",
  restoreFailed: "Could not restore your purchase. Please try again.",
} as const;
const COPY: Record<AppLanguage, Record<keyof typeof EN_COPY, string>> = {
  en: EN_COPY,
  ja: {
    purchaseStoreOnly: "購入はiOSまたはAndroidのストア版で利用できます。",
    revenueCatKeyMissing: "RevenueCatの公開SDKキーが未設定です。",
    customerInfoFetchFailed: "購入情報を取得できませんでした。ストア版で再度お試しください。",
    proUpgradeStoreOnly: "Proへのアップグレードは、公開後のiOSまたはAndroidアプリで利用できます。",
    paywallOpenFailed: "購入画面を開けませんでした。ストア設定とネットワーク接続を確認してください。",
    restoreStoreOnly: "購入の復元は、公開後のiOSまたはAndroidアプリで利用できます。",
    proRestored: "Proの購入を復元しました。",
    noRestorablePurchase: "復元できるPro購入は見つかりませんでした。",
    restoreFailed: "購入を復元できませんでした。もう一度お試しください。",
  },
};

type ProContextValue = {
  isPro: boolean;
  isReady: boolean;
  isNativePurchaseAvailable: boolean;
  purchaseMessage: string | null;
  presentPaywall: () => Promise<void>;
  restorePurchases: () => Promise<void>;
};

const ProContext = createContext<ProContextValue | null>(null);

function getPlatformKey() {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  return undefined;
}

function hasProEntitlement(customerInfo: CustomerInfo) {
  return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_IDENTIFIER]);
}

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { language } = useGlobalSettings();
  const copy = COPY[language];
  const [isPro, setIsPro] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const isNativePurchaseAvailable = Platform.OS === "ios" || Platform.OS === "android";

  const refreshCustomerInfo = useCallback(async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    setIsPro(hasProEntitlement(customerInfo));
  }, []);

  useEffect(() => {
    let active = true;
    const key = getPlatformKey();
    if (!isNativePurchaseAvailable) {
      setPurchaseMessage(copy.purchaseStoreOnly);
      setIsReady(true);
      return () => {
        active = false;
      };
    }
    if (!key) {
      setPurchaseMessage(copy.revenueCatKeyMissing);
      setIsReady(true);
      return () => {
        active = false;
      };
    }

    const configure = async () => {
      try {
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey: key });
        const customerInfo = await Purchases.getCustomerInfo();
        if (active) setIsPro(hasProEntitlement(customerInfo));
        Purchases.addCustomerInfoUpdateListener((updatedInfo) => {
          if (active) setIsPro(hasProEntitlement(updatedInfo));
        });
      } catch {
        if (active) setPurchaseMessage(copy.customerInfoFetchFailed);
      } finally {
        if (active) setIsReady(true);
      }
    };
    void configure();
    return () => {
      active = false;
    };
  }, [copy, isNativePurchaseAvailable]);

  const presentPaywall = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessage(copy.proUpgradeStoreOnly);
      return;
    }
    try {
      setPurchaseMessage(null);
      await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: PRO_ENTITLEMENT_IDENTIFIER });
      await refreshCustomerInfo();
    } catch {
      setPurchaseMessage(copy.paywallOpenFailed);
    }
  }, [copy, isNativePurchaseAvailable, refreshCustomerInfo]);

  const restorePurchases = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessage(copy.restoreStoreOnly);
      return;
    }
    try {
      setPurchaseMessage(null);
      const customerInfo = await Purchases.restorePurchases();
      setIsPro(hasProEntitlement(customerInfo));
      setPurchaseMessage(hasProEntitlement(customerInfo) ? copy.proRestored : copy.noRestorablePurchase);
    } catch {
      setPurchaseMessage(copy.restoreFailed);
    }
  }, [copy, isNativePurchaseAvailable]);

  const value = useMemo(
    () => ({ isPro, isReady, isNativePurchaseAvailable, purchaseMessage, presentPaywall, restorePurchases }),
    [isPro, isReady, isNativePurchaseAvailable, purchaseMessage, presentPaywall, restorePurchases],
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const value = useContext(ProContext);
  if (!value) throw new Error("RevenueCatProvider の内部で使用してください。");
  return value;
}

