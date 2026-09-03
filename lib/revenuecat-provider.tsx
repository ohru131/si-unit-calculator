import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import Purchases, { CustomerInfo, LOG_LEVEL, type PurchasesPackage } from "react-native-purchases";

import { useGlobalSettings } from "@/lib/global-settings";
import { type AppLanguage } from "@/lib/i18n";
import { selectOneTimePackageFromOfferings } from "@/lib/purchase-offering";

export const PRO_ENTITLEMENT_IDENTIFIER = "pro";

// 英語のキー集合を正にして、言語を足したときにキー漏れがその言語のブロックで型エラーになるようにする。
const EN_COPY = {
  purchaseStoreOnly: "Purchases are available in the iOS or Android store version.",
  revenueCatKeyMissing: "The RevenueCat public SDK key is not configured.",
  customerInfoFetchFailed: "Could not fetch purchase information. Please try again in the store version.",
  proUpgradeStoreOnly: "Upgrading to Pro is available in the published iOS or Android app.",
  purchaseSucceeded: "Thanks for your purchase! Pro is unlocked for good — a one-time purchase, no recurring charges.",
  purchaseNotApplied: "Your payment went through, but Pro could not be activated yet. Tap Restore purchase; if it still does not activate, contact support — you will not be charged twice.",
  purchaseFailed: "Could not complete your purchase. Please try again.",
  productLoadFailed: "Could not load the Pro product from the store. Please check your network connection and try again.",
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
    purchaseSucceeded: "Proのご購入ありがとうございます。買い切りで、これからずっとご利用いただけます。",
    purchaseNotApplied: "お支払いは完了しましたが、Proをまだ有効にできていません。「購入を復元」をお試しください。それでも有効にならない場合はサポートへご連絡ください（二重に請求されることはありません）。",
    purchaseFailed: "購入を完了できませんでした。もう一度お試しください。",
    productLoadFailed: "ストアからPro商品を読み込めませんでした。ネットワーク接続を確認し、もう一度お試しください。",
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
    purchaseSucceeded: "¡Gracias por tu compra! Pro queda desbloqueado para siempre: es una compra única, sin cargos recurrentes.",
    purchaseNotApplied: "Tu pago se ha realizado, pero aún no hemos podido activar Pro. Toca «Restaurar compra»; si sigue sin activarse, contacta con soporte: no se te cobrará dos veces.",
    purchaseFailed: "No se pudo completar tu compra. Inténtalo de nuevo.",
    productLoadFailed: "No se pudo cargar el producto Pro desde la tienda. Revisa tu conexión a internet e inténtalo de nuevo.",
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
    purchaseSucceeded: "Obrigado pela compra! O Pro fica desbloqueado para sempre — uma compra única, sem cobrança recorrente.",
    purchaseNotApplied: "Seu pagamento foi concluído, mas ainda não conseguimos ativar o Pro. Toque em «Restaurar compra»; se continuar sem ativar, fale com o suporte — você não será cobrado duas vezes.",
    purchaseFailed: "Não foi possível concluir sua compra. Tente novamente.",
    productLoadFailed: "Não foi possível carregar o produto Pro na loja. Verifique sua conexão com a internet e tente novamente.",
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
    purchaseSucceeded: "Danke für deinen Kauf! Pro ist dauerhaft freigeschaltet — als Einmalkauf, ohne wiederkehrende Kosten.",
    purchaseNotApplied: "Deine Zahlung war erfolgreich, aber Pro konnte noch nicht aktiviert werden. Tippe auf „Kauf wiederherstellen“; falls es weiterhin nicht aktiv wird, wende dich an den Support — dir wird nichts doppelt berechnet.",
    purchaseFailed: "Dein Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
    productLoadFailed: "Das Pro-Produkt konnte nicht aus dem Store geladen werden. Bitte überprüfe deine Netzwerkverbindung und versuche es erneut.",
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
    purchaseSucceeded: "Merci pour votre achat ! Pro est débloqué pour toujours — un achat unique, sans frais récurrents.",
    purchaseNotApplied: "Votre paiement a bien été effectué, mais Pro n'a pas encore pu être activé. Touchez « Restaurer l'achat » ; si Pro reste inactif, contactez le support — vous ne serez pas facturé deux fois.",
    purchaseFailed: "Impossible de finaliser votre achat. Veuillez réessayer.",
    productLoadFailed: "Impossible de charger le produit Pro depuis la boutique. Vérifiez votre connexion réseau et réessayez.",
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
  priceLabel: string | null;
  isPurchasing: boolean;
  purchasePro: () => Promise<void>;
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

// Purchases.purchasePackage() の拒否値はcatch節ではunknown型になる。userCancelledはSDKの
// PurchasesError型が持つフィールドだが、anyにキャストせず存在確認してから読む。
function isUserCancelledError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (!("userCancelled" in error)) return false;
  return (error as { userCancelled: unknown }).userCancelled === true;
}

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { language } = useGlobalSettings();
  const copy = COPY[language];
  const [isPro, setIsPro] = useState(false);
  const [isNativeReady, setIsNativeReady] = useState(false);
  const [purchaseMessageKey, setPurchaseMessageKey] = useState<PurchaseMessageKey | null>(null);
  // 買い切りパッケージそのものをstateに持つ。priceLabelはこれのproduct.priceStringから
  // レンダー時に導出する（別途stateを持つと両者がずれる余地が生まれるため）。
  const [oneTimePackage, setOneTimePackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  // isPurchasing（state）と Pressable の disabled はどちらも「コミット後」の値なので、
  // 同じフレーム内で onPress が2回走ると両方とも false を読んで通過してしまう。
  // 実際に課金APIを叩く経路なので、レンダーを介さない同期フラグで直列化する。
  // isPurchasing は表示（インジケータ・ボタン無効化）専用として残す。
  const purchaseLockRef = useRef(false);
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
  // ストアが返す表示用の価格文字列をそのまま出す（買い切りパッケージが未取得ならnull）。
  const priceLabel = oneTimePackage ? oneTimePackage.product.priceString : null;

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
        // オファリング取得はここでは失敗させても外側のcatchに落とさない。
        // 既にPro権利を持つユーザーが、ストア側の一時的な取得失敗のせいで
        // isReady・isProの結果を巻き添えにしてPro表示を失ってはいけない。
        try {
          const offerings = await Purchases.getOfferings();
          if (active) setOneTimePackage(selectOneTimePackageFromOfferings(offerings));
        } catch {
          // 無視する。priceLabelはnullのままになるが、購入自体はpurchasePro側の
          // フォールバック（ホスト型ペイウォール）で導線を確保する。
        }
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

  const purchasePro = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessageKey("proUpgradeStoreOnly");
      return;
    }
    // SDKキーが無い環境では初期化エフェクトが早期returnしていて Purchases.configure() を
    // 通っていないため、getOfferings/purchasePackage は必ず拒否される。それを
    // 「商品を読み込めませんでした」と出すと本当の原因（キー未設定）を隠してしまう。
    if (blockedReasonKey !== null) {
      setPurchaseMessageKey(blockedReasonKey);
      return;
    }
    // configure() 完了前も同じ理由で失敗するので、準備できるまで受け付けない
    // （この間は購入画面側にインジケータが出ている）。
    if (!isReady) return;
    // 購入・復元のいずれかが進行中なら二重タップを無視する（多重購入の起動を防ぐ）。
    if (purchaseLockRef.current) return;
    purchaseLockRef.current = true;
    setIsPurchasing(true);
    setPurchaseMessageKey(null);
    try {
      let pkg = oneTimePackage;
      if (!pkg) {
        // 起動時の取得に失敗していた場合の救済として、購入直前にもう一度だけ試す。
        try {
          const offerings = await Purchases.getOfferings();
          pkg = selectOneTimePackageFromOfferings(offerings);
          if (pkg) setOneTimePackage(pkg);
        } catch {
          // 再取得も失敗。pkgはnullのまま下のフォールバックへ進む。
        }
      }

      if (pkg) {
        try {
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          // 決済が通っても pro entitlement が付いてこないことがある（dashboardで商品を
          // entitlementに紐付け忘れている等。サブスクから買い切りへ移行している最中は
          // まさにその状態になりうる）。そこで「ありがとうございます、ずっと使えます」と
          // 出すと、支払ったのにProが有効にならないユーザーに嘘をつくことになるので、
          // entitlementを確認できたときだけ成功として扱い、それ以外は復元とサポートへ導く。
          const unlocked = hasProEntitlement(customerInfo);
          setIsPro(unlocked);
          setPurchaseMessageKey(unlocked ? "purchaseSucceeded" : "purchaseNotApplied");
        } catch (error) {
          // キャンセルは失敗ではない。「購入に失敗しました」を出すのはバグになる。
          if (!isUserCancelledError(error)) setPurchaseMessageKey("purchaseFailed");
        }
        return;
      }

      // ここに来るのは買い切りパッケージが取得できなかった場合。以前はRevenueCatの
      // ホスト型ペイウォールにフォールバックしていたが、presentPaywallIfNeeded は
      // entitlementの有無しか見ず、**dashboardのofferingに入っている商品をそのまま出す**。
      // つまりサブスク商品が残っていれば「買い切り」と表示しておいて継続課金を売る経路に
      // なってしまう。取りこぼしよりそちらのほうが重大なので、購入させずに理由を出す。
      setPurchaseMessageKey("productLoadFailed");
    } finally {
      purchaseLockRef.current = false;
      setIsPurchasing(false);
    }
  }, [blockedReasonKey, isNativePurchaseAvailable, isReady, oneTimePackage]);

  const restorePurchases = useCallback(async () => {
    if (!isNativePurchaseAvailable) {
      setPurchaseMessageKey("restoreStoreOnly");
      return;
    }
    // 購入と同じ理由で、configure() を通っていない環境では restorePurchases も必ず失敗する。
    // 「復元できませんでした」だと原因が分からないので、判明している理由をそのまま出す。
    if (blockedReasonKey !== null) {
      setPurchaseMessageKey(blockedReasonKey);
      return;
    }
    if (!isReady) return;
    // 購入・復元のいずれかが進行中なら二重タップを無視する（購入と同じロックを共有する）。
    if (purchaseLockRef.current) return;
    purchaseLockRef.current = true;
    setIsPurchasing(true);
    try {
      setPurchaseMessageKey(null);
      const customerInfo = await Purchases.restorePurchases();
      setIsPro(hasProEntitlement(customerInfo));
      setPurchaseMessageKey(hasProEntitlement(customerInfo) ? "proRestored" : "noRestorablePurchase");
    } catch {
      setPurchaseMessageKey("restoreFailed");
    } finally {
      purchaseLockRef.current = false;
      setIsPurchasing(false);
    }
  }, [blockedReasonKey, isNativePurchaseAvailable, isReady]);

  const value = useMemo(
    () => ({ isPro, isReady, isNativePurchaseAvailable, purchaseMessage, priceLabel, isPurchasing, purchasePro, restorePurchases }),
    [isPro, isReady, isNativePurchaseAvailable, purchaseMessage, priceLabel, isPurchasing, purchasePro, restorePurchases],
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const value = useContext(ProContext);
  if (!value) throw new Error("RevenueCatProvider の内部で使用してください。");
  return value;
}

