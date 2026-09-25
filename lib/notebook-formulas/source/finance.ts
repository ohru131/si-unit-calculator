import type { NotebookSeed } from "../types";

/**
 * 「資産運用・不動産」。複利・積立・利回り・住宅ローンの返済額など、お金の時間的価値の計算を
 * まとめている（2026-09-25）。
 *
 * **金額には単位を付けない。** 通貨はこのエンジンの単位ではないので、金額は裸の数値で持ち、
 * 既定値は `regionalDefault` で端末の通貨に合わせる（lib/preset-regional-defaults.ts）。
 * **日本円だけは万円単位**で、説明文にそう書いてある（物件価格が円のままだと 1e7 を超えて
 * 指数表記になるため。理由の詳細は PRESET_PRICE_PROFILES のコメント）。
 *
 * **金額と利率には `exact` を付けている。** 契約で決まる金額・金利、計画として置く利回りの
 * 想定は測定値ではなく、有効数字で丸めると `≈ 4000` のように**お金の計算として意味を失う**
 * （月々の返済額が百の位で丸まる）。年数・回数は従来どおり数えた量として付ける。
 *
 * 期間は「年数 n」を無次元の回数で持ち、指数に使う（`(1+r)^n` の指数は無次元でなければ
 * ならない）。年数を答えとして出す手順だけ `*1yr` を掛けて yr で表示する。
 *
 * 税・手数料・為替は入れていない（国ごとに制度が違い、既定値を置くと誤る）。
 * 配当の税率だけは手取りの計算に欠かせないので、編集前提の定数として置いてある。
 */
export const INVESTING_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Compound interest (lump-sum investment)", ja: "複利の運用（一括投資）", es: "Interés compuesto (inversión única)", "pt-BR": "Juros compostos (aporte único)", de: "Zinseszins (Einmalanlage)", fr: "Intérêts composés (placement unique)" },
    description: {
      en: "Invest an amount P₀ once and let it grow at an annual return r, reinvesting the gains, for n years. Compute the final value, the gain and how many times the money has multiplied. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen. Taxes and fees are not included.",
      ja: "元本 P₀ を一度に投資し、年利回り r で増えた分も再投資しながら n 年運用したときの、最終的な金額・増えた額・何倍になったかを求めます。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。税金と手数料は含みません。",
      es: "Invierte una cantidad P₀ una sola vez y déjala crecer a una rentabilidad anual r, reinvirtiendo las ganancias, durante n años. Calcula el valor final, la ganancia y cuántas veces se ha multiplicado el dinero. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes. No se incluyen impuestos ni comisiones.",
      "pt-BR": "Invista uma quantia P₀ de uma só vez e deixe-a crescer a uma rentabilidade anual r, reinvestindo os ganhos, por n anos. Calcule o valor final, o ganho e quantas vezes o dinheiro se multiplicou. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes. Impostos e taxas não estão incluídos.",
      de: "Ein Betrag P₀ wird einmalig angelegt und wächst n Jahre lang mit der jährlichen Rendite r, wobei die Erträge wieder angelegt werden. Berechnet werden Endwert, Gewinn und die Vervielfachung des Geldes. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben. Steuern und Gebühren sind nicht berücksichtigt.",
      fr: "Placer une somme P₀ en une fois et la laisser croître au rendement annuel r pendant n années, en réinvestissant les gains. Calculer la valeur finale, le gain et le nombre de fois où l'argent a été multiplié. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens. Impôts et frais non compris.",
    },
    localConstants: [
      { symbol: "P₀", expression: "100", regionalDefault: "investmentLumpSum", exact: true },
      { symbol: "r", expression: "5%", exact: true },
      { symbol: "n", expression: "20", exact: true },
    ],
    steps: [
      { title: { en: "Final value", ja: "最終的な金額", es: "Valor final", "pt-BR": "Valor final", de: "Endwert", fr: "Valeur finale" }, expression: "P₀*(1+r)^n", targetUnit: "", formulaLatex: "P_n = P_0 (1+r)^n", resultSymbol: "Pₙ" },
      { title: { en: "Gain", ja: "増えた額", es: "Ganancia", "pt-BR": "Ganho", de: "Gewinn", fr: "Gain" }, expression: "Pₙ-P₀", targetUnit: "", formulaLatex: "G = P_n - P_0", resultSymbol: "G" },
      { title: { en: "Growth multiple", ja: "何倍になったか", es: "Múltiplo de crecimiento", "pt-BR": "Múltiplo de crescimento", de: "Vervielfachung", fr: "Multiple de croissance" }, expression: "Pₙ/P₀", targetUnit: "", formulaLatex: "m = \\dfrac{P_n}{P_0} = (1+r)^n", resultSymbol: "m" },
    ],
  },
  {
    title: { en: "Monthly investing plan (future value of regular contributions)", ja: "積立投資（毎月の積立額と将来の金額）", es: "Plan de inversión mensual (valor futuro de aportaciones periódicas)", "pt-BR": "Investimento mensal (valor futuro de aportes regulares)", de: "Sparplan (Endwert monatlicher Einzahlungen)", fr: "Investissement programmé (valeur future de versements mensuels)" },
    description: {
      en: "Put the same amount C into an investment at the end of every month for n years at an annual return r, compounded monthly. Compute what the plan is worth at the end, how much you paid in and how much of it is investment gain. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen. Taxes and fees are not included.",
      ja: "毎月末に同じ額 C を積み立て、年利回り r（月ごとに複利）で n 年運用したときの、最終的な金額・払い込んだ総額・そのうち運用で増えた額を求めます。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。税金と手数料は含みません。",
      es: "Aporta la misma cantidad C al final de cada mes durante n años a una rentabilidad anual r con capitalización mensual. Calcula cuánto vale el plan al final, cuánto has aportado y qué parte es ganancia de la inversión. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes. No se incluyen impuestos ni comisiones.",
      "pt-BR": "Aplique a mesma quantia C no fim de cada mês por n anos a uma rentabilidade anual r, capitalizada mensalmente. Calcule quanto o plano vale no final, quanto você aportou e quanto disso é ganho do investimento. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes. Impostos e taxas não estão incluídos.",
      de: "Am Ende jedes Monats wird derselbe Betrag C eingezahlt, n Jahre lang bei einer jährlichen Rendite r mit monatlicher Verzinsung. Berechnet werden der Endwert des Sparplans, die Summe der Einzahlungen und der Anteil, der auf Erträge entfällt. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben. Steuern und Gebühren sind nicht berücksichtigt.",
      fr: "Verser la même somme C à la fin de chaque mois pendant n années, au rendement annuel r capitalisé mensuellement. Calculer la valeur finale du plan, le total versé et la part qui provient des gains. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens. Impôts et frais non compris.",
    },
    localConstants: [
      { symbol: "C", expression: "3", regionalDefault: "monthlyContribution", exact: true },
      { symbol: "r", expression: "5%", exact: true },
      { symbol: "n", expression: "20", exact: true },
    ],
    steps: [
      { title: { en: "Final value", ja: "最終的な金額", es: "Valor final", "pt-BR": "Valor final", de: "Endwert", fr: "Valeur finale" }, expression: "C*((1+r/12)^(12*n)-1)/(r/12)", targetUnit: "", formulaLatex: "F = C \\cdot \\dfrac{(1 + r/12)^{12n} - 1}{r/12}", resultSymbol: "F" },
      { title: { en: "Total paid in", ja: "払い込んだ総額", es: "Total aportado", "pt-BR": "Total aportado", de: "Summe der Einzahlungen", fr: "Total versé" }, expression: "C*12*n", targetUnit: "", formulaLatex: "S = 12 n C", resultSymbol: "S" },
      { title: { en: "Investment gain", ja: "運用で増えた額", es: "Ganancia de la inversión", "pt-BR": "Ganho do investimento", de: "Erträge", fr: "Gains du placement" }, expression: "F-S", targetUnit: "", formulaLatex: "G = F - S", resultSymbol: "G" },
    ],
  },
  {
    title: { en: "Doubling time (rule of 72)", ja: "お金が2倍になる年数（72の法則）", es: "Tiempo para duplicar el dinero (regla del 72)", "pt-BR": "Tempo para dobrar o dinheiro (regra dos 72)", de: "Verdopplungszeit (72er-Regel)", fr: "Temps de doublement (règle de 72)" },
    description: {
      en: "The rule of 72 says money doubles in about 72 ÷ (return in %) years. Compare it with the exact doubling time ln 2 ÷ ln(1 + r), and work backwards: which annual return doubles the money in T years?",
      ja: "72の法則では、お金が2倍になるまでの年数はおよそ 72 ÷（利回りの%の数字）です。これを正確な年数 ln 2 ÷ ln(1 + r) と比べ、逆に T 年で2倍にするには何%の利回りが要るかも求めます。",
      es: "La regla del 72 dice que el dinero se duplica en unos 72 ÷ (rentabilidad en %) años. Compárala con el tiempo exacto ln 2 ÷ ln(1 + r) y haz el cálculo inverso: ¿qué rentabilidad anual duplica el dinero en T años?",
      "pt-BR": "A regra dos 72 diz que o dinheiro dobra em cerca de 72 ÷ (rentabilidade em %) anos. Compare com o tempo exato ln 2 ÷ ln(1 + r) e faça a conta inversa: que rentabilidade anual dobra o dinheiro em T anos?",
      de: "Nach der 72er-Regel verdoppelt sich Geld in etwa 72 ÷ (Rendite in %) Jahren. Verglichen wird das mit der exakten Verdopplungszeit ln 2 ÷ ln(1 + r); umgekehrt ergibt sich, welche jährliche Rendite das Geld in T Jahren verdoppelt.",
      fr: "Selon la règle de 72, l'argent double en environ 72 ÷ (rendement en %) années. Comparer avec le temps exact ln 2 ÷ ln(1 + r), puis raisonner à l'envers : quel rendement annuel double l'argent en T années ?",
    },
    localConstants: [
      { symbol: "r", expression: "6%", exact: true },
      { symbol: "T", expression: "10", exact: true },
    ],
    steps: [
      { title: { en: "Rule of 72 estimate", ja: "72の法則による目安", es: "Estimación con la regla del 72", "pt-BR": "Estimativa pela regra dos 72", de: "Schätzung nach der 72er-Regel", fr: "Estimation par la règle de 72" }, expression: "72/(r/1%)*1yr", targetUnit: "yr", formulaLatex: "t_{72} = \\dfrac{72}{r\\,[\\%]}", resultSymbol: "t₇₂" },
      { title: { en: "Exact doubling time", ja: "正確な年数", es: "Tiempo exacto de duplicación", "pt-BR": "Tempo exato para dobrar", de: "Exakte Verdopplungszeit", fr: "Temps de doublement exact" }, expression: "ln(2)/ln(1+r)*1yr", targetUnit: "yr", formulaLatex: "t_2 = \\dfrac{\\ln 2}{\\ln(1+r)}", resultSymbol: "t₂" },
      { title: { en: "Return needed to double in T years", ja: "T年で2倍にするのに要る利回り", es: "Rentabilidad necesaria para duplicar en T años", "pt-BR": "Rentabilidade necessária para dobrar em T anos", de: "Nötige Rendite für eine Verdopplung in T Jahren", fr: "Rendement nécessaire pour doubler en T années" }, expression: "2^(1/T)-1", targetUnit: "%", formulaLatex: "r_T = 2^{1/T} - 1", resultSymbol: "r_T" },
    ],
  },
  {
    title: { en: "Annualized return (CAGR)", ja: "年平均成長率（CAGR）", es: "Rentabilidad anualizada (TCAC)", "pt-BR": "Rentabilidade anualizada (CAGR)", de: "Durchschnittliche jährliche Rendite (CAGR)", fr: "Rendement annualisé (TCAM)" },
    description: {
      en: "From a starting value V₀ and an ending value V₁ after n years, compute the total return and the steady annual return that would have produced it (CAGR). V₀ and V₁ can be a fund's price, an index level or the value of your whole portfolio: only their ratio matters.",
      ja: "開始時の値 V₀ と n 年後の値 V₁ から、期間全体のリターンと、それを毎年一定の率で稼いだとしたときの年率（CAGR）を求めます。V₀・V₁ は投資信託の基準価額でも、株価指数でも、資産全体の評価額でも構いません（効くのは比だけです）。",
      es: "A partir de un valor inicial V₀ y un valor final V₁ al cabo de n años, calcula la rentabilidad total y la rentabilidad anual constante que la habría producido (TCAC). V₀ y V₁ pueden ser el valor liquidativo de un fondo, el nivel de un índice o el valor de toda tu cartera: solo importa su cociente.",
      "pt-BR": "A partir de um valor inicial V₀ e de um valor final V₁ depois de n anos, calcule a rentabilidade total e a rentabilidade anual constante que a teria produzido (CAGR). V₀ e V₁ podem ser a cota de um fundo, o nível de um índice ou o valor de toda a sua carteira: só a razão entre eles importa.",
      de: "Aus einem Anfangswert V₀ und einem Endwert V₁ nach n Jahren ergeben sich die Gesamtrendite und die gleichbleibende jährliche Rendite, die zu ihr geführt hätte (CAGR). V₀ und V₁ können der Anteilspreis eines Fonds, ein Indexstand oder der Wert des ganzen Depots sein: Es zählt nur ihr Verhältnis.",
      fr: "À partir d'une valeur de départ V₀ et d'une valeur finale V₁ après n années, calculer le rendement total et le rendement annuel constant qui l'aurait produit (TCAM). V₀ et V₁ peuvent être la valeur liquidative d'un fonds, le niveau d'un indice ou la valeur de tout le portefeuille : seul leur rapport compte.",
    },
    localConstants: [
      { symbol: "V₀", expression: "100", exact: true },
      { symbol: "V₁", expression: "160", exact: true },
      { symbol: "n", expression: "5", exact: true },
    ],
    steps: [
      { title: { en: "Total return", ja: "期間全体のリターン", es: "Rentabilidad total", "pt-BR": "Rentabilidade total", de: "Gesamtrendite", fr: "Rendement total" }, expression: "V₁/V₀-1", targetUnit: "%", formulaLatex: "R = \\dfrac{V_1}{V_0} - 1", resultSymbol: "R" },
      { title: { en: "Annualized return (CAGR)", ja: "年平均成長率（CAGR）", es: "Rentabilidad anualizada (TCAC)", "pt-BR": "Rentabilidade anualizada (CAGR)", de: "Jährliche Rendite (CAGR)", fr: "Rendement annualisé (TCAM)" }, expression: "(V₁/V₀)^(1/n)-1", targetUnit: "%", formulaLatex: "\\mathrm{CAGR} = \\left(\\dfrac{V_1}{V_0}\\right)^{1/n} - 1" },
    ],
  },
  {
    title: { en: "Real return after inflation", ja: "インフレを差し引いた実質リターン", es: "Rentabilidad real descontada la inflación", "pt-BR": "Rentabilidade real descontada a inflação", de: "Realrendite nach Inflation", fr: "Rendement réel après inflation" },
    description: {
      en: "A nominal return r shrinks by inflation i. Compute the real return (1 + r) ÷ (1 + i) − 1, the nominal value of P₀ after n years and what that amount is worth in today's money. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "名目の利回り r は、物価上昇率 i のぶん目減りします。実質リターン (1 + r) ÷ (1 + i) − 1、元本 P₀ の n 年後の名目の金額、そしてその金額が今の価値でいくらに当たるかを求めます。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "La inflación i reduce la rentabilidad nominal r. Calcula la rentabilidad real (1 + r) ÷ (1 + i) − 1, el valor nominal de P₀ al cabo de n años y lo que vale esa cantidad en dinero de hoy. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "A inflação i corrói a rentabilidade nominal r. Calcule a rentabilidade real (1 + r) ÷ (1 + i) − 1, o valor nominal de P₀ depois de n anos e quanto essa quantia vale em dinheiro de hoje. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Die Inflation i schmälert die nominale Rendite r. Berechnet werden die Realrendite (1 + r) ÷ (1 + i) − 1, der nominale Wert von P₀ nach n Jahren und was dieser Betrag in heutiger Kaufkraft wert ist. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "L'inflation i rogne le rendement nominal r. Calculer le rendement réel (1 + r) ÷ (1 + i) − 1, la valeur nominale de P₀ après n années et ce que vaut cette somme en argent d'aujourd'hui. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P₀", expression: "100", regionalDefault: "investmentLumpSum", exact: true },
      { symbol: "r", expression: "5%", exact: true },
      { symbol: "i", expression: "2%", exact: true },
      { symbol: "n", expression: "20", exact: true },
    ],
    steps: [
      { title: { en: "Real return", ja: "実質リターン", es: "Rentabilidad real", "pt-BR": "Rentabilidade real", de: "Realrendite", fr: "Rendement réel" }, expression: "(1+r)/(1+i)-1", targetUnit: "%", formulaLatex: "r_{real} = \\dfrac{1+r}{1+i} - 1", resultSymbol: "r_real" },
      { title: { en: "Nominal value after n years", ja: "n年後の名目の金額", es: "Valor nominal tras n años", "pt-BR": "Valor nominal após n anos", de: "Nominalwert nach n Jahren", fr: "Valeur nominale après n années" }, expression: "P₀*(1+r)^n", targetUnit: "", formulaLatex: "P_n = P_0 (1+r)^n", resultSymbol: "Pₙ" },
      { title: { en: "Worth in today's money", ja: "今の価値に直した金額", es: "Valor en dinero de hoy", "pt-BR": "Valor em dinheiro de hoje", de: "Wert in heutiger Kaufkraft", fr: "Valeur en argent d'aujourd'hui" }, expression: "Pₙ/(1+i)^n", targetUnit: "", formulaLatex: "P_{real} = \\dfrac{P_n}{(1+i)^n}", resultSymbol: "P_real" },
    ],
  },
  {
    title: { en: "Dividend income after tax", ja: "配当・分配金の手取り", es: "Ingresos por dividendos después de impuestos", "pt-BR": "Renda de dividendos após impostos", de: "Dividendenertrag nach Steuern", fr: "Revenus de dividendes après impôt" },
    description: {
      en: "From the amount invested P₀ and the dividend yield y, compute the yearly dividends before and after tax, the monthly equivalent and the yield you actually keep. τ is the tax rate on dividends: replace the 20% with the rate that applies in your country. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "投資額 P₀ と配当利回り y から、年間の配当（税引前・税引後）、月あたりに直した額、実際に手元に残る利回りを求めます。τ は配当にかかる税率です。20% をお住まいの国の税率に書き換えてください。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "A partir de la cantidad invertida P₀ y la rentabilidad por dividendo y, calcula los dividendos anuales antes y después de impuestos, su equivalente mensual y la rentabilidad que realmente conservas. τ es el tipo impositivo sobre dividendos: cambia el 20 % por el que se aplique en tu país. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "A partir do valor investido P₀ e do dividend yield y, calcule os dividendos anuais antes e depois dos impostos, o equivalente mensal e o rendimento que de fato fica com você. τ é a alíquota sobre dividendos: troque os 20% pela alíquota do seu país. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Aus dem angelegten Betrag P₀ und der Dividendenrendite y ergeben sich die jährlichen Dividenden vor und nach Steuern, der monatliche Gegenwert und die Rendite, die tatsächlich übrig bleibt. τ ist der Steuersatz auf Dividenden: Die 20 % durch den im eigenen Land geltenden Satz ersetzen. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "À partir de la somme investie P₀ et du rendement du dividende y, calculer les dividendes annuels avant et après impôt, leur équivalent mensuel et le rendement réellement conservé. τ est le taux d'imposition des dividendes : remplacer les 20 % par le taux applicable dans votre pays. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P₀", expression: "100", regionalDefault: "investmentLumpSum", exact: true },
      { symbol: "y", expression: "3.5%", exact: true },
      { symbol: "τ", expression: "20%", exact: true },
    ],
    steps: [
      { title: { en: "Yearly dividends before tax", ja: "年間の配当（税引前）", es: "Dividendos anuales antes de impuestos", "pt-BR": "Dividendos anuais antes dos impostos", de: "Jährliche Dividenden vor Steuern", fr: "Dividendes annuels avant impôt" }, expression: "P₀*y", targetUnit: "", formulaLatex: "D = P_0 \\, y", resultSymbol: "D" },
      { title: { en: "Yearly dividends after tax", ja: "年間の配当（税引後）", es: "Dividendos anuales después de impuestos", "pt-BR": "Dividendos anuais após os impostos", de: "Jährliche Dividenden nach Steuern", fr: "Dividendes annuels après impôt" }, expression: "D*(1-τ)", targetUnit: "", formulaLatex: "D_{net} = D (1 - \\tau)", resultSymbol: "D_net" },
      { title: { en: "Per month after tax", ja: "月あたりの手取り", es: "Por mes después de impuestos", "pt-BR": "Por mês após os impostos", de: "Pro Monat nach Steuern", fr: "Par mois après impôt" }, expression: "D_net/12", targetUnit: "", formulaLatex: "D_{month} = \\dfrac{D_{net}}{12}", resultSymbol: "D_month" },
      { title: { en: "Yield after tax", ja: "税引後の利回り", es: "Rentabilidad después de impuestos", "pt-BR": "Rendimento após os impostos", de: "Rendite nach Steuern", fr: "Rendement après impôt" }, expression: "y*(1-τ)", targetUnit: "%", formulaLatex: "y_{net} = y (1 - \\tau)", resultSymbol: "y_net" },
    ],
  },
  {
    title: { en: "Retirement drawdown (how long savings last)", ja: "資産の取り崩し（何年もつか）", es: "Retirada de ahorros en la jubilación (cuánto duran)", "pt-BR": "Retirada na aposentadoria (quanto tempo o dinheiro dura)", de: "Entnahmeplan im Ruhestand (wie lange das Geld reicht)", fr: "Retraits à la retraite (combien de temps dure l'épargne)" },
    description: {
      en: "Each year you withdraw a fixed amount equal to a share w of your starting savings, while the rest keeps earning r. Compute how many years the money lasts, and the withdrawal rate that empties the savings in exactly T years. Both results depend only on the rates, not on the size of the savings. Taxes and inflation are not included.",
      ja: "毎年、最初の資産の w 割にあたる一定額を取り崩し、残りは利回り r で運用し続けるとします。資産が何年もつか、そしてちょうど T 年で使い切る取り崩し率を求めます。どちらの答えも率だけで決まり、資産の額には依りません。税金とインフレは含みません。",
      es: "Cada año retiras una cantidad fija igual a una fracción w de tus ahorros iniciales, mientras el resto sigue rindiendo r. Calcula cuántos años dura el dinero y la tasa de retirada que agota los ahorros en exactamente T años. Ambos resultados dependen solo de las tasas, no del tamaño de los ahorros. No se incluyen impuestos ni inflación.",
      "pt-BR": "Todo ano você retira uma quantia fixa igual a uma fração w do patrimônio inicial, enquanto o restante continua rendendo r. Calcule por quantos anos o dinheiro dura e a taxa de retirada que esgota o patrimônio em exatamente T anos. Os dois resultados dependem só das taxas, não do tamanho do patrimônio. Impostos e inflação não estão incluídos.",
      de: "Jedes Jahr wird ein fester Betrag in Höhe des Anteils w des Anfangsvermögens entnommen, der Rest wirft weiter r ab. Berechnet werden, wie viele Jahre das Geld reicht, und die Entnahmerate, bei der das Vermögen nach genau T Jahren aufgebraucht ist. Beide Ergebnisse hängen nur von den Raten ab, nicht von der Höhe des Vermögens. Steuern und Inflation sind nicht berücksichtigt.",
      fr: "Chaque année, on retire un montant fixe égal à une part w de l'épargne de départ, tandis que le reste continue de rapporter r. Calculer combien d'années dure l'argent et le taux de retrait qui épuise l'épargne en exactement T années. Les deux résultats ne dépendent que des taux, pas du montant de l'épargne. Impôts et inflation non compris.",
    },
    localConstants: [
      { symbol: "r", expression: "3%", exact: true },
      { symbol: "w", expression: "5%", exact: true },
      { symbol: "T", expression: "30", exact: true },
    ],
    steps: [
      { title: { en: "Years the savings last", ja: "資産がもつ年数", es: "Años que duran los ahorros", "pt-BR": "Anos que o patrimônio dura", de: "Jahre, die das Vermögen reicht", fr: "Années que dure l'épargne" }, expression: "-ln(1-r/w)/ln(1+r)*1yr", targetUnit: "yr", formulaLatex: "n = -\\dfrac{\\ln(1 - r/w)}{\\ln(1+r)}", resultSymbol: "n" },
      { title: { en: "Withdrawal rate that lasts T years", ja: "T年でちょうど使い切る取り崩し率", es: "Tasa de retirada que dura T años", "pt-BR": "Taxa de retirada que dura T anos", de: "Entnahmerate für genau T Jahre", fr: "Taux de retrait qui dure T années" }, expression: "r/(1-(1+r)^(-T))", targetUnit: "%", formulaLatex: "w_T = \\dfrac{r}{1 - (1+r)^{-T}}", resultSymbol: "w_T" },
    ],
  },
];

/**
 * 不動産・住宅ローン。返済額は元利均等（毎月同じ額）を基本にし、元金均等は別のノートで比べる。
 * 金利は年率を12で割った月利で複利計算する（日本・北米・欧州の住宅ローンで一般的な扱い。
 * カナダの半年複利のような例外は入れていない）。
 *
 * 物件価格・家賃・年収・金利は端末の通貨（金利は通貨圏）に合わせた既定値にしてある。
 * 物件価格と家賃は同じ物件の組になるように置いてあるので、利回りのノートがそのまま妥当な値になる。
 */
export const REAL_ESTATE_SEEDS: NotebookSeed[] = [
  {
    title: { en: "Mortgage payment (fixed monthly payment)", ja: "住宅ローンの返済額（元利均等返済）", es: "Cuota de la hipoteca (cuota mensual fija)", "pt-BR": "Parcela do financiamento (tabela Price)", de: "Kreditrate (Annuitätendarlehen)", fr: "Mensualité de crédit immobilier (mensualités constantes)" },
    description: {
      en: "Buy a property at price P with a down payment of a share d and borrow the rest at an annual rate i over n years. Compute the loan, the fixed monthly payment, the total you repay and the total interest. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen. Fees, insurance and taxes are not included.",
      ja: "価格 P の物件を頭金の割合 d で買い、残りを年利 i・n 年で借りたときの、借入額・毎月の返済額（元利均等）・返済総額・利息の総額を求めます。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。手数料・保険料・税金は含みません。",
      es: "Compra un inmueble al precio P con una entrada del porcentaje d y financia el resto a un tipo anual i durante n años. Calcula el préstamo, la cuota mensual fija, el total a devolver y los intereses totales. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes. No se incluyen comisiones, seguros ni impuestos.",
      "pt-BR": "Compre um imóvel pelo preço P com uma entrada de uma fração d e financie o restante a uma taxa anual i por n anos. Calcule o valor financiado, a parcela mensal fixa (tabela Price), o total pago e o total de juros. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes. Taxas, seguros e impostos não estão incluídos.",
      de: "Eine Immobilie zum Preis P wird mit einem Eigenkapitalanteil d gekauft, der Rest wird zum Jahreszins i über n Jahre finanziert. Berechnet werden Darlehensbetrag, gleichbleibende Monatsrate, Gesamtrückzahlung und Zinskosten insgesamt. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben. Nebenkosten, Versicherungen und Steuern sind nicht berücksichtigt.",
      fr: "Acheter un bien au prix P avec un apport représentant une part d, et emprunter le reste au taux annuel i sur n années. Calculer le montant emprunté, la mensualité constante, le total remboursé et le coût total des intérêts. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens. Frais, assurance et taxes non compris.",
    },
    localConstants: [
      { symbol: "P", expression: "3000", regionalDefault: "propertyPrice", exact: true },
      { symbol: "d", expression: "10%", exact: true },
      { symbol: "i", expression: "1.5%", regionalDefault: "mortgageRate", exact: true },
      { symbol: "n", expression: "30", exact: true },
    ],
    steps: [
      { title: { en: "Loan amount", ja: "借入額", es: "Importe del préstamo", "pt-BR": "Valor financiado", de: "Darlehensbetrag", fr: "Montant emprunté" }, expression: "P*(1-d)", targetUnit: "", formulaLatex: "L = P (1 - d)", resultSymbol: "L" },
      { title: { en: "Monthly payment", ja: "毎月の返済額", es: "Cuota mensual", "pt-BR": "Parcela mensal", de: "Monatsrate", fr: "Mensualité" }, expression: "L*(i/12)/(1-(1+i/12)^(-12*n))", targetUnit: "", formulaLatex: "M = \\dfrac{L \\cdot i/12}{1 - (1 + i/12)^{-12n}}", resultSymbol: "M" },
      { title: { en: "Total repaid", ja: "返済総額", es: "Total devuelto", "pt-BR": "Total pago", de: "Gesamtrückzahlung", fr: "Total remboursé" }, expression: "M*12*n", targetUnit: "", formulaLatex: "T = 12 n M", resultSymbol: "T" },
      { title: { en: "Total interest", ja: "利息の総額", es: "Intereses totales", "pt-BR": "Total de juros", de: "Zinskosten insgesamt", fr: "Coût total des intérêts" }, expression: "T-L", targetUnit: "", formulaLatex: "I = T - L", resultSymbol: "I" },
    ],
  },
  {
    title: { en: "Mortgage with equal principal repayments", ja: "住宅ローンの返済額（元金均等返済）", es: "Hipoteca con amortización constante de capital", "pt-BR": "Financiamento com amortização constante (SAC)", de: "Tilgungsdarlehen (gleichbleibende Tilgung)", fr: "Crédit à amortissement constant" },
    description: {
      en: "Repay the same share of principal every month and pay interest on what is still owed, so the payments start high and fall over time. Compute the monthly principal, the first and last payments and the total interest. Compare with the fixed-payment note: the total interest is lower, but the first payments are heavier. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "毎月同じ額の元金を返し、残っている借入にだけ利息を払う返し方です。返済額は最初が多く、だんだん減っていきます。毎月の元金、初回と最終回の返済額、利息の総額を求めます。元利均等のノートと比べると、利息の総額は少なくなる代わりに、最初の返済が重くなります。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "Devuelve cada mes la misma parte del capital y paga intereses solo por lo que aún debes, de modo que las cuotas empiezan altas y van bajando. Calcula la amortización mensual, la primera y la última cuota y los intereses totales. Compárala con la nota de cuota fija: los intereses totales son menores, pero las primeras cuotas pesan más. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "Amortize todo mês a mesma parte do saldo e pague juros só sobre o que ainda deve: as parcelas começam altas e vão caindo. Calcule a amortização mensal, a primeira e a última parcela e o total de juros. Compare com a nota da tabela Price: o total de juros é menor, mas as primeiras parcelas pesam mais. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Jeden Monat wird derselbe Tilgungsbetrag gezahlt und Zinsen nur auf die Restschuld, die Raten beginnen also hoch und sinken mit der Zeit. Berechnet werden monatliche Tilgung, erste und letzte Rate sowie die Zinskosten insgesamt. Im Vergleich zum Annuitätendarlehen fallen weniger Zinsen an, dafür sind die ersten Raten höher. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "Rembourser chaque mois la même part du capital et ne payer d'intérêts que sur ce qui reste dû : les échéances commencent haut puis diminuent. Calculer l'amortissement mensuel, la première et la dernière échéance et le coût total des intérêts. Par rapport aux mensualités constantes, les intérêts sont moindres mais les premières échéances plus lourdes. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P", expression: "3000", regionalDefault: "propertyPrice", exact: true },
      { symbol: "d", expression: "10%", exact: true },
      { symbol: "i", expression: "1.5%", regionalDefault: "mortgageRate", exact: true },
      { symbol: "n", expression: "30", exact: true },
    ],
    steps: [
      { title: { en: "Loan amount", ja: "借入額", es: "Importe del préstamo", "pt-BR": "Valor financiado", de: "Darlehensbetrag", fr: "Montant emprunté" }, expression: "P*(1-d)", targetUnit: "", formulaLatex: "L = P (1 - d)", resultSymbol: "L" },
      { title: { en: "Principal repaid each month", ja: "毎月返す元金", es: "Capital amortizado cada mes", "pt-BR": "Amortização mensal", de: "Monatliche Tilgung", fr: "Capital remboursé chaque mois" }, expression: "L/(12*n)", targetUnit: "", formulaLatex: "A = \\dfrac{L}{12n}", resultSymbol: "A" },
      { title: { en: "First payment", ja: "初回の返済額", es: "Primera cuota", "pt-BR": "Primeira parcela", de: "Erste Rate", fr: "Première échéance" }, expression: "A+L*i/12", targetUnit: "", formulaLatex: "M_1 = A + L \\cdot \\dfrac{i}{12}", resultSymbol: "M₁" },
      { title: { en: "Last payment", ja: "最終回の返済額", es: "Última cuota", "pt-BR": "Última parcela", de: "Letzte Rate", fr: "Dernière échéance" }, expression: "A*(1+i/12)", targetUnit: "", formulaLatex: "M_{last} = A \\left(1 + \\dfrac{i}{12}\\right)", resultSymbol: "M_last" },
      { title: { en: "Total interest", ja: "利息の総額", es: "Intereses totales", "pt-BR": "Total de juros", de: "Zinskosten insgesamt", fr: "Coût total des intérêts" }, expression: "L*(i/12)*(12*n+1)/2", targetUnit: "", formulaLatex: "I = L \\cdot \\dfrac{i}{12} \\cdot \\dfrac{12n + 1}{2}", resultSymbol: "I" },
    ],
  },
  {
    title: { en: "Remaining mortgage balance after k years", ja: "k年後の住宅ローン残高", es: "Capital pendiente de la hipoteca tras k años", "pt-BR": "Saldo devedor do financiamento após k anos", de: "Restschuld nach k Jahren", fr: "Capital restant dû après k années" },
    description: {
      en: "With a fixed-payment mortgage, how much is still owed after k years? In the early years most of each payment is interest, so the balance falls slowly: compute the remaining balance, the principal repaid so far and its share of the loan. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "元利均等返済の住宅ローンで、k 年たった時点で残っている借入はいくらか。最初のうちは返済額の多くが利息に回るので、残高はなかなか減りません。残高、それまでに返した元金、それが借入額の何%に当たるかを求めます。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "Con una hipoteca de cuota fija, ¿cuánto se debe todavía al cabo de k años? En los primeros años la mayor parte de cada cuota son intereses, así que la deuda baja despacio: calcula el capital pendiente, el capital amortizado hasta ahora y qué parte del préstamo representa. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "Num financiamento com parcela fixa, quanto ainda se deve depois de k anos? Nos primeiros anos a maior parte de cada parcela é juros, então o saldo cai devagar: calcule o saldo devedor, o quanto já foi amortizado e que fração do financiamento isso representa. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Wie viel ist bei einem Annuitätendarlehen nach k Jahren noch offen? In den ersten Jahren besteht der Großteil jeder Rate aus Zinsen, deshalb sinkt die Schuld nur langsam. Berechnet werden Restschuld, bisher getilgter Betrag und dessen Anteil am Darlehen. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "Avec un crédit à mensualités constantes, combien reste-t-il à rembourser après k années ? Les premières années, l'essentiel de chaque mensualité part en intérêts, si bien que la dette baisse lentement : calculer le capital restant dû, le capital déjà remboursé et sa part dans l'emprunt. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P", expression: "3000", regionalDefault: "propertyPrice", exact: true },
      { symbol: "d", expression: "10%", exact: true },
      { symbol: "i", expression: "1.5%", regionalDefault: "mortgageRate", exact: true },
      { symbol: "n", expression: "30", exact: true },
      { symbol: "k", expression: "10", exact: true },
    ],
    steps: [
      { title: { en: "Loan amount", ja: "借入額", es: "Importe del préstamo", "pt-BR": "Valor financiado", de: "Darlehensbetrag", fr: "Montant emprunté" }, expression: "P*(1-d)", targetUnit: "", formulaLatex: "L = P (1 - d)", resultSymbol: "L" },
      { title: { en: "Monthly payment", ja: "毎月の返済額", es: "Cuota mensual", "pt-BR": "Parcela mensal", de: "Monatsrate", fr: "Mensualité" }, expression: "L*(i/12)/(1-(1+i/12)^(-12*n))", targetUnit: "", formulaLatex: "M = \\dfrac{L \\cdot i/12}{1 - (1 + i/12)^{-12n}}", resultSymbol: "M" },
      { title: { en: "Balance after k years", ja: "k年後の残高", es: "Capital pendiente tras k años", "pt-BR": "Saldo devedor após k anos", de: "Restschuld nach k Jahren", fr: "Capital restant dû après k années" }, expression: "L*(1+i/12)^(12*k)-M*((1+i/12)^(12*k)-1)/(i/12)", targetUnit: "", formulaLatex: "B_k = L (1 + i/12)^{12k} - M \\cdot \\dfrac{(1 + i/12)^{12k} - 1}{i/12}", resultSymbol: "B_k" },
      { title: { en: "Principal repaid so far", ja: "それまでに返した元金", es: "Capital amortizado hasta ahora", "pt-BR": "Valor já amortizado", de: "Bisher getilgt", fr: "Capital déjà remboursé" }, expression: "L-B_k", targetUnit: "", formulaLatex: "Q = L - B_k", resultSymbol: "Q" },
      { title: { en: "Share of the loan repaid", ja: "借入額のうち返し終えた割合", es: "Parte del préstamo amortizada", "pt-BR": "Fração do financiamento amortizada", de: "Getilgter Anteil des Darlehens", fr: "Part de l'emprunt remboursée" }, expression: "Q/L", targetUnit: "%", formulaLatex: "q = \\dfrac{Q}{L}", resultSymbol: "q" },
    ],
  },
  {
    title: { en: "Mortgage affordability (debt-to-income ratio)", ja: "無理のない借入額（返済負担率）", es: "Hipoteca asumible (ratio de endeudamiento)", "pt-BR": "Financiamento que cabe no bolso (comprometimento da renda)", de: "Tragbare Finanzierung (Belastungsquote)", fr: "Capacité d'emprunt (taux d'endettement)" },
    description: {
      en: "Compare the yearly mortgage payments with the household's gross annual income Y, and work backwards from the ratio θ you want to stay under to the largest loan that keeps you there. Lenders commonly look for roughly 25–35%; the exact limit depends on the country and the lender. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "年間の返済額を世帯の年収（税込）Y と比べた返済負担率を求め、逆に、抑えたい負担率 θ から借りられる上限額を求めます。金融機関が目安にするのはおおむね 25〜35% ですが、上限は国や金融機関によって違います。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "Compara las cuotas anuales de la hipoteca con los ingresos brutos anuales del hogar Y y haz el cálculo inverso: a partir del ratio θ que no quieres superar, obtén el préstamo máximo que lo respeta. Los bancos suelen buscar entre un 25 % y un 35 %; el límite exacto depende del país y de la entidad. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "Compare as parcelas anuais do financiamento com a renda bruta anual da família Y e faça a conta inversa: a partir do comprometimento θ que você não quer ultrapassar, obtenha o maior financiamento que o respeita. Os bancos costumam aceitar algo entre 25% e 35%; o limite exato depende do país e da instituição. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Die jährlichen Kreditraten werden mit dem Bruttojahreseinkommen des Haushalts Y verglichen; umgekehrt ergibt sich aus der gewünschten Obergrenze θ der höchste Darlehensbetrag, der sie einhält. Banken achten meist auf etwa 25–35 %, die genaue Grenze hängt von Land und Bank ab. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "Comparer les remboursements annuels au revenu annuel brut du foyer Y, puis raisonner à l'envers : à partir du taux θ à ne pas dépasser, trouver l'emprunt maximal qui le respecte. Les banques visent généralement 25 à 35 % ; la limite exacte dépend du pays et de l'établissement. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P", expression: "3000", regionalDefault: "propertyPrice", exact: true },
      { symbol: "d", expression: "10%", exact: true },
      { symbol: "i", expression: "1.5%", regionalDefault: "mortgageRate", exact: true },
      { symbol: "n", expression: "30", exact: true },
      { symbol: "Y", expression: "600", regionalDefault: "annualIncome", exact: true },
      { symbol: "θ", expression: "25%", exact: true },
    ],
    steps: [
      { title: { en: "Loan amount", ja: "借入額", es: "Importe del préstamo", "pt-BR": "Valor financiado", de: "Darlehensbetrag", fr: "Montant emprunté" }, expression: "P*(1-d)", targetUnit: "", formulaLatex: "L = P (1 - d)", resultSymbol: "L" },
      { title: { en: "Monthly payment", ja: "毎月の返済額", es: "Cuota mensual", "pt-BR": "Parcela mensal", de: "Monatsrate", fr: "Mensualité" }, expression: "L*(i/12)/(1-(1+i/12)^(-12*n))", targetUnit: "", formulaLatex: "M = \\dfrac{L \\cdot i/12}{1 - (1 + i/12)^{-12n}}", resultSymbol: "M" },
      { title: { en: "Debt-to-income ratio", ja: "返済負担率", es: "Ratio de endeudamiento", "pt-BR": "Comprometimento da renda", de: "Belastungsquote", fr: "Taux d'endettement" }, expression: "12*M/Y", targetUnit: "%", formulaLatex: "\\rho = \\dfrac{12M}{Y}", resultSymbol: "ρ" },
      { title: { en: "Largest loan at ratio θ", ja: "負担率θで借りられる上限額", es: "Préstamo máximo con el ratio θ", "pt-BR": "Maior financiamento com comprometimento θ", de: "Höchstes Darlehen bei Quote θ", fr: "Emprunt maximal au taux θ" }, expression: "(θ*Y/12)*(1-(1+i/12)^(-12*n))/(i/12)", targetUnit: "", formulaLatex: "L_{max} = \\dfrac{\\theta Y}{12} \\cdot \\dfrac{1 - (1 + i/12)^{-12n}}{i/12}", resultSymbol: "L_max" },
    ],
  },
  {
    title: { en: "Rental yield (gross and net)", ja: "賃貸物件の利回り（表面・実質）", es: "Rentabilidad del alquiler (bruta y neta)", "pt-BR": "Rentabilidade do aluguel (bruta e líquida)", de: "Mietrendite (brutto und netto)", fr: "Rentabilité locative (brute et nette)" },
    description: {
      en: "From the purchase price P and the monthly rent R, compute the gross yield. Then subtract running costs (a share ε of the rent: management, repairs, property tax, vacancies) to get the net operating income, and divide it by the price plus buying costs (a share c of the price) to get the net yield. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "購入価格 P と月額家賃 R から表面利回りを求めます。さらに家賃の ε 割にあたる経費（管理費・修繕費・固定資産税・空室）を差し引いた純収益を、価格に購入時の諸費用（価格の c 割）を足した額で割って、実質利回りを求めます。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "A partir del precio de compra P y del alquiler mensual R, calcula la rentabilidad bruta. Después resta los gastos corrientes (una fracción ε del alquiler: administración, reparaciones, IBI, periodos vacíos) para obtener el ingreso neto, y divídelo entre el precio más los gastos de compra (una fracción c del precio) para obtener la rentabilidad neta. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "A partir do preço de compra P e do aluguel mensal R, calcule a rentabilidade bruta. Depois desconte os custos (uma fração ε do aluguel: administração, manutenção, IPTU, vacância) para obter a renda líquida e divida-a pelo preço somado aos custos de compra (uma fração c do preço) para obter a rentabilidade líquida. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Aus Kaufpreis P und Monatsmiete R ergibt sich die Bruttomietrendite. Zieht man die laufenden Kosten ab (Anteil ε der Miete: Verwaltung, Instandhaltung, Grundsteuer, Leerstand), erhält man den Reinertrag; geteilt durch Kaufpreis plus Kaufnebenkosten (Anteil c des Preises) ergibt er die Nettomietrendite. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "À partir du prix d'achat P et du loyer mensuel R, calculer la rentabilité brute. Retrancher ensuite les charges (une part ε du loyer : gestion, travaux, taxe foncière, vacance locative) pour obtenir le revenu net, puis le diviser par le prix majoré des frais d'acquisition (une part c du prix) pour obtenir la rentabilité nette. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P", expression: "3000", regionalDefault: "propertyPrice", exact: true },
      { symbol: "R", expression: "12", regionalDefault: "monthlyRent", exact: true },
      { symbol: "ε", expression: "20%", exact: true },
      { symbol: "c", expression: "7%", exact: true },
    ],
    steps: [
      { title: { en: "Yearly rent", ja: "年間の家賃収入", es: "Alquiler anual", "pt-BR": "Aluguel anual", de: "Jahresmiete", fr: "Loyer annuel" }, expression: "12*R", targetUnit: "", formulaLatex: "R_y = 12R", resultSymbol: "R_y" },
      { title: { en: "Gross yield", ja: "表面利回り", es: "Rentabilidad bruta", "pt-BR": "Rentabilidade bruta", de: "Bruttomietrendite", fr: "Rentabilité brute" }, expression: "R_y/P", targetUnit: "%", formulaLatex: "y_{gross} = \\dfrac{R_y}{P}", resultSymbol: "y_gross" },
      { title: { en: "Net operating income", ja: "年間の純収益", es: "Ingreso neto anual", "pt-BR": "Renda líquida anual", de: "Jährlicher Reinertrag", fr: "Revenu net annuel" }, expression: "R_y*(1-ε)", targetUnit: "", formulaLatex: "\\mathrm{NOI} = R_y (1 - \\varepsilon)", resultSymbol: "NOI" },
      { title: { en: "Net yield", ja: "実質利回り", es: "Rentabilidad neta", "pt-BR": "Rentabilidade líquida", de: "Nettomietrendite", fr: "Rentabilité nette" }, expression: "NOI/(P*(1+c))", targetUnit: "%", formulaLatex: "y_{net} = \\dfrac{\\mathrm{NOI}}{P (1 + c)}", resultSymbol: "y_net" },
    ],
  },
  {
    title: { en: "Property value from the cap rate", ja: "還元利回りから見た物件価格（収益還元）", es: "Valor del inmueble según la tasa de capitalización", "pt-BR": "Valor do imóvel pela taxa de capitalização", de: "Ertragswert über den Kapitalisierungszins", fr: "Valeur du bien par le taux de capitalisation" },
    description: {
      en: "Investors value a rental property by its net operating income: value = NOI ÷ cap rate κ. Compute the NOI from the monthly rent and the cost share ε, the value it supports, whether the asking price P is above or below it, and how many years of NOI it takes to earn back the price. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "収益物件は、年間の純収益を還元利回り κ で割って価格を見積もります（価格 = 純収益 ÷ κ）。月額家賃と経費率 ε から純収益を出し、それが裏付ける価格、売り出し価格 P がそれより高いか安いか、そして価格を純収益で回収するのに何年かかるかを求めます。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "Los inversores valoran un inmueble en alquiler por su ingreso neto: valor = ingreso neto ÷ tasa de capitalización κ. Calcula el ingreso neto a partir del alquiler mensual y la fracción de gastos ε, el valor que justifica, si el precio pedido P está por encima o por debajo y cuántos años de ingreso neto hacen falta para recuperar el precio. Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "Investidores avaliam um imóvel para renda pela renda líquida: valor = renda líquida ÷ taxa de capitalização κ. Calcule a renda líquida a partir do aluguel mensal e da fração de custos ε, o valor que ela sustenta, se o preço pedido P está acima ou abaixo dele e quantos anos de renda líquida são precisos para recuperar o preço. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Renditeobjekte werden über den Reinertrag bewertet: Wert = Reinertrag ÷ Kapitalisierungszins κ. Berechnet werden der Reinertrag aus Monatsmiete und Kostenanteil ε, der daraus folgende Wert, ob der Angebotspreis P darüber oder darunter liegt und wie viele Jahresreinerträge nötig sind, um den Preis zurückzuverdienen. Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "Les investisseurs évaluent un bien locatif par son revenu net : valeur = revenu net ÷ taux de capitalisation κ. Calculer le revenu net à partir du loyer mensuel et de la part de charges ε, la valeur qu'il justifie, si le prix demandé P est au-dessus ou en dessous, et combien d'années de revenu net il faut pour récupérer le prix. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P", expression: "3000", regionalDefault: "propertyPrice", exact: true },
      { symbol: "R", expression: "12", regionalDefault: "monthlyRent", exact: true },
      { symbol: "ε", expression: "20%", exact: true },
      { symbol: "κ", expression: "4%", exact: true },
    ],
    steps: [
      { title: { en: "Net operating income", ja: "年間の純収益", es: "Ingreso neto anual", "pt-BR": "Renda líquida anual", de: "Jährlicher Reinertrag", fr: "Revenu net annuel" }, expression: "12*R*(1-ε)", targetUnit: "", formulaLatex: "\\mathrm{NOI} = 12R (1 - \\varepsilon)", resultSymbol: "NOI" },
      { title: { en: "Value supported by the income", ja: "収益から見た価格", es: "Valor que justifica el ingreso", "pt-BR": "Valor sustentado pela renda", de: "Ertragswert", fr: "Valeur justifiée par le revenu" }, expression: "NOI/κ", targetUnit: "", formulaLatex: "V = \\dfrac{\\mathrm{NOI}}{\\kappa}", resultSymbol: "V" },
      { title: { en: "Asking price relative to that value", ja: "売り出し価格は収益価格の何%か", es: "Precio pedido respecto a ese valor", "pt-BR": "Preço pedido em relação a esse valor", de: "Angebotspreis im Verhältnis zum Ertragswert", fr: "Prix demandé rapporté à cette valeur" }, expression: "P/V", targetUnit: "%", formulaLatex: "\\dfrac{P}{V}" },
      { title: { en: "Years to earn back the price", ja: "価格を回収するのにかかる年数", es: "Años para recuperar el precio", "pt-BR": "Anos para recuperar o preço", de: "Jahre bis zur Amortisation", fr: "Années pour récupérer le prix" }, expression: "P/NOI*1yr", targetUnit: "yr", formulaLatex: "t = \\dfrac{P}{\\mathrm{NOI}}", resultSymbol: "t" },
    ],
  },
  {
    title: { en: "Price and rent per square metre", ja: "㎡単価・坪単価と賃料単価", es: "Precio y alquiler por metro cuadrado", "pt-BR": "Preço e aluguel por metro quadrado", de: "Quadratmeterpreis und Quadratmetermiete", fr: "Prix et loyer au mètre carré" },
    description: {
      en: "Divide the price P and the monthly rent R by the floor area A to compare properties of different sizes. The price per tsubo (3.306 m², the unit used in Japanese listings) is included as well. Amounts are plain numbers in your currency; with Japanese yen the defaults are in units of 10,000 yen.",
      ja: "価格 P と月額家賃 R を専有面積 A で割り、広さの違う物件を同じ物差しで比べます。1坪 = 400/121 ㎡（約3.306 ㎡）で割った坪単価も出します。金額は通貨記号を付けない数値で、既定値は端末の通貨に合わせてあります（日本円は万円単位）。",
      es: "Divide el precio P y el alquiler mensual R entre la superficie A para comparar inmuebles de distinto tamaño. También se incluye el precio por tsubo (3,306 m², la unidad que usan los anuncios japoneses). Los importes son números sin símbolo en tu moneda; con yenes japoneses, los valores por defecto van en unidades de 10 000 yenes.",
      "pt-BR": "Divida o preço P e o aluguel mensal R pela área A para comparar imóveis de tamanhos diferentes. O preço por tsubo (3,306 m², a unidade usada nos anúncios japoneses) também está incluído. Os valores são números sem símbolo na sua moeda; em ienes japoneses, os padrões estão em unidades de 10.000 ienes.",
      de: "Kaufpreis P und Monatsmiete R werden durch die Wohnfläche A geteilt, um unterschiedlich große Objekte zu vergleichen. Zusätzlich wird der Preis je Tsubo angegeben (3,306 m², die Einheit japanischer Inserate). Beträge sind reine Zahlen in der eigenen Währung; bei japanischen Yen sind die Vorgaben in Einheiten von 10.000 Yen angegeben.",
      fr: "Diviser le prix P et le loyer mensuel R par la surface A pour comparer des biens de tailles différentes. Le prix au tsubo (3,306 m², l'unité des annonces japonaises) est aussi indiqué. Les montants sont des nombres sans symbole dans votre devise ; en yens japonais, les valeurs par défaut sont en unités de 10 000 yens.",
    },
    localConstants: [
      { symbol: "P", expression: "3000", regionalDefault: "propertyPrice", exact: true },
      { symbol: "R", expression: "12", regionalDefault: "monthlyRent", exact: true },
      // 広告・契約書に載る専有面積は「表示された値」で、ここで測るものではない。印を付けないと
      // 坪単価だけが面積の4桁で丸まり、㎡単価（1m^2 で割るので桁が読めず丸まらない）と食い違う。
      { symbol: "A", expression: "72.45m^2", exact: true },
      // 1坪は 400/121 m²（6尺四方＝(1.818…m)²）で定義された値なので測定値ではない。
      { symbol: "tsubo", expression: "400/121*1m^2", exact: true },
    ],
    steps: [
      { title: { en: "Price per m²", ja: "㎡単価", es: "Precio por m²", "pt-BR": "Preço por m²", de: "Kaufpreis je m²", fr: "Prix au m²" }, expression: "P/(A/1m^2)", targetUnit: "", formulaLatex: "p_{m^2} = \\dfrac{P}{A}" },
      { title: { en: "Price per tsubo", ja: "坪単価", es: "Precio por tsubo", "pt-BR": "Preço por tsubo", de: "Kaufpreis je Tsubo", fr: "Prix au tsubo" }, expression: "P/(A/tsubo)", targetUnit: "", formulaLatex: "p_{tsubo} = \\dfrac{P}{A / \\text{tsubo}}" },
      { title: { en: "Monthly rent per m²", ja: "賃料の㎡単価（月額）", es: "Alquiler mensual por m²", "pt-BR": "Aluguel mensal por m²", de: "Monatsmiete je m²", fr: "Loyer mensuel au m²" }, expression: "R/(A/1m^2)", targetUnit: "", formulaLatex: "r_{m^2} = \\dfrac{R}{A}" },
    ],
  },
];
