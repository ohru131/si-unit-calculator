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
  es: {
    purchaseStoreOnly: "Las compras están disponibles en la versión de la tienda de iOS o Android.",
    revenueCatKeyMissing: "La clave pública del SDK de RevenueCat no está configurada.",
    customerInfoFetchFailed: "No se pudo obtener la información de compra. Inténtalo de nuevo en la versión de la tienda.",
    proUpgradeStoreOnly: "La actualización a Pro está disponible en la app publicada de iOS o Android.",
    paywallOpenFailed: "No se pudo abrir la pantalla de compra. Revisa la configuración de la tienda y tu conexión a internet.",
    restoreStoreOnly: "La restauración de compras está disponible en la app publicada de iOS o Android.",
    proRestored: "Tu compra de Pro se ha restaurado.",
    noRestorablePurchase: "No se encontró ninguna compra de Pro que se pueda restaurar.",
    restoreFailed: "No se pudo restaurar tu compra. Inténtalo de nuevo.",
  },
  "pt-BR": {
    purchaseStoreOnly: "As compras estão disponíveis na versão de loja para iOS ou Android.",
    revenueCatKeyMissing: "A chave pública do SDK do RevenueCat não está configurada.",
    customerInfoFetchFailed: "Não foi possível obter as informações de compra. Tente novamente na versão de loja.",
    proUpgradeStoreOnly: "O upgrade para Pro está disponível no app publicado para iOS ou Android.",
    paywallOpenFailed: "Não foi possível abrir a tela de compra. Verifique as configurações da loja e sua conexão de rede.",
    restoreStoreOnly: "A restauração de compras está disponível no app publicado para iOS ou Android.",
    proRestored: "Sua compra Pro foi restaurada.",
    noRestorablePurchase: "Nenhuma compra Pro restaurável foi encontrada.",
    restoreFailed: "Não foi possível restaurar sua compra. Tente novamente.",
  },
  de: {
    purchaseStoreOnly: "Käufe sind in der iOS- oder Android-Store-Version verfügbar.",
    revenueCatKeyMissing: "Der öffentliche RevenueCat-SDK-Schlüssel ist nicht konfiguriert.",
    customerInfoFetchFailed: "Kaufinformationen konnten nicht abgerufen werden. Bitte versuche es in der Store-Version erneut.",
    proUpgradeStoreOnly: "Das Upgrade auf Pro ist in der veröffentlichten iOS- oder Android-App verfügbar.",
    paywallOpenFailed: "Der Kaufbildschirm konnte nicht geöffnet werden. Bitte überprüfe deine Store-Einstellungen und Netzwerkverbindung.",
    restoreStoreOnly: "Die Wiederherstellung von Käufen ist in der veröffentlichten iOS- oder Android-App verfügbar.",
    proRestored: "Dein Pro-Kauf wurde wiederhergestellt.",
    noRestorablePurchase: "Es wurde kein wiederherstellbarer Pro-Kauf gefunden.",
    restoreFailed: "Dein Kauf konnte nicht wiederhergestellt werden. Bitte versuche es erneut.",
  },
  fr: {
    purchaseStoreOnly: "Les achats sont disponibles dans la version boutique iOS ou Android.",
    revenueCatKeyMissing: "La clé publique du SDK RevenueCat n'est pas configurée.",
    customerInfoFetchFailed: "Impossible de récupérer les informations d'achat. Veuillez réessayer dans la version boutique.",
    proUpgradeStoreOnly: "La mise à niveau vers Pro est disponible dans l'application iOS ou Android publiée.",
    paywallOpenFailed: "Impossible d'ouvrir l'écran d'achat. Vérifiez les paramètres de la boutique et votre connexion réseau.",
    restoreStoreOnly: "La restauration des achats est disponible dans l'application iOS ou Android publiée.",
    proRestored: "Votre achat Pro a été restauré.",
    noRestorablePurchase: "Aucun achat Pro restaurable n'a été trouvé.",
    restoreFailed: "Impossible de restaurer votre achat. Veuillez réessayer.",
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

// 購入メッセージはCOPYのキーで状態に持ち、表示直前にcopy[key]へ解決する。
// 翻訳済み文字列そのものをstateに入れると、エフェクトやコールバックの
// 依存配列にcopy（言語切替のたびに参照が変わる）を含める必要が生まれてしまう。
type PurchaseMessageKey = keyof typeof EN_COPY;

// Purchases.configure() は多重に呼ぶとSDK内部の状態がリセットされうるため、
// モジュールスコープのフラグで一度きりの実行を保証する。依存配列からcopyを
// 外せば言語切替では再実行されなくなるが、React 18のStrict Mode（開発時）は
// マウント時にエフェクトを2回実行するため、保険として入れておく。
let purchasesConfigured = false;

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
  const [isNativeReady, setIsNativeReady] = useState(false);
  const [purchaseMessageKey, setPurchaseMessageKey] = useState<PurchaseMessageKey | null>(null);
  const isNativePurchaseAvailable = Platform.OS === "ios" || Platform.OS === "android";
  const platformKey = getPlatformKey();

  // ネイティブ購入が使えない環境(Web)とSDKキーが未設定の環境では、そもそも初期化する余地が無い。
  // どちらもPlatformと環境変数だけで決まる=レンダー時に分かるので、エフェクトの中で
  // setStateせずに導出する（エフェクト内の同期setStateは余計な再レンダーを生むうえ、
  // react-hooks/set-state-in-effect のlintエラーにもなる）。
  const blockedReasonKey: PurchaseMessageKey | null = !isNativePurchaseAvailable
    ? "purchaseStoreOnly"
    : !platformKey
      ? "revenueCatKeyMissing"
      : null;
  // 初期化する余地が無い環境では待つものが無いので、最初から準備完了として扱う。
  const isReady = blockedReasonKey !== null ? true : isNativeReady;
  // 購入操作などで設定されたメッセージを優先し、無ければ上記の「使えない理由」を出す。
  const purchaseMessage = purchaseMessageKey ? copy[purchaseMessageKey] : blockedReasonKey ? copy[blockedReasonKey] : null;

  const refreshCustomerInfo = useCallback(async () => {
    const customerInfo = await Purchases.getCustomerInfo();
    setIsPro(hasProEntitlement(customerInfo));
  }, []);

  useEffect(() => {
    // 初期化する余地が無い環境（Web・SDKキー未設定）は blockedReasonKey で判別済みなので、
    // ここでは何もしない。メッセージと準備完了状態はレンダー時に導出している。
    if (blockedReasonKey !== null) return;
    // blockedReasonKey が null ならキーは必ずある。型を絞るためだけのガード。
    if (!platformKey) return;
    let active = true;

    // リスナーを名前付き関数として保持し、cleanupで確実に解除できるようにする
    // （匿名関数だと参照が残らず削除できず、再マウント・Strict Modeの2度実行で
    // リスナーが積み重なってしまう）。
    const handleCustomerInfoUpdate = (updatedInfo: CustomerInfo) => {
      if (active) setIsPro(hasProEntitlement(updatedInfo));
    };

    const configure = async () => {
      try {
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        if (!purchasesConfigured) {
          Purchases.configure({ apiKey: platformKey });
          purchasesConfigured = true;
        }
        const customerInfo = await Purchases.getCustomerInfo();
        // await を跨ぐ間にアンマウント（cleanup）が走っている可能性がある。
        // その場合はリスナーを登録しない。登録してしまうと cleanup では解除できず、
        // 消えた画面向けの更新が届き続ける。
        if (!active) return;
        setIsPro(hasProEntitlement(customerInfo));
        Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);
      } catch {
        if (active) setPurchaseMessageKey("customerInfoFetchFailed");
      } finally {
        if (active) setIsNativeReady(true);
      }
    };
    void configure();
    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    };
  }, [blockedReasonKey, platformKey]);

  const presentPaywall = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessageKey("proUpgradeStoreOnly");
      return;
    }
    try {
      setPurchaseMessageKey(null);
      await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: PRO_ENTITLEMENT_IDENTIFIER });
      await refreshCustomerInfo();
    } catch {
      setPurchaseMessageKey("paywallOpenFailed");
    }
  }, [isNativePurchaseAvailable, refreshCustomerInfo]);

  const restorePurchases = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessageKey("restoreStoreOnly");
      return;
    }
    try {
      setPurchaseMessageKey(null);
      const customerInfo = await Purchases.restorePurchases();
      setIsPro(hasProEntitlement(customerInfo));
      setPurchaseMessageKey(hasProEntitlement(customerInfo) ? "proRestored" : "noRestorablePurchase");
    } catch {
      setPurchaseMessageKey("restoreFailed");
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

