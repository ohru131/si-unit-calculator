import { describe, expect, it } from "vitest";

import {
  type OneTimeCandidatePackage,
  type OneTimeOfferingLike,
  selectOneTimePackage,
  selectOneTimePackageFromOfferings,
} from "@/lib/purchase-offering";

function makePackage(overrides: Partial<OneTimeCandidatePackage> & { product?: Partial<OneTimeCandidatePackage["product"]> } = {}): OneTimeCandidatePackage {
  return {
    identifier: "pkg",
    packageType: "CUSTOM",
    ...overrides,
    product: {
      priceString: "$9.99",
      productCategory: "NON_SUBSCRIPTION",
      subscriptionPeriod: null,
      ...overrides.product,
    },
  };
}

describe("selectOneTimePackage", () => {
  it("lifetimeスロットがあればそれを選ぶ", () => {
    const lifetime = makePackage({ identifier: "lifetime", packageType: "LIFETIME" });
    const offering: OneTimeOfferingLike = { lifetime, availablePackages: [lifetime] };
    expect(selectOneTimePackage(offering)).toBe(lifetime);
  });

  it("lifetimeスロットにサブスクが誤設定されていても返さない（他に候補が無ければnull）", () => {
    const misconfigured = makePackage({
      identifier: "lifetime",
      packageType: "LIFETIME",
      product: { productCategory: "SUBSCRIPTION", subscriptionPeriod: "P1Y" },
    });
    const offering: OneTimeOfferingLike = { lifetime: misconfigured, availablePackages: [misconfigured] };
    expect(selectOneTimePackage(offering)).toBeNull();
  });

  it("availablePackages中のサブスクをスキップし、後にあるLIFETIMEを選ぶ", () => {
    const monthly = makePackage({
      identifier: "monthly",
      packageType: "MONTHLY",
      product: { productCategory: "SUBSCRIPTION", subscriptionPeriod: "P1M" },
    });
    const lifetime = makePackage({ identifier: "lifetime", packageType: "LIFETIME" });
    const offering: OneTimeOfferingLike = { lifetime: null, availablePackages: [monthly, lifetime] };
    expect(selectOneTimePackage(offering)).toBe(lifetime);
  });

  it("CUSTOMパッケージ型のNON_SUBSCRIPTION商品を選ぶ", () => {
    const custom = makePackage({ identifier: "custom", packageType: "CUSTOM" });
    const offering: OneTimeOfferingLike = { lifetime: null, availablePackages: [custom] };
    expect(selectOneTimePackage(offering)).toBe(custom);
  });

  it("productCategoryがnullでもsubscriptionPeriodが無ければ受理する", () => {
    const pkg = makePackage({
      identifier: "unknown-category",
      packageType: "CUSTOM",
      product: { productCategory: null, subscriptionPeriod: null },
    });
    const offering: OneTimeOfferingLike = { lifetime: null, availablePackages: [pkg] };
    expect(selectOneTimePackage(offering)).toBe(pkg);
  });

  it("productCategoryがnullでもsubscriptionPeriodがあれば拒否する", () => {
    const pkg = makePackage({
      identifier: "hidden-subscription",
      packageType: "CUSTOM",
      product: { productCategory: null, subscriptionPeriod: "P1M" },
    });
    const offering: OneTimeOfferingLike = { lifetime: null, availablePackages: [pkg] };
    expect(selectOneTimePackage(offering)).toBeNull();
  });

  it("priceStringが空白のみなら拒否する", () => {
    const pkg = makePackage({
      identifier: "no-price",
      packageType: "CUSTOM",
      product: { priceString: "   " },
    });
    const offering: OneTimeOfferingLike = { lifetime: null, availablePackages: [pkg] };
    expect(selectOneTimePackage(offering)).toBeNull();
  });

  it("nullオファリングはnullを返す", () => {
    expect(selectOneTimePackage(null)).toBeNull();
  });

  it("undefinedオファリングはnullを返す", () => {
    expect(selectOneTimePackage(undefined)).toBeNull();
  });

  it("availablePackagesが空ならnullを返す", () => {
    const offering: OneTimeOfferingLike = { lifetime: null, availablePackages: [] };
    expect(selectOneTimePackage(offering)).toBeNull();
  });
});

describe("selectOneTimePackageFromOfferings", () => {
  it("currentが買い切りを持っていればそれを優先する", () => {
    const lifetime = makePackage({ identifier: "current-lifetime", packageType: "LIFETIME" });
    const currentOffering: OneTimeOfferingLike = { lifetime, availablePackages: [lifetime] };
    const result = selectOneTimePackageFromOfferings({
      current: currentOffering,
      all: { default: currentOffering },
    });
    expect(result).toBe(lifetime);
  });

  it("currentに無ければallを走査する", () => {
    const emptyOffering: OneTimeOfferingLike = { lifetime: null, availablePackages: [] };
    const lifetime = makePackage({ identifier: "fallback-lifetime", packageType: "LIFETIME" });
    const fallbackOffering: OneTimeOfferingLike = { lifetime, availablePackages: [lifetime] };
    const result = selectOneTimePackageFromOfferings({
      current: emptyOffering,
      all: { empty: emptyOffering, fallback: fallbackOffering },
    });
    expect(result).toBe(lifetime);
  });

  it("何も見つからなければnullを返す", () => {
    const emptyOffering: OneTimeOfferingLike = { lifetime: null, availablePackages: [] };
    const result = selectOneTimePackageFromOfferings({
      current: null,
      all: { empty: emptyOffering },
    });
    expect(result).toBeNull();
  });

  it("allが空でcurrentもnullならnullを返す", () => {
    expect(selectOneTimePackageFromOfferings({ all: {}, current: null })).toBeNull();
  });
});
