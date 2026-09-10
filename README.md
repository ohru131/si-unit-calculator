# UnitCalc（単位付き電卓）

単位を含む式（例: `1kΩ × 1mA`）をそのまま計算し、SI基底単位への正規化結果と、任意の出力単位への換算結果を同時に確認できる電卓アプリです。Expo (React Native) 製で、iOS / Android / Web で動作します。

## 主な機能

- `1kΩ × 1mA` のような単位付き数式の直接計算
- 計算結果のSI標準単位への自動正規化
- 出力単位の切り替え（`cm`, `m`, `%`, `ppm` など）
- `W = 3cm` のような定数（記号）の登録・編集・削除
- 計算履歴の保存
- 掛け算・割り算を含む次元演算（面積・速度など）

## 技術スタック

- [Expo](https://expo.dev/) / [Expo Router](https://docs.expo.dev/router/introduction/)
- React Native + React 19
- NativeWind (Tailwind CSS for React Native)
- TypeScript / Vitest

データは全て端末内（AsyncStorage）に保存し、バックエンドは持ちません。

## セットアップ

### 前提条件

- Node.js 22.x
- [pnpm](https://pnpm.io/) 9.x（`corepack enable` で有効化可能）

### インストール

```bash
pnpm install
```

## アプリの起動方法

### Web で確認する（最も手軽）

```bash
pnpm dev
```

`pnpm dev` は Expo Web（`http://localhost:8081`）を起動します。起動後、ブラウザで `http://localhost:8081` を開いてください。

> **Note:** `package.json` のデフォルトポート指定 `${EXPO_PORT:-8081}` は POSIX シェル構文のため、Windows 環境ではポート解決に失敗することがあります。その場合や、既に別プロセスがポート 8081 を使用している場合は、`--port` で別のポートを指定してください。
>
> ```bash
> npx expo start --web --port 8082
> ```

### スマートフォン実機で確認する（Expo Go）

```bash
pnpm dev
```

起動後にターミナルへ表示される QR コード、または以下で生成した QR コードを [Expo Go](https://expo.dev/go) アプリで読み取ってください。PC とスマートフォンが同一ネットワークに接続されている必要があります。

```bash
pnpm qr
```

### iOS / Android シミュレータで確認する

```bash
pnpm ios      # Xcode + iOS シミュレータが必要
pnpm android  # Android Studio + エミュレータが必要
```

## その他のコマンド

| コマンド | 説明 |
|---|---|
| `pnpm check` | TypeScript の型チェック |
| `pnpm lint` | ESLint (`expo lint`) |
| `pnpm format` | Prettier によるフォーマット |
| `pnpm test` | Vitest によるテスト実行 |

## 環境変数

いずれも未設定のままローカル動作を確認できます（購入まわりはRevenueCatのSDKキーが無いと無効化され、広告はGoogleのテストIDにフォールバックします）。設定する場合は `.env.example` をコピーして `.env` を作ってください。

| 変数名 | 用途 |
|---|---|
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `..._ANDROID_API_KEY` | RevenueCat の公開SDKキー |
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` / `..._IOS_APP_ID` | AdMob の App ID |
| `EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID` | 無料版に出すバナーの広告ユニットID |
| `EXPO_PUBLIC_ADFREE_REDEEM_CODE` | 広告非表示をローカルで試すためのコード |

## ディレクトリ構成

```
app/            画面（Expo Router）
components/     UIコンポーネント
lib/            計算ロジック・ユーティリティ
constants/      定数定義
widgets/        iOSウィジェット
scripts/        生成・検証スクリプト
docs/           設計・企画ドキュメント
tests/          テスト
```

設計方針の詳細は [design.md](./design.md) を参照してください。
