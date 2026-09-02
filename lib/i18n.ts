// アプリのUI言語。この配列を単一の情報源にして、型・入力検証・設定画面の選択肢を全てここから導出する。
// 以前は "en" | "ja" のユニオン型直書きで、言語を足すたびに型・AsyncStorageのガード・
// 画面側の三項演算子を別々に直す必要があった。
export const APP_LANGUAGES = ["en", "ja"] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

// Intlに渡すBCP47ロケールと、設定画面に出す言語名。言語名はその言語自身の表記(endonym)にする。
// 「英語UIでも自分の言語は自分の言語で書かれている」ほうが探しやすいため。
export const LANGUAGE_META: Record<AppLanguage, { endonym: string; locale: string }> = {
  en: { endonym: "English", locale: "en-US" },
  ja: { endonym: "日本語", locale: "ja-JP" },
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && (APP_LANGUAGES as readonly string[]).includes(value);
}

// 端末ロケールからアプリ言語を決める。将来 pt-BR のような地域付きの言語を追加しても当たるよう、
// 完全一致(pt-BR) → 言語コードだけの一致(pt) の順に探す。
export function resolveDeviceLanguage(languageTag?: string | null, languageCode?: string | null): AppLanguage {
  const normalizedTag = languageTag?.toLowerCase();
  if (normalizedTag) {
    const exactMatch = APP_LANGUAGES.find((candidate) => candidate.toLowerCase() === normalizedTag);
    if (exactMatch) return exactMatch;
  }

  // languageCode が無ければ languageTag の "-" より前（例: "pt-BR" → "pt"）を言語コード扱いにする。
  const normalizedCode = (languageCode ?? languageTag?.split("-")[0])?.toLowerCase();
  if (normalizedCode) {
    const codeMatch = APP_LANGUAGES.find((candidate) => candidate.split("-")[0].toLowerCase() === normalizedCode);
    if (codeMatch) return codeMatch;
  }

  return DEFAULT_LANGUAGE;
}

// 翻訳が揃っていない言語は英語で表示する、コンテンツ向けの多言語テキスト。
// UI文言(Record<AppLanguage, T> で全言語必須)と違い、プリセット計算ノートのように
// 件数が多くて段階的に翻訳していくデータにはこちらを使う。
export type LocalizedText = { en: string } & Partial<Record<AppLanguage, string>>;

export function localizedText(text: LocalizedText, language: AppLanguage): string {
  return text[language] ?? text.en;
}
