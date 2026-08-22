import { describe, expect, it } from "vitest";

const BASE_URL = "https://api.revenuecat.com/v1/subscribers/shipaton-credential-check";

async function verifySdkKey(key: string | undefined) {
  expect(key, "RevenueCat SDK key must be configured").toBeTruthy();
  const response = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${key}`,
      "X-Platform": "stripe",
    },
  });
  expect(response.status, "RevenueCat must accept the configured SDK key").toBeLessThan(400);
}

describe("RevenueCat SDKキー", () => {
  it("iOSの公開SDKキーを検証する", async () => {
    await verifySdkKey(process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY);
  });

  it("Androidの公開SDKキーを検証する", async () => {
    await verifySdkKey(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY);
  });
});
