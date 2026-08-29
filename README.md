# 単位付き電卓 (Unit Calculator)

単位を含む式（例: `5cm + 1mm`）をそのまま計算し、SI基底単位への正規化結果と、任意の出力単位への換算結果を同時に確認できる電卓アプリです。Expo (React Native) 製で、iOS / Android / Web で動作します。

## 主な機能

- `5cm + 1mm` のような単位付き数式の直接計算
- 計算結果のSI標準単位への自動正規化
- 出力単位の切り替え（`cm`, `m`, `%`, `ppm` など）
- `W = 3cm` のような定数（記号）の登録・編集・削除
- 計算履歴の保存
- 掛け算・割り算を含む次元演算（面積・速度など）

## 技術スタック

- [Expo](https://expo.dev/) / [Expo Router](https://docs.expo.dev/router/introduction/)
- React Native + React 19
- NativeWind (Tailwind CSS for React Native)
- tRPC + Express（サーバー）
- Drizzle ORM + MySQL（データ永続化、任意）
- TypeScript / Vitest

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

`pnpm dev` は API サーバー（`http://localhost:3000`）と Expo Web（`http://localhost:8081`）を同時に起動します。起動後、ブラウザで `http://localhost:8081` を開いてください。

> **Note:** Windows 環境で `pnpm dev` がポート解決エラーで失敗する場合は、以下のように API サーバーと Expo をそれぞれ個別に起動してください（`package.json` のデフォルトポート指定 `${EXPO_PORT:-8081}` は POSIX シェル構文のため、環境によっては別途ポートを指定する必要があります）。
>
> ```bash
> # ターミナル1: APIサーバー
> npx tsx watch server/_core/index.ts
>
> # ターミナル2: Expo Web
> npx expo start --web --port 8082
> ```
>
> また、既に別プロセス（他のアプリやセキュリティソフトなど）がポート 8081 を使用している場合は、`--port` オプションで別のポート（例: 8082）を指定してください。

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
| `pnpm build` | サーバーを本番用にビルド |
| `pnpm db:push` | Drizzle でスキーマをマイグレーション |

## 環境変数

`DATABASE_URL` などの環境変数は未設定でもローカル動作を確認できます（データベース未接続時は関連機能が無効化されます）。本番運用や認証機能を使う場合は以下を設定してください（`server/_core/env.ts` 参照）。

| 変数名 | 用途 |
|---|---|
| `DATABASE_URL` | MySQL 接続文字列 |
| `JWT_SECRET` | Cookie 署名用シークレット |
| `OAUTH_SERVER_URL` | OAuth 認証サーバーの URL |
| `OWNER_OPEN_ID` | 管理者ユーザーの OpenID |

## ディレクトリ構成

```
app/            画面（Expo Router）
components/     UIコンポーネント
lib/            計算ロジック・ユーティリティ
constants/      定数定義
server/         API サーバー（tRPC / Express）
drizzle/        DB スキーマ・マイグレーション
docs/           設計・企画ドキュメント
tests/          テスト
```

設計方針の詳細は [design.md](./design.md) を参照してください。
