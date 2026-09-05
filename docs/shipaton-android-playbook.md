# Shipaton 2026 Android提出プレイブック

この手順は「Androidのみ」でShipaton提出まで進めるための最短経路。

## 0. ゴール

- Google Play公開URLを発行
- 審査員がPro機能を試せる状態を用意
- Shipaton提出フォームを埋め切る

## 1. 先に用意する外部アカウント

- Google Play Console（開発者登録完了）
- AdMob（アプリ追加可能な状態）
- RevenueCat（`pro` entitlementを管理可能）
- Expo/EAS（`eas whoami`成功）

## 2. 環境変数を埋める

`.env` のAndroid必須キーを埋める。

```env
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=...
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=...
EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID=...
```

確認コマンド:

```powershell
rtk npx eas-cli whoami
rtk npx eas-cli env:list --environment production
```

## 3. ローカル健全性チェック

```powershell
rtk pnpm check
rtk pnpm lint
rtk pnpm test
rtk npx expo export --platform web
```

判定:

- `pnpm check` が成功
- `pnpm lint` は既知2件以内
- `pnpm test` は既知のRevenueCat環境依存失敗以外なし
- `expo export --platform web` 成功

## 4. Play Console作業

1. アプリ作成（英語ベースで入力）
2. ストア掲載情報を入力
3. プライバシーポリシーURLを設定
4. コンテンツレーティング回答
5. 対象国に米国を含める

説明文の下書きは `docs/shipaton-submission-kit.md` を使用。

## 5. AdMob作業

1. Apps でAndroidアプリを登録
2. `App ID` を取得して `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` に設定
3. Ad units で Banner を作成
4. `Ad unit ID` を取得して `EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID` に設定

## 6. RevenueCat作業（買い切り前提）

1. `pro` entitlement を用意
2. Android商品を entitlement に正しく紐付け
3. offering からサブスク商品が混入していないことを確認
4. 審査員向けのテスト導線（promo code等）を準備

## 7. Android本番ビルド

```powershell
rtk npx eas-cli build --platform android --profile production
```

`app.config.ts` は production で AdMob App ID 未設定ならビルド失敗する設計。
この失敗は正しい防御。

## 8. Play Consoleへ配信

1. Internal testing にAABを投入
2. 内部テスターで動作確認
3. 問題なければ Production へ昇格
4. 公開後にストアURLを取得

## 9. Shipaton提出

提出時の必須物:

- Google Play公開URL（米国からアクセス可能）
- 英語説明文
- 2分以内のデモ動画URL
- 1024pxアイコン
- スクリーンショット
- 審査員向けPro検証手段

## 10. 詰まりやすい点

- `shipaton.revenuecat.com` が社内プロキシで504の可能性
- AdMob未設定のままproduction buildを打つと失敗
- Privacy policy URL未設定でPlay審査が止まる
- RevenueCatの商品紐付け漏れで購入後にPro反映されない