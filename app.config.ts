// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
// Bundle ID can only contain letters, numbers, and dots
// Android requires each dot-separated segment to start with a letter
const rawBundleId = "com.app.siunitcalculator";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".") // Replace hyphens/underscores with dots
    .replace(/[^a-zA-Z0-9.]/g, "") // Remove invalid chars
    .replace(/\.+/g, ".") // Collapse consecutive dots
    .replace(/^\.+|\.+$/g, "") // Trim leading/trailing dots
    .toLowerCase()
    .split(".")
    .map((segment) => {
      // Android requires each segment to start with a letter
      // Prefix with 'x' if segment starts with a digit
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.manus.app";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Unit Calculator",
  appSlug: "si-unit-calculator",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl: "/manus-storage/si-unit-calculator-icon_96cf640c.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-localization",
    "expo-asset",
    "expo-font",
    "expo-image",
    "expo-secure-store",
    "expo-sharing",
    "expo-web-browser",
    "expo-status-bar",
    [
      "expo-widgets",
      {
        bundleIdentifier: `${env.iosBundleId}.widgets`,
        groupIdentifier: `group.${env.iosBundleId}`,
        widgets: [
          {
            name: "UnitCalculatorWidget",
            displayName: "Unit Calculator",
            description: "Shows your latest unit calculation.",
            supportedFamilies: ["systemSmall", "systemMedium"],
          },
        ],
      },
    ],
    [
      "expo-quick-actions",
      {
        iosActions: [
          { id: "speed", title: "Speed calculator", subtitle: "Distance ÷ time", icon: "time", params: { href: "/?quick=speed" } },
          { id: "pressure", title: "Pressure calculator", subtitle: "Force ÷ area", icon: "symbol:gauge.with.dots.needle.67percent", params: { href: "/?quick=pressure" } },
          { id: "samples", title: "Try examples", subtitle: "Start from a formula", icon: "bookmark", params: { href: "/?quick=samples" } },
          { id: "search", title: "Search units", subtitle: "Find units quickly", icon: "search", params: { href: "/?quick=search" } },
        ],
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
    // 無料プランに表示する広告（AdMob）。本番のApp IDは環境変数で上書きし、開発中の未設定時は
    // Googleがドキュメントで公開しているテストApp IDにフォールバックする（RevenueCatの
    // 公開SDKキーと同じ、CIやローカル.envで差し替える方式）。ただしEAS本番ビルド
    // （eas build --profile production）でテストApp IDのまま出荷してしまう事故を防ぐため、
    // そのプロファイルでは未設定だとビルド自体を失敗させる。
    [
      "react-native-google-mobile-ads",
      (() => {
        const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
        const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
        if (process.env.EAS_BUILD_PROFILE === "production" && (!androidAppId || !iosAppId)) {
          throw new Error(
            "本番ビルドにはEXPO_PUBLIC_ADMOB_ANDROID_APP_IDとEXPO_PUBLIC_ADMOB_IOS_APP_IDの設定が必須です（Googleのテスト広告IDのまま出荷させないため）。",
          );
        }
        return {
          androidAppId: androidAppId || "ca-app-pub-3940256099942544~3347511713",
          iosAppId: iosAppId || "ca-app-pub-3940256099942544~1458002511",
          userTrackingUsageDescription: "計算履歴に関連する広告を表示するために使用します。",
        };
      })(),
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    // GitHub Pagesはリポジトリ名のサブパス配下（https://<user>.github.io/<repo>/）で配信されるため、
    // その静的書き出しビルドでのみサブパスを付与する。GITHUB_PAGES_BASE_PATHはPages用のCIワークフロー
    // でのみ設定する専用の環境変数なので、通常のExpo Go/開発サーバー起動やモバイルのネイティブビルド
    // （eas build, expo run:ios/android）には一切影響しない。
    ...(process.env.GITHUB_PAGES_BASE_PATH ? { baseUrl: process.env.GITHUB_PAGES_BASE_PATH } : {}),
  },
};

export default config;
