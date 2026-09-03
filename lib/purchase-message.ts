// 購入メッセージの選択を純関数に切り出してあるのは、この判定をテストで固定するため。
// lib/revenuecat-provider.tsx に書くと react-native-purchases（ネイティブモジュール）を
// 読み込むことになり、vitestからこの判定だけを検証できない。

// Proが有効なときに出したままだと矛盾するメッセージのキー。
// 購入直後にentitlementが付いてこなかった場合の案内（purchaseNotApplied）や
// 「復元できる購入が見つからない」（noRestorablePurchase）は、その後
// customerInfoのリスナー経由でProが有効になった時点で嘘になる。
// 画面側（app/(tabs)/pro.tsx）はメッセージを isPro に関係なく出すので、
// 消さないと「Pro利用中」カードと「Proを有効にできていません」が同時に並ぶ。
const KEYS_INVALID_WHEN_PRO: readonly string[] = ["purchaseNotApplied", "noRestorablePurchase"];

// 購入操作で設定されたメッセージを優先し、無ければ「そもそも購入できない理由」を出す。
// リスナー側でstateを消しに行くのではなくレンダー時に落とすのは、Proが有効になる経路が
// 購入・復元・リスナーの3つあり、どこを通っても矛盾が起きないようにするため。
export function resolvePurchaseMessageKey<TKey extends string>(
  purchaseMessageKey: TKey | null,
  blockedReasonKey: TKey | null,
  isPro: boolean,
): TKey | null {
  if (purchaseMessageKey && !(isPro && KEYS_INVALID_WHEN_PRO.includes(purchaseMessageKey))) {
    return purchaseMessageKey;
  }
  return blockedReasonKey;
}
