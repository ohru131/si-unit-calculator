# Unit Calculator — Global Launch Kit（Android向けに更新）

**旧版は「初回リリースはen/ja 2言語」「App Store and/or Google Play」「Pro=ad-free/CSV/personal unit set」という前提だったが、いずれも現状と食い違っていた。** 6言語対応は既に実装済み、今回の提出対象はGoogle Playのみ、Proの特典は4点（ノート共有／PDF書き出しが抜けていた）。本節はその前提で更新した。詳しいストア掲載文・チェックリストは以下を参照:

- 6言語のストア掲載文（短い説明・詳しい説明）: `docs/store-listing-copy.md`
- Android固有の提出要件: `docs/android-submission-checklist.md`
- 本ドキュメントは、上記2つに入りきらない**国際展開・ローカライズの一般的な方針**を残す場所として位置づける。

## 製品ポジショニング

**Unit Calculator** は、学生・エンジニア・メーカー・現場スタッフ向けのオフラインファーストな次元計算アプリ。式をまずSI単位に正規化してから計算し、次元を検証したうえで、ユーザーが選んだ互換単位で結果を表示する。**6言語（en/ja/es/pt-BR/de/fr）に対応済み**（`lib/i18n.ts`の`APP_LANGUAGES`が唯一の情報源。CLAUDE.md「直近の作業履歴」7〜9番で実装・PR #21〜#23でマージ済み）。

差別化要素は次の3点（`docs/market-research-2026-09.md`第2節）:
1. 単位付きの数式をそのまま計算し、次元不一致をエラーとして検出する
2. 112件のプリセット計算ノート（KaTeXによる本物のLaTeX数式表示）
3. ユーザー定義単位・単位比較表・進数といった、単なる「単位換算」を超えた計算機能

## 英語ストア掲載ドラフト（詳細は `docs/store-listing-copy.md` を参照）

| 項目 | 内容 |
|---|---|
| App name | Unit Calculator |
| Short description | `docs/store-listing-copy.md`の短い説明（英語73字）を参照 |
| Full description | 同ドキュメントの詳しい説明（英語、6言語すべて掲載済み） |

## 国際化チェックリスト

| 領域 | 現状 | 次のアクション |
|---|---|---|
| アプリ内言語 | **en/ja/es/pt-BR/de/fr の6言語対応済み**（UI・単位名・エラーメッセージ・プリセット計算ノート112件すべて翻訳済み） | さらに言語を増やすかは`CLAUDE.md`「次にやりそうなこと」を参照（`ko`/`zh-Hant`/`id`が次候補、未着手） |
| 単位系プリセット | 設定画面に「メートル法／米国慣用単位／英・帝国単位」の切替がある（`lib/global-settings.tsx`の`systemMetric`/`systemUS`/`systemUK`）。主にレシピ系ノートのカップ・大さじ等の定義（`standardUS`等）に影響する小さめの機能 | ストア掲載文の主要訴求としては優先度を下げ、6言語対応・計算ノート・単位比較・ユーザー定義単位・進数を優先する（文字数上限もあるため） |
| ストアメタデータ | 6言語の掲載文は`docs/store-listing-copy.md`に用意済み。スクリーンショットは日英2言語のみ撮影し、他4言語には英語版を流用 | `docs/screenshot-capture-plan.md`の指示に沿って撮影する。Play Console側での多言語ストア掲載の登録手順はGoogle公式ヘルプ[1]を参照 |
| サポート | 現状、実在の問い合わせ先が無い（旧版は`support@example.com`というダミー） | `docs/shipaton-submission-kit.md`の「提出前に差し替えが必要な箇所」を参照し、実在のメールアドレスを用意する |
| プライバシー | 現状、公開URLでホストされたプライバシーポリシーが無い | 同上ドキュメントのプライバシーポリシー・ドラフトを、実在の情報で完成させて公開URLでホストする |
| 価格設定 | **買い切り（非消費型）1本、サブスクなし**（`docs/market-research-2026-09.md`第4節。電卓ジャンルはサブスクへの反発が突出して強いという調査結果に基づく） | RevenueCatのローカライズ済み購入シート（`product.priceString`をそのまま表示、自前で通貨記号を組まない）と、Play Console側の地域別価格設定に任せる |

## プライバシーと問い合わせ先のドラフト

> Unit Calculator stores saved constants, custom units, notebooks, and calculation history locally on the device. Purchase status is processed by RevenueCat and Google Play. Banner ads are served via Google AdMob. The app does not require an account and does not upload your calculation content to our servers.
>
> **公開前に、実在の法人・個人情報、削除依頼の連絡先を反映した本物のプライバシーポリシーに差し替え、公開URLでホストすること。** 詳細は `docs/shipaton-submission-kit.md` の「提出前に差し替えが必要な箇所」を参照。

## アクセシビリティ確認

主要な操作に説明的なラベルを使い、OSの文字サイズ設定を尊重する設計になっている。公開前に、Android TalkBackで以下を確認すること: 言語選択、単位系選択、計算、単位変換、単位比較表、ユーザー定義単位の登録、購入、復元、CSVエクスポート、ノート共有（PDF書き出し）。大きい文字サイズでもタップ対象が使えること、色だけで値を伝えていないことも確認する。

## 参考URL

[1]: https://support.google.com/googleplay/android-developer/answer/9844778?hl=en "Google Play Console Help — Translate and localize your app"
