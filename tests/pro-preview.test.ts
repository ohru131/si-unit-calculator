import { describe, expect, it } from "vitest";

import { composePublicIsPro, isProPreviewSupportedOn, parseProPreviewQueryAction, resolveInitialProPreview } from "@/lib/pro-preview";

describe("parseProPreviewQueryAction", () => {
  it("?pro=preview を有効化として読む", () => {
    expect(parseProPreviewQueryAction("?pro=preview")).toBe("enable");
  });

  it("?pro=off を解除として読む", () => {
    expect(parseProPreviewQueryAction("?pro=off")).toBe("disable");
  });

  it("パラメータが無ければnull", () => {
    expect(parseProPreviewQueryAction("")).toBeNull();
    expect(parseProPreviewQueryAction("?foo=bar")).toBeNull();
  });

  it("未知の値はnull（誤爆で有効・解除どちらにも倒さない）", () => {
    expect(parseProPreviewQueryAction("?pro=yes")).toBeNull();
  });

  it("他のクエリパラメータと共存できる", () => {
    expect(parseProPreviewQueryAction("?utm_source=x&pro=preview")).toBe("enable");
  });
});

describe("isProPreviewSupportedOn", () => {
  it("webでのみtrue", () => {
    expect(isProPreviewSupportedOn("web")).toBe(true);
    expect(isProPreviewSupportedOn("ios")).toBe(false);
    expect(isProPreviewSupportedOn("android")).toBe(false);
  });
});

describe("resolveInitialProPreview", () => {
  // このテストがこのモジュールを作った一番の理由: ネイティブ（iOS/Android）では
  // クエリや保存値が何であっても絶対にプレビューを有効にしない。
  it("ネイティブではクエリがenableでも保存値がtrueでも常にfalse", () => {
    expect(resolveInitialProPreview({ platformOS: "ios", queryAction: "enable", storedValue: true })).toBe(false);
    expect(resolveInitialProPreview({ platformOS: "android", queryAction: "enable", storedValue: true })).toBe(false);
  });

  it("Webでentitlementが無くてもクエリのenableで有効になる", () => {
    expect(resolveInitialProPreview({ platformOS: "web", queryAction: "enable", storedValue: false })).toBe(true);
  });

  it("Webでクエリのoffは保存値がtrueでも解除する", () => {
    expect(resolveInitialProPreview({ platformOS: "web", queryAction: "disable", storedValue: true })).toBe(false);
  });

  it("Webでクエリが無指定なら保存値を引き継ぐ", () => {
    expect(resolveInitialProPreview({ platformOS: "web", queryAction: null, storedValue: true })).toBe(true);
    expect(resolveInitialProPreview({ platformOS: "web", queryAction: null, storedValue: false })).toBe(false);
  });
});

describe("composePublicIsPro", () => {
  it("entitlementが無くてもプレビューが有効なら公開isProはtrue", () => {
    expect(composePublicIsPro(false, true)).toBe(true);
  });

  it("プレビューが無効でもentitlementがあればtrue", () => {
    expect(composePublicIsPro(true, false)).toBe(true);
  });

  it("どちらも無効ならfalse", () => {
    expect(composePublicIsPro(false, false)).toBe(false);
  });

  it("どちらも有効でもtrue（重複しても壊れない）", () => {
    expect(composePublicIsPro(true, true)).toBe(true);
  });
});
