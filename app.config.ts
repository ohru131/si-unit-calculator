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
  appName: "UnitCalc",
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
  version: "1.3.0",
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
    // **ローカルの gradle ビルド専用の versionCode。**
    // plugins/withLocalReleaseSigning.js が release を本番鍵で署名するので、ローカルでも
    // Playへ出せるAABが作れる。そのとき採番するのはここ（EASのリモート採番は効かない）。
    // Playは同じ versionCode のAABを二度受け付けない。1.0.0 が 1、1.1.0 が 2（どちらも
    // アップロード済みで、2 はクローズドテストに配信中）なので次は 3。**使用済みかどうかは
    // Play Console の App Bundle Explorer、または play-service-account の鍵で
    // androidpublisher の edits.bundles.list を読めば確定できる**（推測しないこと）。
    // **バージョン名を上げるたびにここも上げること**（上げ忘れるとPlayのアップロードで
    // 弾かれるまで気付けない）。
    // EAS の production ビルドは eas.json の appVersionSource: "remote" 側の採番を使い、
    // この値は無視する（EAS CLI が「消すことを推奨」と警告するのはそのため）。両方の
    // 採番が混ざっても順序が壊れないよう、EAS側のカウンタはこの値以上に保つ。
    versionCode: 4,
    // このアプリは通知を一切出さない（スキャフォールド由来の POST_NOTIFICATIONS を削除済み）。
    // 空配列は「追加の権限を宣言しない」の明示で、@expo/config-plugins の withPermissions は
    // 値が空なら何も足さない。**ただし空配列でも権限は14個載る**——ネイティブ依存の
    // マニフェストがマージャで合流するので、ここを空にしても消えない（1.2.0 の release AAB で
    // 実測。内訳は CLAUDE.md の「権限の実測値」を参照）。**未使用の権限をここに戻さないこと**
    // （Play Consoleのデータセーフティで「宣言しているが使っていない」を説明する羽目になる）。
    permissions: [],
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
    "./plugins/withAdMobKotlinCompatibility",
    // デバッグビルドだけ applicationId に ".debug" を付けて、Play版と同じ端末に共存させる。
    // 詳しい理由はプラグイン本体のコメント。
    "./plugins/withDebugPackageSuffix",
    // release ビルドから SYSTEM_ALERT_WINDOW（使っていないのにPlayの権限一覧に出る）を外す。
    // debug 側は開発メニューのために残す。詳しい理由はプラグイン本体のコメント。
    "./plugins/withoutReleaseOverlayPermission",
    // credentials.json があるときだけ、release ビルドをそのkeystoreで署名する。
    // 無ければ何もしない（EASビルドを壊さない）。詳しい理由はプラグイン本体のコメント。
    "./plugins/withLocalReleaseSigning",
    "expo-router",
    "expo-localization",
    "expo-asset",
    "expo-font",
    "expo-image",
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
            displayName: "UnitCalc",
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
        ],
      },
    ],
    // expo-audio / expo-video のプラグインはスキャフォールド由来で、アプリは音声も動画も
    // 一切扱わないので削除した。残しておくと以下が黙ってマニフェスト・Info.plistに載る:
    //   expo-audio → RECORD_AUDIO・MODIFY_AUDIO_SETTINGS・FOREGROUND_SERVICE・
    //     FOREGROUND_SERVICE_MEDIA_PLAYBACK、NSMicrophoneUsageDescription、
    //     UIBackgroundModes=audio、mediaPlayback のフォアグラウンドサービス
    //   expo-video → FOREGROUND_SERVICE・FOREGROUND_SERVICE_MEDIA_PLAYBACK、
    //     UIBackgroundModes=audio、同じくフォアグラウンドサービス
    // FOREGROUND_SERVICE_MEDIA_PLAYBACK はPlay Consoleで用途の申告フォームが必須になる。
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
        const buildPlatform = process.env.EAS_BUILD_PLATFORM;
        const missingProductionAppId =
          !androidAppId || (buildPlatform === "ios" && !iosAppId);
        if (process.env.EAS_BUILD_PROFILE === "production" && missingProductionAppId) {
          throw new Error(
            `本番${buildPlatform === "ios" ? "iOS" : "Android"}ビルドには対象プラットフォームのAdMob App ID設定が必須です（Googleのテスト広告IDのまま出荷させないため）。`,
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
  extra: {
    eas: {
      projectId: "5169bfd6-c7f3-4de9-8656-0c78bd3844a0",
    },
  },
};

export default config;
