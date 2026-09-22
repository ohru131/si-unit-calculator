---
name: release
description: UnitCalc の正式バージョンアップを通しで行う。main の最新化・実機での動作確認・バージョン採番・ローカルの署名済み AAB ビルド・コミット/タグ/push・Play へのアップロード・掲載情報（文言とスクショ）の反映まで。「リリースして」「バージョン上げて」「Play に出して」「AAB 作って」と言われたとき、およびリリース作業の一部（掲載画像だけ反映したい等）を頼まれたときに使う。
---

# リリース手順（UnitCalc / si-unit-calculator）

**このリポジトリのリリースは「タグを打つこと」ではなく「Play にビルドが乗ること」で完了する。** 両者を混同しない（v1.3.0 で実際にずれた）。

所要時間の目安: デバッグビルド **約10分**、リリース AAB のフルビルド **約20分**。合わせて1時間弱みておく。

## 道具

`scripts/release.mjs`（`pnpm release:<cmd>` のエイリアスあり）が AAB・トラック・リリースノートを担当する。**掲載情報（タイトル・説明・スクショ）は別系統で `scripts/push-play-listing.mjs`。**

| コマンド | すること |
|---|---|
| `check` | 宣言・build.gradle・AAB の実物・リリースノート・Play の実測を突き合わせる（既定） |
| `notes` | `docs/release-notes/vX.Y.Z/` に雛形を作る（`--from-play` で前版を下敷きに） |
| `build` | `prebuild` + `gradlew bundleRelease` |
| `pack` | `release/vX.Y.Z/` に AAB・checksums・ノート・SUMMARY.md を集める（gitignore 済み） |
| `upload` | Play へ上げる。**既定はドライラン**、`--validate` は読むだけ、`--commit` で実行 |
| `ship` | `check` → `build` → `pack` を通しで |

---

## 0. 着手前に必ず見る

```bash
git status --short          # 未コミットの変更が無いか
git log --oneline -3
ListAgents                  # 同じディレクトリで動いている別セッションが無いか
```

- **作業ツリーに身に覚えのない変更があったら、まず誰の変更かを確かめる。** このリポジトリは同じフォルダで複数セッションが動くことがあり、実際に v1.6.0 のとき別セッションが `scripts/release.mjs` を作りかけていた。**他人の途中の作業をリリースコミットに巻き込まない**（コミット範囲を分けるか、利用者に確認する）。
- `.env` / `credentials.json` / `play-service-account-unitcalc.json` / `android/` / `credentials/` は **すべて gitignore 対象**。fast-forward やチェックアウトでは壊れないが、`git clean -xdf` は絶対に打たない。

---

## 1. main を最新化

```bash
git fetch origin --prune
git log --oneline main..origin/main     # 何が入ってくるか見る
git merge --ff-only origin/main
```

`--ff-only` にすること（ローカルに未push のコミットがあれば止まる＝取りこぼしに気付ける）。

**依存が変わったかを確認する。** 変わっていれば `pnpm install`:

```bash
git diff --stat <前のHEAD>..HEAD -- package.json pnpm-lock.yaml
```

---

## 2. 基準値の確認

```bash
npx tsc --noEmit      # 0エラー（環境によっては @/global.css の1件だけ出る）
npx vitest run        # 全pass（.env があれば revenuecat の2件も通る）
npx expo lint         # 2エラー・0警告（app/(tabs)/index.tsx の既存分のみ）
```

**この数字から増えていたら自分の変更のせい。** 基準値の詳細は `CLAUDE.md` の「現在の基準値」。

---

## 3. 実機で動作確認

```bash
adb devices -l
adb shell dumpsys package com.app.siunitcalculator | grep -E "versionName|versionCode"
```

### 必ずデバッグビルド（`.debug`）で確認すること

**リリース APK を端末へインストールしない。** Play 版は Google の署名鍵、ローカルの release は upload key で署名されるので署名不一致になり、`expo run:android --variant release` が「アンインストールして入れ直すか」と聞いてくる。承諾すると **利用者の計算ノート・履歴・自作単位が全部消える**。デバッグ版は `applicationId` に `.debug` が付く（`plugins/withDebugPackageSuffix.js`）ので Play 版と共存する。

```bash
cd android && ./gradlew.bat installDebug --console=plain    # 約10分
```

### Metro は 8082 で起動する

**この端末は McAfee の `macmnsvc.exe` が TCP 8081 を占有している。** 8081 で `expo start` すると bind 自体は通るのに接続がリセットされ、「Metro は動いているのに繋がらない」という分かりにくい形で詰まる。

```bash
netstat -ano | grep ":8081"        # 占有プロセスの確認
npx expo start --port 8082 &
adb reverse tcp:8081 tcp:8082      # アプリが叩く先
adb reverse tcp:8082 tcp:8082      # dev-client の一覧に出る URL が localhost:8082 なので両方要る
```

### アプリを開く

ディープリンク（`manussiunitcalculator://expo-development-client/?url=...`）は Play 版と候補が衝突して選択ダイアログが出たり、`loadJSBundleFromAssets` に落ちて "Unable to load script" になったりする。**確実なのは dev-client のホームから開く方法**:

```bash
adb shell monkey -p com.app.siunitcalculator.debug -c android.intent.category.LAUNCHER 1
adb exec-out screencap -p > /tmp/s.png      # スクショを読んで「Recently opened」の行をタップ
adb shell input tap <x> <y>
```

### 見る項目

- 起動して電卓画面が出る／前回の式が復元される
- キーパッドで計算できる（`12÷3 → 4` 程度でよい）・AC が効く
- 単位レール・接頭語キー・結果カードのチップが出る
- 計算ノートを1つ開き、**KaTeX の数式が描画され結果の数値が正しい**
- 広告バナーが出る（AdMob が生きている）
- **そのリリースで入った変更が実際に画面に出ているか**（CHANGELOG の `[Unreleased]` を見て確認する）

`[RevenueCat] Error fetching offerings` の赤い帯はデバッグ版では正常。`.debug` の applicationId が Play の商品として存在しないため。

確認できたら Metro を止める（ポートを掴んだままだと次のビルドと紛らわしい）。

---

## 4. 次のバージョンを決める

**versionCode は推測しない。Play に問い合わせる。**

```bash
node scripts/release.mjs check          # 使用済み versionCode と各トラックの配信状況を実測して出す
```

`scripts/release.mjs` が無い場合は `play-service-account-unitcalc.json` で `androidpublisher` の `edits.create` → `edits.bundles.list` / `edits.tracks.list` を読み、**edit は commit せず DELETE する**（読むだけで何も変わらない）。JWT の組み方は `scripts/push-play-listing.mjs` の `getAccessToken` を流用する。

- `version`（利用者に見える番号）は手で決める。機能追加があれば minor、修正だけなら patch。
- `versionCode` は **Play で未使用の最小の値**。Play が要求するのは単調増加だけ。
- 「タグを打っただけ」「AAB を作っただけ」は**出したことにならない**。使用済みかどうかは Play にしか記録が無い。

---

## 5. バージョンを上げる

3ファイルを同時に直す。**1つでも漏らすと、Play のアップロードで弾かれるまで気付けない。**

| ファイル | 直す場所 |
|---|---|
| `package.json` | `"version"` |
| `app.config.ts` | `version:` と `android.versionCode:` |
| `CHANGELOG.md` | `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD`、末尾のリンク定義に `[X.Y.Z]` を足し `[Unreleased]` の compare 元を更新 |

```bash
sed -i 's/^  "version": "1\.5\.0",$/  "version": "1.6.0",/' package.json
sed -i 's/^  version: "1\.5\.0",$/  version: "1.6.0",/' app.config.ts
sed -i 's/^    versionCode: 6,$/    versionCode: 7,/' app.config.ts
sed -i 's/^## \[Unreleased\]$/## [1.6.0] - 2026-09-22/' CHANGELOG.md
# 末尾のリンク定義も忘れずに（[Unreleased] の compare 元を新バージョンへ、[X.Y.Z] の行を追加）
```

`CHANGELOG` の中身は各PRが `[Unreleased]` に積んだもの。**リリース時に書き足さない**（書くべきことがあるならPRの側で直す）。

---

## 6. ネイティブへ反映してビルド

```bash
npx expo prebuild -p android      # android/ を作り直す（versionCode/versionName が入る）
cd android && ./gradlew.bat bundleRelease --console=plain    # 約20分
```

または `node scripts/release.mjs build`（`prebuild` + `bundleRelease` を通しでやる）。

- **`expo prebuild` は android/ を丸ごと消して作り直す**（"Clearing android"）。ビルドキャッシュ（`.cxx` / `build`）も消えるのでフルビルドになる。これは想定どおり。
- `android/keystore.properties` は `plugins/withLocalReleaseSigning.js` が `credentials.json` から毎回生成する。**手で書かない。**
- `credentials.json` が無いと release はデバッグ鍵で署名され、Play に弾かれる。

成果物: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 7. AAB を実物で検証

`node scripts/release.mjs check` が全部やる。手でやるなら:

```bash
AAB=android/app/build/outputs/bundle/release/app-release.aab
sha1sum "$AAB"                                        # タグのメッセージに書く値
"$JAVA_HOME/bin/keytool" -printcert -jarfile "$AAB" | grep SHA1     # ↓と一致すること
KS=$(grep '^storeFile=' android/keystore.properties | cut -d= -f2-)
"$JAVA_HOME/bin/keytool" -list -v -keystore "$KS" -storepass "$(grep '^storePassword=' android/keystore.properties | cut -d= -f2-)" -alias "$(grep '^keyAlias=' android/keystore.properties | cut -d= -f2-)" | grep SHA1

MM=android/app/build/intermediates/merged_manifest/release/expoReleaseOverrideMaxSdkConflicts/AndroidManifest.xml
grep -o 'android:versionCode="[0-9]*"\|android:versionName="[^"]*"' "$MM" | head -2
grep -o '<uses-permission' "$MM" | wc -l               # 13
grep -c 'SYSTEM_ALERT_WINDOW' "$MM"                    # 0 でなければならない
```

- **権限は13個**（1.2.0 以降の実測値。内訳は `CLAUDE.md` の「権限の実測値」）。増えていたら依存が権限を持ち込んでいる＝Play Console のデータセーフティで説明が要る。
- **`SYSTEM_ALERT_WINDOW` が 0 であること。** `plugins/withoutReleaseOverlayPermission.js` が release からだけ外している。
- 署名証明書が upload key と一致すること（不一致ならデバッグ鍵で署名されている）。

---

## 8. コミット・タグ・push

```bash
git add CHANGELOG.md app.config.ts package.json
git commit -m "Release vX.Y.Z"
git push origin main                                   # ← ブランチを先に
git tag -a vX.Y.Z -m "Release vX.Y.Z

Google Play AAB SHA-1: <sha1を大文字で>"
git push origin vX.Y.Z                                 # ← タグは別に push される
```

- **`git push origin vX.Y.Z` はタグだけを送る。ブランチの push は別に要る。** v1.3.0 で忘れて「タグは 1.3.0 なのに main は 1.2.0」が2日間残った。`git log origin/main..main` が空であることを確認してからタグを打つ。
- **タグのメッセージに AAB の sha1 を書く。** Play の `edits.bundles.list` が返す sha1 と突き合わせれば「Play にあるのはこのコミットのビルドか」が後から確定できる。
- **`gh` の active アカウントを確認する。** この端末には `katahimo-dev` と `ohru131` があり、**active が `katahimo-dev` だと push が 403 になる**（`Permission to ohru131/si-unit-calculator.git denied`）。credential helper が gh なので gh の active がそのまま効く。

```bash
gh auth status
gh auth switch --hostname github.com --user ohru131
# …作業…
gh auth switch --hostname github.com --user katahimo-dev    # 終わったら戻す
```

- 他人の作業が作業ツリーに混ざっているときは、**そのファイルを staging から外して自分の変更だけコミットする**。1ファイルの中で同居している場合は HEAD の内容に自分の変更だけ当てた blob を index に載せる:

```bash
git show HEAD:package.json > /tmp/pkg.json
sed -i 's/"version": "1.5.0"/"version": "1.6.0"/' /tmp/pkg.json
git update-index --cacheinfo 100644,$(git hash-object -w /tmp/pkg.json),package.json
```

---

## 9. リリースノート

`docs/release-notes/vX.Y.Z/<Playの掲載言語>.txt` に**7ロケール**置く: `en-US` / `ja-JP` / `es-ES` / `es-419` / `pt-BR` / `de-DE` / `fr-FR`。

```bash
node scripts/release.mjs notes        # 雛形を作る（--from-play で Play にある前版を取り込む）
```

- **500字上限**（`check` が数える）。
- 中身は CHANGELOG の該当節の要約。**機能の羅列ではなく「利用者にとって何が変わったか」**を1〜3文で。既存の `docs/release-notes/v1.5.0/` が長さと粒度の見本。
- **機械翻訳を素通ししない。** 訳語は `docs/i18n-glossary.md` に合わせる（独 `Spannung` は応力とも電圧とも読めるので文脈に注意、独のダッシュは `–`、西の電圧は `voltaje` など）。
- `es-419` は `es-ES` と同文でよい（掲載文と違い、ノートは市場差を付けていない）。

---

## 10. Play へ AAB を上げる

```bash
node scripts/release.mjs upload                                   # ドライラン（通信しない）
node scripts/release.mjs upload --validate --key play-service-account-unitcalc.json   # Play を読むだけ
node scripts/release.mjs upload --commit  --key play-service-account-unitcalc.json    # 実行
```

- **必ず ドライラン → `--validate` → `--commit` の順で確かめる。** AAB は一度送ると versionCode が使用済みとして残りうるので、「お試しで送る」は存在しない。
- 既定は **alpha トラック / status completed**。本番へ出すなら `--track production` を明示する（**利用者の判断を仰ぐこと**）。
- `check` に NG があると `--commit` は通らない。`--force` はあるが、**NG の中身がリリースと無関係だと確認できたときだけ**使う（例: 他セッションの未コミット変更）。
- 上げたあと、Play を読み直して `alpha: UnitCalc X.Y.Z [versionCode]` と sha1 がタグのメッセージと一致することを確認する。

---

## 11. 掲載情報（文言・スクショ・図版・アイコン）を反映

AAB とは**別系統**。スクショや掲載文が変わった PR が入っているときだけ実行すればよい。

```bash
node scripts/push-play-listing.mjs                                         # ドライラン
node scripts/push-play-listing.mjs --validate --key play-service-account-unitcalc.json
node scripts/push-play-listing.mjs --commit  --key play-service-account-unitcalc.json
```

情報源は `docs/store-listing-copy.md`（文言）と `submission-assets/README.md`（言語ごとの8枚とその順）。**スクリプトに数字や文言を書かない。**

スクショ自体を撮り直すなら `node scripts/capture-submission-assets.mjs`、図版は `node scripts/generate-feature-graphic.mjs`。

---

## 12. 後片付け

- `gh auth switch` で元の active アカウントへ戻す
- `adb reverse --remove-all`
- GitHub Release を作るなら（過去版は全部作ってある）:

```bash
gh release create vX.Y.Z --verify-tag --title "vX.Y.Z" --notes-file docs/release-notes/vX.Y.Z/ja-JP.txt
```

**本文は `--notes-file` で渡す**（`--notes` にヒアドキュメントを渡すと改行が `\n` の literal で入る。v1.0.0 が実際にそうなっている）。**AAB は添付しない**（公開リポジトリ。Play Console が全版を保持している）。

---

## 過去に踏んだ落とし穴（再発防止）

| 症状 | 原因 | 対処 |
|---|---|---|
| Metro に繋がらない（`UND_ERR_SOCKET`） | McAfee `macmnsvc.exe` が 8081 を占有 | 8082 で起動し `adb reverse` を2本 |
| `git push` が 403 | `gh` の active が `katahimo-dev` | `gh auth switch --user ohru131`、終わったら戻す |
| タグはあるのに main が古い | `git push origin <tag>` はタグしか送らない | ブランチを先に push し `git log origin/main..main` が空を確認 |
| Play のアップロードが弾かれる | `app.config.ts` の `versionCode` 上げ忘れ / prebuild し忘れ | `android/app/build.gradle` の値を確認（`check` が拾う） |
| デバッグビルドが「Unable to load script」 | dev-client がディープリンクを取りこぼし assets から読もうとした | dev-client のホームから「Recently opened」をタップ |
| 実機の利用者データが消えかける | release APK を Play 版に上書きインストール | 確認は必ず `.debug` で |
| 掲載文と実機の食い違い | 資料は機能追加のたびに黙って陳腐化する | 掲載文を触るときは `git log -- docs/<file>` で書かれた時点を出し、そこから入った PR を数え上げる |
