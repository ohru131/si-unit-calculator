import {
  type NotebookExportConstant,
  type NotebookExportFormulaRow,
  type NotebookExportModel,
  type NotebookExportStep,
} from "@/lib/notebook-export-model";

// KaTeXのCSS/JSと見出し・フッター文言は、このモジュールの外（呼び出し側）から渡してもらう。
// katex-assets.generated.tsは約646KBあり、このモジュールが直接importするとテストがそのビルド
// コストを毎回背負うことになるうえ、見出し文言は6言語ローカライズの対象なので言語を知らない
// この純粋関数に持ち込むべきではない（呼び出し側＝画面がAppLanguageを知っている）。
export type NotebookExportHtmlOptions = {
  katexCss: string;
  katexJs: string;
  // html要素のlang。内容は日本語・ドイツ語などにもなるので固定してはいけない
  // （スクリーンリーダーの読み上げ言語、ハイフネーション、フォント選択が変わる）。
  lang: string;
  headings: { formulas: string; inputs: string; steps: string };
  footer: string;
};

// HTMLの構造を壊せる5文字だけをエスケープする。ノート名・説明文・手順タイトル・式・
// 定数の表示テキストは全てユーザーが自由入力できる値なので、<script>のような
// タグ注入や属性のはみ出しを防ぐために全ての差し込み箇所でこれを通す。
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// LaTeX文字列はkatex.renderにそのまま渡す必要があるためHTMLエスケープはできない
// （バックスラッシュや{}をエスケープするとKaTeXが数式として解釈できなくなる）。
// 代わりにJSON.stringifyでJS文字列リテラルとして安全な形にする。ただしJSON.stringifyは
// "/"をエスケープしないため、latex中に"</script>"という並びが含まれていると、
// ブラウザのHTMLパーサーがJSの文法より先に「スクリプト終了タグ」として認識してしまい、
// 以降の文字列がスクリプト外の生HTMLとして解釈される（スクリプトインジェクションの経路になる）。
// "<"を全てユニコードエスケープに置き換えることで、生成後のHTML中に"<"という文字自体が
// 一切現れないようにし、この経路を塞ぐ（components/ui/latex-view.tsxと同じ対策）。
function encodeLatexForScript(latex: string): string {
  return JSON.stringify(latex).replace(/</g, "\\u003c");
}

function renderFormulaScript(index: number, latex: string): string {
  const targetId = `formula-${index}`;
  const encoded = encodeLatexForScript(latex);
  return `<script>
katex.render(${encoded}, document.getElementById(${JSON.stringify(targetId)}), { throwOnError: false, displayMode: true });
</script>`;
}

function renderDescriptionSection(description: string): string {
  if (description.trim().length === 0) return "";
  return `<section class="description"><p>${escapeHtml(description)}</p></section>`;
}

function renderFormulasSection(model: NotebookExportModel, heading: string): string {
  if (model.formulas.length === 0) return "";
  const rows = model.formulas
    .map((formula: NotebookExportFormulaRow, index: number) => {
      const explanation =
        formula.explanation.trim().length > 0 ? `<p class="formula-explanation">${escapeHtml(formula.explanation)}</p>` : "";
      const script = renderFormulaScript(index, formula.latex);
      return `<div class="formula-row">
${explanation}
<div class="formula-latex" id="formula-${index}"></div>
${script}
</div>`;
    })
    .join("\n");
  return `<section class="formulas"><h2>${escapeHtml(heading)}</h2>
${rows}
</section>`;
}

function renderInputsSection(model: NotebookExportModel, heading: string): string {
  const items = model.constants
    .map((constant: NotebookExportConstant) => `<li>${escapeHtml(constant.text)}</li>`)
    .join("\n");
  return `<section class="inputs"><h2>${escapeHtml(heading)}</h2>
<ul>
${items}
</ul>
</section>`;
}

function renderStepsSection(model: NotebookExportModel, heading: string): string {
  const cards = model.steps
    .map((step: NotebookExportStep) => {
      const title = step.title.trim().length > 0 ? `<p class="step-title">${escapeHtml(step.title)}</p>` : "";
      const cardClass = step.isError ? "step-card step-card-error" : "step-card";
      return `<div class="${cardClass}">
${title}
<p class="step-expression">${escapeHtml(step.expression)}</p>
<p class="step-result">${escapeHtml(step.resultText)}</p>
</div>`;
    })
    .join("\n");
  return `<section class="steps"><h2>${escapeHtml(heading)}</h2>
${cards}
</section>`;
}

// 計算ノート1件をPDF化するための自己完結HTMLドキュメントを組み立てる。
// 共有先のブラウザやOSの印刷メニューでそのまま開けることが要件なので、外部ネットワークに
// 一切依存せず同じ見た目になることが要件（KaTeXのフォントまで含めてbase64で埋め込み済みの
// katexCss/katexJsを渡してもらう前提）。
export function buildNotebookExportHtml(model: NotebookExportModel, options: NotebookExportHtmlOptions): string {
  const { katexCss, katexJs, lang, headings, footer } = options;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(model.title)}</title>
<style>
${katexCss}
@page { margin: 20mm 16mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 16px;
  font-family: "Hiragino Mincho ProN", "Georgia", "Times New Roman", serif;
  color: #111111;
  background: #ffffff;
  line-height: 1.6;
}
h1 { font-size: 22px; margin: 0 0 8px; }
h2 { font-size: 16px; margin: 24px 0 8px; border-bottom: 1px solid #999999; padding-bottom: 4px; }
section { margin-bottom: 16px; }
.description p { white-space: pre-wrap; }
.formula-row { margin-bottom: 12px; break-inside: avoid; }
.formula-explanation { margin: 0 0 4px; font-size: 13px; color: #333333; }
.formula-latex { font-size: 16px; }
.inputs ul { margin: 0; padding-left: 20px; }
.inputs li { margin-bottom: 4px; }
.step-card {
  border: 1px solid #cccccc;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  break-inside: avoid;
}
.step-card-error { border-color: #b00020; background: #fdecea; }
.step-title { margin: 0 0 4px; font-weight: bold; }
.step-expression { margin: 0 0 4px; font-family: "Menlo", "Consolas", monospace; }
.step-result { margin: 0; font-weight: bold; }
.step-card-error .step-result { color: #b00020; }
footer { margin-top: 24px; font-size: 11px; color: #666666; text-align: center; }
</style>
</head>
<body>
<script>${katexJs}</script>
<h1>${escapeHtml(model.title)}</h1>
${renderDescriptionSection(model.description)}
${renderFormulasSection(model, headings.formulas)}
${renderInputsSection(model, headings.inputs)}
${renderStepsSection(model, headings.steps)}
<footer>${escapeHtml(footer)}</footer>
</body>
</html>`;
}
