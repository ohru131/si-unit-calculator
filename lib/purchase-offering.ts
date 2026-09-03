// PurchasesOffering（react-native-purchasesのSDK型）をそのままパラメータ型にすると、テストで
// オファリングを手組みするたびにreadonlyの全フィールドを揃える必要が出て非現実的になる。ここでは
// 実際に読む形だけを最小限に定義し、SDKの実オブジェクト（フィールドが多く・readonly）が
// 構造的にそのまま渡せる形にしてある。

// PACKAGE_TYPE / PRODUCT_CATEGORY はreact-native-purchasesのenum値だが、ここではimportせず
// 文字列リテラルとして重複させている。importするとネイティブモジュールの実体を引っ張り込み、
// vitestからこのモジュール単体をロードできなくなるため（このファイルは純関数のまま保つ）。

export type OneTimePackageProduct = {
  readonly priceString?: string | null;
  readonly productCategory?: "NON_SUBSCRIPTION" | "SUBSCRIPTION" | "UNKNOWN" | null;
  readonly subscriptionPeriod?: string | null;
};

export type OneTimeCandidatePackage = {
  readonly identifier?: string;
  readonly packageType?: string;
  readonly product: OneTimePackageProduct;
};

export type OneTimeOfferingLike<T extends OneTimeCandidatePackage = OneTimeCandidatePackage> = {
  readonly availablePackages?: readonly T[] | null;
  readonly lifetime?: T | null;
};

export type OneTimeOfferingsLike<T extends OneTimeCandidatePackage = OneTimeCandidatePackage> = {
  readonly all?: Readonly<Record<string, OneTimeOfferingLike<T>>> | null;
  readonly current?: OneTimeOfferingLike<T> | null;
};

// 買い切り判定。lifetimeスロットを含む「すべての候補」に必ず適用する（dashboardの設定ミスで
// lifetimeスロットにサブスクが入っていても、ここを通さない限り絶対に素通りさせない）。
function isOneTimePackage(candidate: OneTimeCandidatePackage): boolean {
  const product = candidate.product;

  if (product.productCategory === "SUBSCRIPTION") return false;

  // productCategoryが取れないSDK/プラットフォームの組み合わせがあるため、
  // subscriptionPeriodの有無を「継続課金である証拠」として使う（これが最後の砦）。
  const hasSubscriptionPeriod = typeof product.subscriptionPeriod === "string" && product.subscriptionPeriod.length > 0;
  if (hasSubscriptionPeriod) return false;

  const isNonSubscriptionCategory = product.productCategory === "NON_SUBSCRIPTION";
  const isUnknownCategory = product.productCategory === null || product.productCategory === undefined;
  if (!isNonSubscriptionCategory && !isUnknownCategory) return false;

  // 購入ボタンに出す価格文字列が無ければ、そもそも売り物として提示できない。
  const priceString = product.priceString;
  if (typeof priceString !== "string" || priceString.trim().length === 0) return false;

  return true;
}

// 優先順位は lifetimeスロット → availablePackages中のLIFETIME型 → それ以外で買い切り判定を通るもの。
// どの段でも isOneTimePackage を通すので、サブスクが混入していても絶対に返さない。
// 型引数で受け取った型をそのまま返すのは、呼び出し側（lib/revenuecat-provider.tsx）が
// 戻り値をそのまま Purchases.purchasePackage() に渡すため。ここで narrow した型に落とすと
// SDKのPurchasesPackageとして通らなくなり、呼び出し側でキャストが必要になってしまう。
export function selectOneTimePackage<T extends OneTimeCandidatePackage>(offering: OneTimeOfferingLike<T> | null | undefined): T | null {
  if (!offering) return null;

  if (offering.lifetime && isOneTimePackage(offering.lifetime)) {
    return offering.lifetime;
  }

  const packages = offering.availablePackages ?? [];

  const lifetimeTyped = packages.find((candidate) => candidate.packageType === "LIFETIME" && isOneTimePackage(candidate));
  if (lifetimeTyped) return lifetimeTyped;

  // CUSTOMのパッケージ識別子に買い切り商品を紐付けている場合の救済（LIFETIME型を使っていない構成）。
  const anyOneTime = packages.find((candidate) => isOneTimePackage(candidate));
  if (anyOneTime) return anyOneTime;

  return null;
}

// getOfferings()が返すコンテナ全体から探す。currentに買い切り商品が無い構成もありうるので、
// 見つからなければall（Object.values順）まで総当たりする。
export function selectOneTimePackageFromOfferings<T extends OneTimeCandidatePackage>(offerings: OneTimeOfferingsLike<T> | null | undefined): T | null {
  if (!offerings) return null;

  const fromCurrent = selectOneTimePackage(offerings.current);
  if (fromCurrent) return fromCurrent;

  for (const offering of Object.values(offerings.all ?? {})) {
    const found = selectOneTimePackage(offering);
    if (found) return found;
  }

  return null;
}
