# 各言語版のターゲット検討（2026-09-08）

`docs/brushup-plan-2026-09.md` 第1節で決めたターゲットは、**メインが日本の国家資格（電験三種・第二種電気工事士・危険物乙4）で、日本限定**だった。
サブ1（理工系大学1〜2年の実験レポート）・サブ2（機械/建築のジュニアエンジニア）は言語非依存だが、
「決定的な瞬間」も掲載文のフックも日本の事情で書かれている。本稿は残り5言語（en / de / fr / es / pt-BR）について
**誰に・どの瞬間に刺すか**を言語ごとに決め直し、あわせて**現在のエンジンがその相手に届いていない箇所を実測**した記録。

## 調査の限界

`brushup-plan` と同じく、egressプロキシで App Store / Google Play / Reddit / 各国の公式統計DB の直接取得は塞がれている。
引用は検索スニペットと二次情報経由で、**[確認]**（ソースに明記）と **[推測]** を区別する。
各国の職業訓練の受験者数は、日本の「電工二種 年20万人」に相当する精度の一次統計まで届かなかったものが多い（第6節）。
一方、**第2節のエンジンの挙動はこのリポジトリで実際に評価した実測値**なので確度が違う。

## 0. 日本限定だったもの／そうでなかったもの

| brushup-plan の記述 | 日本限定か |
|---|---|
| メイン＝電験三種・電工二種・乙4 | **限定**。日本の国家資格そのもの |
| サブ1＝理工系大学1〜2年の実験レポート | 限定でない。6言語すべてに存在 |
| サブ2＝機械・建築のジュニアエンジニア | 限定でない。ただし米国は単位系が違う（第2節） |
| 「試験本番には持ち込めない、JTBDは学習中の検算」 | **限定でない**。米国のFE/PE試験も承認電卓（Casio fx-115/fx-991 全機種、HP 33s/35s、TI-30X/36X 全機種）のみで、プログラム可能な機器・通信可能な機器は不可 [確認] |
| 差別化の一言（単位ごと計算し、桁と次元の間違いを教える） | 限定でない。むしろ仏語・西語の教育現場の言い回しがそのまま一致する（第1節 fr/es） |
| 競合（Soulver 4 / Numbat / Qalculate / CalcNote） | CalcNote・Panecal は日本市場の話。Soulver・Numbat は英語圏 |

## 1. 言語ごとのターゲット

### en（既定言語・US / UK / CA / AU / IN / PH ほか）

**en は2つの別集団に割れる。片方（学生・エンジニア）だけを取りに行く。**

| | 内容 |
|---|---|
| **主ターゲット** | 工学系の学部生と**FE試験（Fundamentals of Engineering）受験者**。FY2023–24 で **53,213人が受験** [確認] |
| 決定的な瞬間 | 宿題・実験レポート・FE対策で SI に揃えきれず桁を落とす。「forgot to change units into SI units」「dividing by 100 instead of 1000」「units are part of the answer, not an optional extra」（brushup-plan の調査より [確認]） |
| 副ターゲット | 英国の電気工事訓練生（City & Guilds 2365 Level 2/3 が事実上の標準ルート。ECS Gold Card・NICEIC/NAPIT 登録に接続する [確認]）。単位系はほぼメートル法なので現エンジンで足りる |
| **取りに行かない** | **米国の建設・電気の職人（journeyman）**。理由は第2節: `3ft + 1/8in` が次元エラーになり、AWG/kcmil も mpg も無い。Construction Master Pro が支配する領域で、現状のエンジンでは会話にならない |
| 収益の見立て | App Store 収益は米国が単独最大（2025年 $20.2B）[確認]。**1件あたりの単価が最も高い市場**なので、買い切りPro の主戦場 |

### de（DE / AT / CH）

| | 内容 |
|---|---|
| **主ターゲット** | 電気系の **Ausbildung**（デュアル職業訓練）の訓練生と、その先の Techniker / Meister 受験者。`Elektroniker` の新規訓練契約は年 **約14,082件**、うち **85%が Fachrichtung Energie- und Gebäudetechnik** ＝電気系で圧倒的に最多の職種 [確認]。IHK の修了試験受験者は全職種で年 247,896人 [確認] |
| 決定的な瞬間 | **Zehnerpotenzen（10のべき）と Vorsatzzeichen（k / m / µ）の変換ミス**。ドイツ語の教材はこれを独立した単元として扱う [確認]。試験・Klausur では **Einheitenfehler そのものが Punktabzug の対象** [確認] |
| 副ターゲット | Physik / Chemie の Klausur・Abitur 対策の高校生、および Ingenieur の手計算チェック（brushup-plan のサブ2） |
| 収益の見立て | 欧州で最大級の収益市場でドイツ・フランスが牽引 [確認]。**広告嫌い・買い切り志向が強く、当アプリの「サブスクなし・買い切り1本」がそのまま訴求になる** [推測] |
| **落とし穴** | `hp` は英馬力(745.7W)しか無い。ドイツ語圏で日常的な **PS はメートル馬力(735.5W)** で1.4%ずれる。`Spannung` が応力と電圧の両義（`docs/i18n-glossary.md` 既出） |

### fr（FR / BE / CH / CA-QC / アフリカ仏語圏）

| | 内容 |
|---|---|
| **主ターゲット** | **lycée の physique-chimie**（seconde〜terminale）と、その延長の prépa / BTS。仏語の教育系記事は「conversion d'unités」を独立した躓きとして扱い、**mL→L の変換漏れで濃度が1000倍ずれる**具体例を挙げる [確認] |
| 決定的な瞬間 | 「単位を**各計算段階に書く**、そうすれば単位が簡約できないときに誤りが目に見える」という指導 [確認]。**これは当アプリがやっていることそのもの**で、教育側の言い回しをそのまま掲載文に使える |
| 副ターゲット | **Bac Pro MELEC / BTS électrotechnique** の電気系職業教育（habilitation électrique に接続）。受験者数の一次統計には届かなかった（第6節） |
| 収益の見立て | ドイツと並ぶ欧州の主要収益市場 [確認] |
| **落とし穴** | **CV（cheval vapeur）もメートル馬力**で `hp` と別物。`mille` は仏語で1000の意もある（用語集既出）。小数点はカンマ（`formatNumberForLocale` に依存済み） |

### es（ES + 中南米）

| | 内容 |
|---|---|
| **主ターゲット** | **EBAU（旧 selectividad）の física 受験者**。単位の誤り・記載漏れは**中間結果・最終結果とも1問につき0.25点の減点**と採点基準に明記される [確認]。「las unidades no son decoración, son parte de la respuesta」[確認] |
| 決定的な瞬間 | 問題文の単位をSIに直し、有効数字3桁で答えるという定型作業 [確認]。**減点が明文化されている＝痛みが金額化されている**ので、6言語で最も訴求文が書きやすい |
| 副ターゲット | FP（Grado Medio/Superior）の `Instalaciones Eléctricas y Automáticas`（電気系FPの標準課程・2000時間）[確認]、および中南米の工学部生 |
| 収益の見立て | 中南米は2025年に25%成長で$20B規模、ブラジル・メキシコが牽引するが**インストール数に対して収益は伸びない** [確認]。→ **広告収益中心＋少数の買い切り**として設計する |
| **落とし穴** | `lib/preset-regional-defaults.ts` の価格プロファイルが6通貨（JPY/USD/EUR/GBP/BRL/MXN）しか無く、**CO・CR・DO・GT・HN・NI・VE は金額だけ言語推測でEURに落ちる**（CLAUDE.md 既知）。電圧は地域表で正しく解決されるので、同じ国で電気と金額の根拠が食い違う |

### pt-BR（ブラジル）

| | 内容 |
|---|---|
| **主ターゲット** | **ENEM / vestibular の受験者**。ENEM 2025 の確定申込は **4,811,338人**（前年比+11.2%）[確認]。単一の試験としては本アプリの全ターゲット中で最大の母数 |
| 副ターゲット | **NR-10**（電気設備の作業に法令上必須の安全講習。低圧は Básico、高圧は SEP が必須）[確認] を受ける電気作業者と、SENAI の técnico em eletrotécnica |
| 収益の見立て | **数は最大・単価は最小**。Google Play のダウンロードはブラジルが世界2位（77億DL・9.4%）[確認]、一方で収益は成熟市場に大きく劣る [確認] |
| 方針 | **ここに買い切りPro を押し込まない**。無料＋広告で母数を取り、Proは「広告が邪魔だと感じた人」だけが買う導線に留める [推測] |
| 落とし穴 | 127V/220V が州で混在（`preset-regional-defaults` で解決済み）。BRLは価格プロファイルにあるので金額は正しく出る |

### ja（既存・再掲）

brushup-plan のまま。電験三種・電工二種・乙4 ＋ 電子工作/DIYソーラー。
App Store の1人あたり支出が世界最高水準の市場 [確認] で、**単価は日本、母数はブラジル**という両極になる。

## 2. 「刺さらない理由」＝現エンジンの穴（このリポジトリで実測）

第1節の判断の根拠。すべて `lib/units.ts` を直接評価して確認した**実測結果**であり、推測ではない。

| 入力 | 現在の出力 | 誰に効くか |
|---|---|---|
| `12ft + 3in` | `12.25 ft` ✅ | en(US/UK) |
| **`3ft + 1/8in`** | **次元エラー**（`1/8in` が `1/(8 in)` ＝ `1/m` に解釈される） | **en(US) 致命的**。分数インチは米国の木工・配管で最も自然な書き方 |
| `3ft+(1/8)in` | `36.125 in` ✅（括弧で回避できる） | 同上（回避策はあるが利用者は気付けない） |
| **`55mi/1gal`** | **`2.33829e+7 1/m²`** | en(US) / de / fr。燃費の単位（mpg・L/100km・km/L）が無く、逆面積として出る |
| **`#14AWG`** | エラー | en(US) 電気工事。AWG/kcmil が無く、NEC の導体計算に届かない |
| `1hp` | `0.7457 kW`（英馬力のみ） | de(PS) / fr(CV) が **1.4%ずれた値を黙って返す** |
| `72°F` → °C | `22.222 °C` ✅ | en(US) |
| `30psi` → bar | `2.0684 bar` ✅ | en(US/UK) |
| `100W*3h` → kWh | `0.3 kWh` ✅ | 全言語 |
| `120V/12Ohm` | `10 A` ✅ | en(US) / pt-BR(127V) |

**設定の不整合も1件見つかった。**
`lib/global-settings.tsx` の `defaultUnitSystem` は端末の**ロケール**（`measurementSystem` / `regionCode`）から metric/us/uk を決めているのに、
`defaultMeasuringStandard` は **言語**から決めている（`ja` なら jis、それ以外は一律 us）。
このため**英国・豪州・アイルランドの英語ユーザーの計量カップが米国式(240mL)になる**。
同じ「地域で決まるもの」を片方はロケール・片方は言語から引いているので、揃える価値がある。

## 3. 着手の優先順位

「市場規模 × 支払い意欲 × **現エンジンとの適合** × 追加実装コスト」で並べた。
上位3つは**コードを1行も足さずに掲載文だけで取りに行ける**のが要点。

1. **de** — 適合度が最も高い。完全メートル法、SI接頭語の痛みが教材レベルで言語化されている、Einheitenfehler が減点として制度化されている、WTPが高く買い切り志向。**実装追加はほぼ不要**（PS を足すなら小さい）。
2. **en（学生・エンジニア）** — FE受験者5.3万人/年と英国 C&G。SIで足りる。単価が最大。
3. **fr** — lycée の physique-chimie。教育側の言い回しがアプリの主張と一致するので掲載文が書きやすい。SIで足りる。
4. **es** — EBAUの0.25点減点という明文化された痛み。母数は大きいが収益は広告寄り。中南米の価格プロファイルの穴を塞ぐと整合する。
5. **pt-BR** — 母数最大・単価最小。広告設計として扱う。
6. **en（米国の職人）** — `3ft + 1/8in`・AWG・mpg の3つを入れて初めて土俵に乗る。**独立したPRとして切る**か、やらないと決める。

## 4. 掲載文のフック案（言語ごと）

`docs/store-listing-copy.md` の短い説明は**80字上限で6言語そろえる**必要がある（CLAUDE.md 既出）。以下は長い説明の先頭ブロック用の1行。

- **ja**: 単位ごと計算、桁ミスをゼロに。電験・電工・物理レポートの検算に。
- **en**: Type `12V/4.7kΩ`, get `2.55 mA`. It refuses `m + kg`.
- **de**: Der Taschenrechner, der mit Einheiten rechnet – und Einheitenfehler findet, bevor die Klausur sie findet.
- **fr**: La calculatrice qui garde les unités à chaque étape : si elles ne se simplifient pas, l'erreur devient visible.
- **es**: Las unidades no son decoración: son parte de la respuesta. Calcula con ellas y detecta el error de conversión.
- **pt-BR**: Calcule com as unidades juntas. `12V / 4.7kΩ` dá `2,55 mA`, e `m + kg` ele se recusa a somar.

検索語も言語ごとに違う（`Einheitenrechner` / `convertisseur d'unités` / `calculadora con unidades` / `calculadora de unidades`）ので、
ASOのキーワードは英語からの直訳にしないこと。

## 5. 実装への含意（すぐ効く順）

| 優先 | 変更 | 対象 |
|---|---|---|
| P0 | 計量カップの既定（`defaultMeasuringStandard`）を**言語ではなくロケール**から決める。`defaultUnitSystem` と同じ手掛かりを使う | `lib/global-settings.tsx` |
| P0 | 掲載文・ASOキーワードを言語ごとに書き分ける（第4節）。英語からの直訳をやめる | `docs/store-listing-copy.md` |
| P1 | **PS / CV（メートル馬力 735.5W）を単位として追加**。`hp` と別記号なので既存の解決順を壊さない | `lib/units.ts` |
| P1 | 燃費の単位グループ（`km/L`・`L/100km`・`mpg`）と、地域別の `targetUnit`。CLAUDE.md の既知課題（式ごと地域で変える必要がある）と同じ話 | `lib/units.ts`, `lib/preset-regional-defaults.ts` |
| P1 | 中南米・台湾の価格プロファイル（CO/CR/DO/GT/HN/NI/VE/TW）。電気は解決済みなので金額だけ | `lib/preset-regional-defaults.ts` |
| P2 | **分数インチ**: `3ft + 1/8in` を通す。ただし `unitSuffixEnd` の貪欲マッチ（CLAUDE.md）に触るので、評価器と `lib/unit-input.ts` の両方に同時に効く形でしか触らない | `lib/units.ts`, `lib/unit-input.ts` |
| P2 | AWG / kcmil。米国の職人を取りに行くと決めた場合のみ | `lib/units.ts` |

### 実装済み（2026-09-08）

第5節のP0・P1に加えて、**サンプルと計算ノートを言語ごとのターゲットに合わせて並べ替える**ところまで実装した。

- `lib/locale-relevance.ts` — 言語 → 先頭に持ち上げるIDの列。サンプルのカテゴリタブ・カテゴリ内のサンプル・
  計算ノートのカテゴリカード（最上位と子の両方）・ノート編集シートのカテゴリピッカーに効く。**書くのは先頭に出したいIDだけ**で、
  書かなかったものは元の順のまま後ろに続く。並べ替えは表示のときだけで、`SAMPLE_CALCULATIONS` と
  `PRESET_NOTEBOOK_CATEGORIES` の配列そのものは言語に依らない正順のまま（後者はプリセット投入の順を決めるため）。
- 追加したサンプル6件（`lib/sample-calculations.ts`）: `imperial-to-si`（en・FE / C&G）、`psi-to-kpa`（en）、
  `metric-horsepower`（de の PS・fr の CV）、`voltage-drop`（de / ja / pt-BR の電気系）、
  `gravity-field`・`coulomb-force`（es の EBAU・pt-BR の ENEM・fr の lycée・de の Klausur）。
- **`exam` カテゴリに置くのは「試験のための計算」そのものだけ**にした（2026-09-08）。`exam` のラベルは
  言語ごとに現地の試験名になり、**日本語版だけは「試験対策（電験・電工）」と電気の資格に限定される**ので、
  `kmh-to-ms`・`gravity-field`・`coulomb-force` のような一般物理を入れるとタブ名と中身が食い違っていた。
  この3件は `motion`・`mechanics` へ移し、拾わせたい言語（es / pt-BR / fr / de）では
  `SAMPLE_CATEGORY_RELEVANCE` でそのタブを上位に置いて補っている。**サンプルはカテゴリを1つしか持てない**ので、
  「どの言語でも通る分野のタブに置き、並べ替えで各言語のターゲットに寄せる」のが唯一の解になる。
- 追加した計算ノート4件: `electricity-basics` に「電圧降下と必要な電線の太さ」「変圧器の巻数比」
  「モーターの効率・損失・線電流」、`physics-electricity` に「点電荷の電場と電位」。
  前3件は Ausbildung Elektroniker / 電工二種・電験 / C&G 2365 / NR-10 / FP Instalaciones Eléctricas が
  そろって扱う計算で、電圧降下のノートは `regionalDefault: "mainsVoltage"` を使うので
  **100V の地域では 2.5mm² が3%制限に落ちる**（＝計算する意味が出る）ようになっている。

**投入済みカテゴリのシードを足しても既存インストールには届かない**（CLAUDE.md の既知の制約）ので、
上記4件のノートが見えるのは新規インストールのみ。並べ替えは表示側なので既存インストールにも効く。

**P2の2件は「米国の職人を取る」という決定とセット**で、単体では入れない。エンジンの守備範囲が広がるほど
「単位を厳密に扱う」という中核の保証が薄まる（CLAUDE.md の `B`（バイト）を足さない判断と同じ理由）。

## 6. 未確認事項（次に調べるならここ）

- **fr**: Bac Pro MELEC / BTS électrotechnique の在籍者数。Onisep・RERS の一次統計に届かなかった。
- **es**: FP `Instalaciones Eléctricas y Automáticas` の全国在籍者数。教育省の統計ポータルに届かなかった。
- **en**: 米国の電気工事見習いの人数（BLSの apprenticeship 統計）。FE受験者数は取れたが職人側は取れていない。
- **de**: Techniker / Meister の受験者数（IHK全職種247,896人の内訳は有償のPDF）。
- 全言語共通: **ストアレビューの直接取得ができない**ので、「その言語のユーザーが電卓アプリに何を不満に思っているか」は
  日本語（Panecal の広告・CalcNoteのサブスク化）ほどの解像度が無い。ここが埋まると掲載文の精度が上がる。

## 参考にした情報源

- FE試験の受験者数・承認電卓: [NCEES FE exam](https://ncees.org/exams/fe-exam/) / [FE Approved Calculators (2026)](https://examcalculatorguide.com/exam/fe/)
- 米国 journeyman 試験の計算範囲: [Journeyman Electrician Exam Prep: Calculations You Must Know](https://expertce.com/learn-articles/journeyman-electrician-exam-calculations/)
- 英国 City & Guilds 2365: [C&G 2365 Level 2 & 3 Diploma in Electrical Installations](https://www.sparkyfacts.co.uk/C&G_2365_Introduction.php)
- ドイツの訓練統計: [IHK-Ausbildung: Zahlen, Daten und Fakten 2025](https://www.dihk.de/de/serviceportal/qualifizierung/ihk-ausbildung-zahlen-daten-und-fakten-2025-158510) / [beliebteste Ausbildungsberufe 2025](https://www.profiling-institut.de/ranking/beliebteste-ausbildungsberufe-2025/) / [BIBB 職業プロフィール](https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/xsw478)
- ドイツの単位・Zehnerpotenzen 指導と減点: [Umrechnen von Einheiten (Kippels)](https://dk4ek.de/lib/exe/fetch.php/einheiten.pdf) / [Punktabzug für Einheitenfehler?](https://www.gutefrage.net/frage/punktabzug-fuer-einheitenfehler)
- 仏語の単位変換指導: [Les erreurs fréquentes en physique-chimie](https://www.antibes-formations.fr/les-erreurs-frequentes-en-physique-chimie-et-comment-les-eviter/) / [80 mL en L pour la chimie au lycée](https://www.ker-expo.fr/80ml-en-l-pour-la-chimie-au-lycee-rappel-des-bases-incontournables/) / [Bac Pro MELEC (éduscol STI)](https://sti.eduscol.education.fr/formations/bac-pro/bac-pro-metiers-de-lelectricite-et-de-ses-environnements-connectes-melec)
- 西語のEBAU減点: [Errores en la EBAU y cómo evitarlos](https://examflow.app/blog/errores-ebau-como-evitarlos) / [Cambio de unidades por factores de conversión. EBAU（Junta de Castilla y León）](https://www.educa.jcyl.es/crol/es/educacion-inclusiva/cambio-unidades-factores-conversion-ebau) / [FP Instalaciones Eléctricas y Automáticas（Ministerio de Educación）](https://www.educacionfpydeportes.gob.es/fpadistancia/oferta-formativa/oferta-formativa-ciclos/electricidad-electronica.html)
- ブラジル: [Enem 2025: mais de 4,8 milhões de inscritos confirmados（MEC）](https://www.gov.br/mec/pt-br/assuntos/noticias/2025/julho/enem-2025-mais-de-4-8-milhoes-de-inscritos-confirmados) / [NR-10 SENAI](https://curtaduracaosenaiba.com.br/curso/seguranca-em-eletricidade-nr-10-basico/)
- 市場規模・ARPU: [App downloads by country 2025 (AppTweak)](https://www.apptweak.com/en/reports/app-downloads-by-country) / [App Downloads by Country 2025 (FoxData)](https://foxdata.com/en/blogs/app-downloads-by-country-2025-top-markets-on-app-store-google-play/) / [Mobile App Market Report 2025](https://asomobile.net/en/blog/mobile-app-market-report-2025-monetization-ai-and-user-behavior/) / [Japan Leads Per Capita App Store Spending (Sensor Tower)](https://sensortower.com/blog/per-capita-app-store-spending)
