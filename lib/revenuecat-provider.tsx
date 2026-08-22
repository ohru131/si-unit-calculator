import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import Purchases, { CustomerInfo, LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

export const PRO_ENTITLEMENT_IDENTIFIER = "pro";

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
      setPurchaseMessage("購入はiOSまたはAndroidのストア版で利用できます。");
      setIsReady(true);
      return () => {
        active = false;
      };
    }
    if (!key) {
      setPurchaseMessage("RevenueCatの公開SDKキーが未設定です。");
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
        if (active) setPurchaseMessage("購入情報を取得できませんでした。ストア版で再度お試しください。");
      } finally {
        if (active) setIsReady(true);
      }
    };
    void configure();
    return () => {
      active = false;
    };
  }, [isNativePurchaseAvailable]);

  const presentPaywall = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessage("Proへのアップグレードは、公開後のiOSまたはAndroidアプリで利用できます。");
      return;
    }
    try {
      setPurchaseMessage(null);
      await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: PRO_ENTITLEMENT_IDENTIFIER });
      await refreshCustomerInfo();
    } catch {
      setPurchaseMessage("購入画面を開けませんでした。ストア設定とネットワーク接続を確認してください。");
    }
  }, [isNativePurchaseAvailable, refreshCustomerInfo]);

  const restorePurchases = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessage("購入の復元は、公開後のiOSまたはAndroidアプリで利用できます。");
      return;
    }
    try {
      setPurchaseMessage(null);
      const customerInfo = await Purchases.restorePurchases();
      setIsPro(hasProEntitlement(customerInfo));
      setPurchaseMessage(hasProEntitlement(customerInfo) ? "Proの購入を復元しました。" : "復元できるPro購入は見つかりませんでした。");
    } catch {
      setPurchaseMessage("購入を復元できませんでした。もう一度お試しください。");
    }
  }, [isNativePurchaseAvailable]);

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

