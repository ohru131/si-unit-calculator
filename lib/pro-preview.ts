// Web版でPro機能をプレビューできる隠しスイッチ（Shipaton提出用のスクリーンショット撮影・
// 審査員向け）。RevenueCatの購入を経由せずにisProを立てるだけの機構なので、
// react-native-purchasesを読み込まない純関数としてここに切り出し、vitestで固定できるようにする。
// lib/purchase-message.ts と同じ理由（lib/revenuecat-provider.tsx はネイティブモジュールを
// importするため、そこに書くとロジックだけを単体テストできない）。

export const PRO_PREVIEW_STORAGE_KEY = "si-unit-calculator.pro-preview.v1";
export const PRO_PREVIEW_QUERY_PARAM = "pro";
export const PRO_PREVIEW_QUERY_ON_VALUE = "preview";
export const PRO_PREVIEW_QUERY_OFF_VALUE = "off";

export type ProPreviewQueryAction = "enable" | "disable" | null;

// "?pro=preview" → 有効化、"?pro=off" → 解除。それ以外の値・パラメータ無しはnull
// （＝クエリからは何も指示されていない。呼び出し側は保存済みの値を引き継ぐ）。
export function parseProPreviewQueryAction(search: string): ProPreviewQueryAction {
  const params = new URLSearchParams(search);
  const value = params.get(PRO_PREVIEW_QUERY_PARAM);
  if (value === PRO_PREVIEW_QUERY_ON_VALUE) return "enable";
  if (value === PRO_PREVIEW_QUERY_OFF_VALUE) return "disable";
  return null;
}

// プレビュー機構そのものがWeb限定であることを1箇所に集約する。呼び出し側毎に
// `Platform.OS === "web"` を書かせると、書き忘れた箇所がネイティブでも有効になってしまう。
export function isProPreviewSupportedOn(platformOS: string): boolean {
  return platformOS === "web";
}

// 起動時に「今回のプレビュー有効状態」を決める。クエリが明示されていれば
// （URLを書き換えた直近の意図なので）保存済みの値より優先し、クエリが無ければ
// 保存済みの値をそのまま引き継ぐ。Web以外では保存値・クエリの中身に関わらず
// 常にfalseを返す（ネイティブで絶対に有効にしないための唯一のゲート）。
export function resolveInitialProPreview(options: {
  platformOS: string;
  queryAction: ProPreviewQueryAction;
  storedValue: boolean;
}): boolean {
  if (!isProPreviewSupportedOn(options.platformOS)) return false;
  if (options.queryAction === "enable") return true;
  if (options.queryAction === "disable") return false;
  return options.storedValue;
}

// 公開するisProは、本物のentitlement判定とプレビューフラグの論理和で合成する。
// hasEntitlement（RevenueCatのcustomerInfoから確認できた本物の権利）のstate自体は
// この関数を通さず素通りさせ、contextに公開する値だけをこの関数の戻り値に差し替える。
// こうすることで「hasProEntitlementを確認できたときだけ購入成功として扱う」既存の
// 判定（setIsPro）を一切汚さない。
export function composePublicIsPro(hasEntitlement: boolean, isProPreviewEnabled: boolean): boolean {
  return hasEntitlement || isProPreviewEnabled;
}
