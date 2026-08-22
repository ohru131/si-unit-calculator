# Shipaton 2026 調査メモ

## 公式サイトで確認した事項

2026年8月22日確認。Shipaton 2026はRevenueCatによる、実際のアプリを実際のストアへ公開する開発者向けグローバル・ハッカソンである。公式サイトは一般参加者について「real apps to real stores」を前提にしている。

| 項目 | 確認内容 | 出典 |
|---|---|---|
| 開催趣旨 | 実アプリを実ストアへ公開すること | https://shipaton.com/ |
| 賞の方向性 | トラクション・成長、公開過程、デザイン、収益化、社会的インパクトなど | https://shipaton.com/ |
| Next Gen | 学生限定。動画とオープンソースコードを提出し、Apple/Googleの有料開発者アカウント要件を除外する特別部門 | https://shipaton.com/ |
| 詳細ルール | Devpostの公式ルールを確認する必要がある | https://revenuecat-shipaton-2026.devpost.com/ |

## Devpostの概要ページで確認した事項

Devpostの公式概要ページには、賞金総額が74万ドルであること、モバイル・デザイン・ゲーム・RevenueCatを主要テーマとしていること、公式のRules・Schedule・Resourcesへの導線が示されている。正式な適格性・提出物・締切の判断は、同ページのRules本文を根拠にする。

| 項目 | 確認内容 | 出典 |
|---|---|---|
| 賞金総額 | 74万ドル | https://revenuecat-shipaton-2026.devpost.com/ |
| 評価テーマ | RevenueCat、デザイン、ゲーム、モバイル、App Growth Annual | https://revenuecat-shipaton-2026.devpost.com/ |
| 公式導線 | Rules、Schedule、ResourcesをDevpost上で提供 | https://revenuecat-shipaton-2026.devpost.com/ |

## Devpost公式ルールで確認した一般部門の必須要件

| 項目 | 公式要件 | 現アプリの状況 |
|---|---|---|
| 提出期間 | 2026年7月31日8:00 PDTから9月30日23:45 PDTまで | 締切前の公開計画が必要 |
| 対象プラットフォーム | iOS、iPadOS、macOS、またはAndroid | ExpoプロジェクトとしてAndroid/iOSへの展開余地はあるが、ストア用ビルドは未実施 |
| 新規公開 | 対象アプリの最初の公開版を提出期間内にApp Store、Google Play、またはSamsung Galaxy Storeへ公開 | 未実施。既公開アプリの更新は対象外 |
| RevenueCat | RevenueCat SDKで少なくとも1つのアプリ内／Web購入を提供、またはRevenueCat Adsを利用 | 未実装 |
| 審査用アクセス | 米国内からダウンロード可能。プレミアム機能がある場合は無料トライアルまたはプロモコードが必要 | ストア公開・課金アクセス設計とも未実装 |
| Devpost提出 | 英語の機能説明、2分以内の公開YouTube/Vimeoデモ動画、ストアURL、1024px正方形アイコン、1179x2556px（端末枠なし）のスクリーンショット1枚以上 | アプリアイコンはあるが、英語提出物・公開動画・指定スクリーンショット・ストアURLは未準備 |
| 正常動作 | 提出動画・説明どおりに継続してインストール・起動・動作すること | 計算エンジンの自動テストはあるが、実機・ストア配布での検証は未実施 |
| 知的財産 | 応募者が権利を保有し、第三者権利を侵害しないこと | GitHubは作成済み。使用アセットとライセンスの整理が必要 |
| 提出言語 | 英語、または動画・説明・テスト手順などの英訳を添付 | 日本語UIのため英語の提出文・動画字幕・手順が必要 |

## 賞カテゴリとの適合

現アプリで最も現実的な候補は、完成度とモバイル体験を訴求するRevenueCat Design Award、または計算の正確性と学習・技術用途の社会的価値を強化したRevenueCat Peace Prizeである。Grand PrizeはRevenueCatで計測される提出期間中の収益を基にショートリストが作られるため、公開後の有料化・集客・成長実績が不可欠となる。

出典：

- https://revenuecat-shipaton-2026.devpost.com/rules
- https://revenuecat-shipaton-2026.devpost.com/

## 賞カテゴリ公式ページで確認した事項

RevenueCat Design Awardは、事業性とは別に、革新的な発想、美しいUI、思慮深いインタラクション、アニメーションを評価する。応募には注目してほしい画面・フロー・動きと、それらが製品体験を支える理由を説明する必要がある。RevenueCat Peace Prizeは、個人・地域社会・社会全体への便益、対象ユーザーと問題の重要性、設計によるインパクト、初期の利用・フィードバックなどを重視する。

出典：

- https://www.shipaton.com/categories/revenuecat-design-award
- https://www.shipaton.com/categories/revenuecat-peace-prize

## RevenueCat × Expo 導入時の公式注意点

RevenueCatの公式Expoガイドでは、`react-native-purchases`と`react-native-purchases-ui`を導入し、プラットフォーム別Public SDK Keyで初期化する。実際の購入テストにはExpo Goではなく、`expo-dev-client`を含むExpo development buildとEAS Buildが必要である。RevenueCatダッシュボード側ではストア接続、商品、`pro` entitlement、offering、paywallを構成する。Expo GoではPreview API ModeによりUI・ロジックの確認はできるが、実決済はできない。

CSVなど端末生成ファイルは、iOS/AndroidでFileSystemに書き出してShare Sheetで共有できる。WebではローカルURI共有ができないため、Web上では共有不可または別のエクスポート導線が必要である。

出典：

- https://www.revenuecat.com/docs/getting-started/installation/expo
- https://expo.dev/blog/expo-revenuecat-in-app-purchase-tutorial
- /home/ubuntu/si-unit-calculator_helper/docs/communication/sharing/DOCS.md
- /home/ubuntu/si-unit-calculator_helper/docs/storage/filesystem/DOCS.md

## 現時点での暫定評価

現在のアプリはExpoモバイルプロジェクトとして構成され、計算機能、端末内保存、GitHub公開済みソースを備える。一方、一般部門の中核要件と想定されるストア公開、RevenueCat SDK統合、公開可能なストア用ビルド、登録・提出物、トラクションまたは収益化の設計は未確認または未実装である。
