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

自前のバックエンドは持ちません。**アプリのデータ（計算履歴・計算ノート・自作単位・設定）は端末内（AsyncStorage）にのみ保存**し、どこへも送信しません。

ただし端末外と通信するSDKが2つあります。**RevenueCat** は購入の検証（端末生成の匿名IDとレシート情報）に加え、`lib/ad-revenue-tracker.ts` から**バナー広告のロード・表示・開封・収益のイベント**を受け取ります。**AdMob** は広告の配信・計測に端末IDと広告IDを使うことがあります。詳細は `app/privacy-policy.tsx` を参照してください。

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

`pnpm dev` は Expo Web を Expo 既定のポート（`http://localhost:8081`）で起動します。起動後、ブラウザで `http://localhost:8081` を開いてください。

> **Note:** 既に別プロセス（他のアプリやセキュリティソフトなど）がポート 8081 を使用している場合は、`--port` で別のポートを指定してください。引数はそのまま `expo start` へ渡ります。
>
> ```bash
> pnpm dev --port 8082
> ```
>
> **ポート指定を `package.json` に書き戻さないこと。** 以前は `--port ${EXPO_PORT:-8081}` と書いていたが、これは POSIX シェル構文で、**Windows の pnpm は既定で `cmd.exe` を使うため展開されず `pnpm dev` が失敗する**（`shellEmulator` を有効にしていない限り）。Expo の既定ポートが 8081 なので、指定を外しても挙動は変わらない。

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
