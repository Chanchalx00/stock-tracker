const VERDICT = {
  PASS: "Pass",
  CAUTION: "Caution",
  FAIL: "Fail",
  NOT_ASSESSED: "Not Assessed",
  INFO: "Info",
};

const SCORED_VERDICTS = new Set([VERDICT.PASS, VERDICT.CAUTION, VERDICT.FAIL]);
const VERDICT_SCORE = {
  [VERDICT.PASS]: 1,
  [VERDICT.CAUTION]: 0.5,
  [VERDICT.FAIL]: 0,
};

const SOURCE = {
  DETAILS: "Chittorgarh — IPO Details table",
  FINANCIALS: "Chittorgarh — Company Financials table",
  KPI: "Chittorgarh — Key Performance Indicator table",
  VALUATION: "Chittorgarh — IPO Valuation table",
  HOLDING: "Chittorgarh — Shareholding Structure table",
  OFS: "Chittorgarh — Offer For Sale (Selling Shareholders) table",
  OBJECTS: "Chittorgarh — Objects of the Issue table",
  RESERVATION: "Chittorgarh — Issue Reservation table",
  ANCHOR: "Chittorgarh — IPO Anchor Investors table",
  SUBSCRIPTION: "Chittorgarh — IPO Subscription Status table",
  BROKERS: "Chittorgarh — IPO Recommendations table",
  PEERS: "Chittorgarh — Recently Listed IPOs in sector table",
  MARKET: "Live NSE Nifty 50 quote",
  DERIVED: "Derived from Chittorgarh figures",
  UNAVAILABLE: "Not published on the Chittorgarh IPO page",
};

const QUALITY = {
  VERIFIED: "Verified from source",
  DERIVED: "Derived from source figures",
  UNAVAILABLE: "Not available from source",
};

const fmtPct = (v, digits = 1) =>
  typeof v === "number" ? `${v >= 0 ? "" : ""}${v.toFixed(digits)}%` : "—";
const fmtCr = (v) =>
  typeof v === "number" ? `₹${v.toLocaleString("en-IN")} Cr` : "—";
const fmtX = (v, digits = 2) =>
  typeof v === "number" ? `${v.toFixed(digits)}x` : "—";

const median = (nums) => {
  const arr = (nums || [])
    .filter((n) => typeof n === "number")
    .sort((a, b) => a - b);
  if (!arr.length) return undefined;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2
    ? arr[mid]
    : Number(((arr[mid - 1] + arr[mid]) / 2).toFixed(2));
};

const band = (value, passAt, cautionAt, lowerIsBetter = false) => {
  if (typeof value !== "number" || Number.isNaN(value))
    return VERDICT.NOT_ASSESSED;
  if (lowerIsBetter) {
    if (value <= passAt) return VERDICT.PASS;
    if (value <= cautionAt) return VERDICT.CAUTION;
    return VERDICT.FAIL;
  }
  if (value >= passAt) return VERDICT.PASS;
  if (value >= cautionAt) return VERDICT.CAUTION;
  return VERDICT.FAIL;
};

const downgrade = (verdict) => {
  if (verdict === VERDICT.PASS) return VERDICT.CAUTION;
  if (verdict === VERDICT.CAUTION) return VERDICT.FAIL;
  return verdict;
};

const extractCr = (str) => {
  if (!str) return undefined;
  const m = String(str)
    .replace(/,/g, "")
    .match(/₹([\d.]+)\s*Cr/i);
  return m ? parseFloat(m[1]) : undefined;
};

const buildParameters = (d, marketTrend) => {
  const f = d.financials || {};
  const kpi = f.kpi || {};
  const split = d.issueSplit || {};
  const params = [];

  const add = (p) => {
    params.push({
      id: params.length + 1,
      weight: p.weight ?? 0,
      dataQuality:
        p.dataQuality ??
        (p.verdict === VERDICT.NOT_ASSESSED
          ? QUALITY.UNAVAILABLE
          : QUALITY.VERIFIED),
      ...p,
    });
  };

  const na = (
    name,
    category,
    benchmark,
    whyItMatters,
    reason,
    weight,
    source = SOURCE.UNAVAILABLE,
  ) =>
    add({
      name,
      category,
      benchmark,
      actual: "Not disclosed by source",
      verdict: VERDICT.NOT_ASSESSED,
      weight,
      whyItMatters,
      interpretation: reason,
      source,
      dataQuality: QUALITY.UNAVAILABLE,
    });

  add({
    name: "Issue Overview",
    category: "Governance & Structure",
    benchmark: "Context only",
    actual: `${d.name} — ${d.category === "SME" ? "SME" : "Mainboard"} IPO${
      split.totalCr ? `, issue size ${fmtCr(split.totalCr)}` : ""
    }${d.sector ? `, sector: ${d.sector}` : ""}`,
    verdict: VERDICT.INFO,
    weight: 0,
    whyItMatters:
      "Scale and board matter before anything else. Mainboard issues face stricter disclosure and draw institutional money; SME issues are smaller, thinly traded and far more volatile after listing.",
    interpretation:
      d.category === "SME"
        ? "This is an SME issue. Liquidity after listing is usually thin and price swings are wide, so position sizing matters more than the score."
        : "This is a Mainboard issue, so it carries full disclosure requirements and is open to institutional participation.",
    source: SOURCE.DETAILS,
  });

  if (typeof split.freshPct === "number") {
    add({
      name: "Issue Structure (Fresh vs OFS)",
      category: "Governance & Structure",
      benchmark: "Fresh issue ≥ 60% of total",
      actual: split.ofsCr
        ? `${split.structureLabel}: Fresh ${fmtCr(split.freshCr)} (${split.freshPct}%) + OFS ${fmtCr(split.ofsCr)} (${split.ofsPct}%)`
        : `Pure Fresh Issue — ${fmtCr(split.freshCr)}, 100% to the company`,
      verdict: band(split.freshPct, 60, 40),
      weight: 3,
      whyItMatters:
        "Only the fresh-issue portion reaches the company's balance sheet and funds growth. Offer-for-Sale money goes to the shareholders who are selling. A fresh-issue-dominated deal means the business is raising capital; an OFS-dominated deal means existing owners are cashing out.",
      interpretation: split.ofsCr
        ? `${split.freshPct}% of the ${fmtCr(split.totalCr)} raise (${fmtCr(split.freshCr)}) goes to the company; ${fmtCr(split.ofsCr)} goes to selling shareholders. The OFS portion is not a positive for you — it is neutral at best, and is why this issue is classified "${split.structureLabel}" rather than judged on the OFS share alone.`
        : "Every rupee raised goes to the company. This is the most shareholder-friendly structure.",
      source: SOURCE.DETAILS,
      dataQuality: QUALITY.DERIVED,
    });
  } else {
    na(
      "Issue Structure (Fresh vs OFS)",
      "Governance & Structure",
      "Fresh issue ≥ 60% of total",
      "Only the fresh-issue portion reaches the company. OFS money goes to selling shareholders.",
      "The fresh/OFS breakdown was not published in a parseable form, so the split could not be verified.",
      3,
    );
  }

  const promoterSellers = (d.ofsShareholders || []).filter((s) =>
    /promoter/i.test(s.category || ""),
  );
  const otherSellers = (d.ofsShareholders || []).filter(
    (s) => !/promoter/i.test(s.category || ""),
  );
  const prePromoterPct = parseFloat(d.details?.prePromoterHolding);
  const postPromoterPct = parseFloat(d.details?.postPromoterHolding);
  const promoterDilutionPp =
    Number.isFinite(prePromoterPct) && Number.isFinite(postPromoterPct)
      ? Number((prePromoterPct - postPromoterPct).toFixed(2))
      : undefined;

  if (d.ofsShareholders && d.ofsShareholders.length > 0) {
    const sellingCr = split.promoterOfsAmountCr;
    const promoterSelling = promoterSellers.length > 0;
    add({
      name: "Promoter Participation in OFS",
      category: "Governance & Structure",
      benchmark: "No promoter selling",
      actual: promoterSelling
        ? `${promoterSellers.length} promoter shareholder${promoterSellers.length > 1 ? "s" : ""} selling${
            sellingCr ? ` ${fmtCr(sellingCr)}` : ""
          }: ${promoterSellers.map((s) => s.name).join(", ")}`
        : `No promoter selling. Sellers are non-promoters: ${otherSellers.map((s) => s.name).join(", ") || "—"}`,
      verdict: promoterSelling ? VERDICT.CAUTION : VERDICT.PASS,
      weight: 4,
      whyItMatters:
        "Promoters selling into their own IPO is the single most-watched governance signal. It is not automatically bad — founders do monetise stakes — but it means the people who know the business best are reducing exposure at the offer price, which caps how much the price can be called cheap.",
      interpretation: promoterSelling
        ? `Promoters are participating in the Offer for Sale${
            sellingCr ? ` for ${fmtCr(sellingCr)}` : ""
          }. This is a Caution, not a Pass. ${
            typeof promoterDilutionPp === "number"
              ? `It is consistent with promoter holding falling ${promoterDilutionPp} percentage points (${prePromoterPct}% → ${postPromoterPct}%).`
              : ""
          }`
        : "No promoter is selling shares in this issue, so promoter economic interest is diluted only by the fresh issue.",
      source: SOURCE.OFS,
    });
  } else if (split.ofsCr) {
    na(
      "Promoter Participation in OFS",
      "Governance & Structure",
      "No promoter selling",
      "Promoters selling into their own IPO is the most-watched governance signal.",
      `This issue contains an OFS component of ${fmtCr(split.ofsCr)}, but the selling-shareholder table was not published, so whether promoters are selling could not be verified. Do not read this as "no promoter sale".`,
      4,
    );
  } else {
    add({
      name: "Promoter Participation in OFS",
      category: "Governance & Structure",
      benchmark: "No promoter selling",
      actual: "No OFS component in this issue",
      verdict: VERDICT.PASS,
      weight: 4,
      whyItMatters:
        "Promoters selling into their own IPO is the most-watched governance signal. With no OFS there is no seller at all.",
      interpretation:
        "The issue is entirely fresh capital, so no shareholder — promoter or otherwise — is selling.",
      source: SOURCE.DETAILS,
    });
  }

  if (Number.isFinite(postPromoterPct)) {
    add({
      name: "Promoter Holding Post-Issue",
      category: "Governance & Structure",
      benchmark: "≥ 60% retained",
      actual: `${Number.isFinite(prePromoterPct) ? `${prePromoterPct}% → ` : ""}${postPromoterPct}%`,
      verdict: band(postPromoterPct, 60, 45),
      weight: 3,
      whyItMatters:
        "Post-issue promoter holding is the promoter's remaining skin in the game. High retained holding aligns the promoter with minority shareholders; a low stake weakens that alignment and raises the risk of future selling pressure once lock-ins expire.",
      interpretation:
        postPromoterPct >= 60
          ? `Promoters retain ${postPromoterPct}% after listing, a controlling stake that keeps their interests aligned with yours.`
          : postPromoterPct >= 45
            ? `Promoters retain ${postPromoterPct}%. Still control, but the buffer above 50% is thin.`
            : `Promoters retain only ${postPromoterPct}%, which is limited skin in the game and leaves room for future stake sales.`,
      source: SOURCE.HOLDING,
    });

    if (typeof promoterDilutionPp === "number") {
      add({
        name: "Promoter Dilution",
        category: "Governance & Structure",
        benchmark: "≤ 15 percentage points",
        actual: `${promoterDilutionPp} pp (${prePromoterPct}% → ${postPromoterPct}%)`,
        verdict: band(promoterDilutionPp, 15, 25, true),
        weight: 2,
        whyItMatters:
          "How much the promoter gives up in one go indicates intent. A modest dilution is routine capital raising; a large one at the IPO stage means a meaningful ownership shift at the offer price.",
        interpretation: `Promoter holding falls by ${promoterDilutionPp} percentage points through this issue, from the fresh issue and any OFS combined.`,
        source: SOURCE.HOLDING,
        dataQuality: QUALITY.DERIVED,
      });
    }
  } else {
    na(
      "Promoter Holding Post-Issue",
      "Governance & Structure",
      "≥ 60% retained",
      "Post-issue promoter holding measures the promoter's remaining skin in the game.",
      "The shareholding structure table was not published for this issue.",
      3,
    );
  }

  const objects = d.objectsOfIssue || [];
  const objAmount = (o) => extractCr(o.amount) || 0;
  const objectsTotalCr = objects.reduce((s, o) => s + objAmount(o), 0);
  const matchCr = (re) =>
    objects
      .filter((o) => re.test(o.title || ""))
      .reduce((s, o) => s + objAmount(o), 0);
  const debtRepaymentCr = matchCr(/debt|repay|borrowing|prepay/i);
  const workingCapitalCr = matchCr(
    /working capital|inventory|margin requirement/i,
  );
  const capexCr = matchCr(
    /capex|capital expenditur|plant|machinery|manufactur|facilit|store|outlet|expansion|new unit/i,
  );
  const gcpCr = matchCr(/general corporate/i);
  const growthUseCr = Math.max(
    0,
    objectsTotalCr - debtRepaymentCr - workingCapitalCr,
  );

  if (objectsTotalCr > 0) {
    const debtShare = (debtRepaymentCr / objectsTotalCr) * 100;
    const buckets = [
      workingCapitalCr > 0
        ? `${fmtCr(workingCapitalCr)} working capital / inventory`
        : null,
      capexCr > 0 ? `${fmtCr(capexCr)} capex / expansion` : null,
      debtRepaymentCr > 0 ? `${fmtCr(debtRepaymentCr)} debt repayment` : null,
      gcpCr > 0 ? `${fmtCr(gcpCr)} general corporate purposes` : null,
    ].filter(Boolean);

    const growthShare = Number(
      ((growthUseCr / objectsTotalCr) * 100).toFixed(0),
    );
    add({
      name: "Use of Proceeds",
      category: "Governance & Structure",
      benchmark: "Debt repayment ≤ 40% of stated objects",
      actual: buckets.length
        ? buckets.join(" + ")
        : `${fmtCr(objectsTotalCr)} across stated objects`,
      verdict:
        debtRepaymentCr === 0 ? VERDICT.PASS : band(debtShare, 40, 70, true),
      weight: 2,
      whyItMatters:
        "What the company does with the money determines whether the raise creates value. Capex and expansion build earning capacity. Debt repayment strengthens the balance sheet but adds nothing new. Money that simply repairs the capital structure is worth less to a new shareholder than money that grows the business.",
      interpretation:
        debtRepaymentCr === 0
          ? `None of the stated objects repays debt, which is why this passes. Note separately that only ${growthShare}% of the ${fmtCr(objectsTotalCr)} disclosed goes to expansion or capex rather than working capital — that is scored under Working Capital Intensity below.`
          : `${debtShare.toFixed(0)}% of the disclosed objects (${fmtCr(debtRepaymentCr)}) repays borrowings rather than funding growth. ${growthShare}% goes to expansion or capex.`,
      source: SOURCE.OBJECTS,
    });

    if (typeof split.freshCr === "number" && split.freshCr > 0) {
      const wcShare = Number(
        ((workingCapitalCr / split.freshCr) * 100).toFixed(1),
      );
      if (workingCapitalCr > 0) {
        add({
          name: "Working Capital Intensity of Objects",
          category: "Governance & Structure",
          benchmark: "≤ 40% of fresh issue",
          actual: `${fmtCr(workingCapitalCr)} of ${fmtCr(split.freshCr)} fresh issue (${wcShare}%)`,
          verdict: band(wcShare, 40, 65, true),
          weight: 3,
          whyItMatters:
            "Working capital funding is consumed by the operating cycle rather than invested in durable capacity. A raise that mostly funds inventory tells you the business needs continuous cash to stand still, and that further growth will likely need further capital.",
          interpretation:
            wcShare > 65
              ? `${wcShare}% of the fresh issue funds working capital and inventory. This is a high-turnover, capital-hungry model: the money finances the operating cycle, not new earning capacity, and growth beyond this may require raising again.`
              : wcShare > 40
                ? `${wcShare}% of the fresh issue funds working capital. A meaningful share of the raise is absorbed by the operating cycle rather than expansion.`
                : `${wcShare}% of the fresh issue funds working capital, leaving most of the raise for growth uses.`,
          source: SOURCE.OBJECTS,
          dataQuality: QUALITY.DERIVED,
        });
      }
    }
  } else {
    na(
      "Use of Proceeds",
      "Governance & Structure",
      "Growth use preferred, debt repayment ≤ 40%",
      "What the company does with the money determines whether the raise creates value.",
      "The objects of the issue were not published with amounts.",
      3,
    );
  }

  const retailPct = d.reservation?.retail;
  const expectedRetail = d.category === "SME" ? 35 : 35;
  if (typeof retailPct === "number") {
    add({
      name: "Retail Reservation",
      category: "Governance & Structure",
      benchmark: `≈ ${expectedRetail}% of net issue`,
      actual: `${retailPct}% of net issue reserved for retail`,
      verdict: retailPct >= expectedRetail - 1 ? VERDICT.PASS : VERDICT.CAUTION,
      weight: 1,
      whyItMatters:
        "The retail quota sets your odds of allotment. A larger retail share means better allotment chances; a smaller one means the issue is skewed towards institutions and retail applicants face heavier scaling in an oversubscribed book.",
      interpretation: `${retailPct}% of the net issue is reserved for retail investors, ${
        retailPct >= expectedRetail - 1 ? "in line with" : "below"
      } the ${expectedRetail}% norm for this category.`,
      source: SOURCE.RESERVATION,
    });
  }

  const incomeLabel = f.totalIncomeSourceLabel || "Total Income";

  if (typeof f.totalIncomeGrowth === "number") {
    add({
      name: `${incomeLabel} Growth (YoY)`,
      category: "Growth",
      benchmark: "≥ 20% YoY",
      actual: `${fmtPct(f.totalIncomeGrowth)} (${fmtCr(f.totalIncome?.prev)} → ${fmtCr(f.totalIncome?.latest)})`,
      verdict: band(f.totalIncomeGrowth, 20, 8),
      weight: 3,
      whyItMatters:
        "Top-line growth shows whether demand for the product is expanding. It is the input every other financial metric depends on — margins and returns on a shrinking base rarely hold.",
      interpretation: `${incomeLabel} grew ${fmtPct(f.totalIncomeGrowth)} year on year. Note this is ${incomeLabel} as published by the source, which includes other income and is not the same as Revenue from Operations.`,
      source: SOURCE.FINANCIALS,
    });
  }

  if (typeof f.totalIncomeCagr === "number") {
    add({
      name: `${incomeLabel} CAGR`,
      category: "Growth",
      benchmark: "≥ 18% CAGR",
      actual: `${fmtPct(f.totalIncomeCagr)} over ${f.totalIncome?.spanYears} year${f.totalIncome?.spanYears > 1 ? "s" : ""} (${fmtCr(f.totalIncome?.oldest)} → ${fmtCr(f.totalIncome?.latest)})`,
      verdict: band(f.totalIncomeCagr, 18, 8),
      weight: 2,
      whyItMatters:
        "A single year can be flattered by a weak base or one large order. The multi-year compound rate shows whether growth is a trend or a spike — which matters because IPOs are usually priced off the most recent, strongest year.",
      interpretation: `Compounded ${fmtPct(f.totalIncomeCagr)} a year across the ${f.totalIncome?.spanYears + 1} periods the source publishes.`,
      source: SOURCE.FINANCIALS,
      dataQuality: QUALITY.DERIVED,
    });
  }

  if (typeof f.patGrowth === "number") {
    add({
      name: "Profit After Tax Growth (YoY)",
      category: "Growth",
      benchmark: "≥ 20% YoY",
      actual: `${fmtPct(f.patGrowth)} (${fmtCr(f.pat?.prev)} → ${fmtCr(f.pat?.latest)})`,
      verdict: band(f.patGrowth, 20, 8),
      weight: 3,
      whyItMatters:
        "Profit growth is what ultimately accrues to shareholders. Profit growing faster than the top line means operating leverage is working; growing slower means costs are eating the gains.",
      interpretation: `PAT grew ${fmtPct(f.patGrowth)} against ${incomeLabel} growth of ${fmtPct(f.totalIncomeGrowth)}, so profit is growing ${
        typeof f.totalIncomeGrowth === "number" &&
        f.patGrowth > f.totalIncomeGrowth
          ? "faster"
          : "slower"
      } than the top line.`,
      source: SOURCE.FINANCIALS,
    });
  }

  if (typeof f.patCagr === "number") {
    add({
      name: "Profit After Tax CAGR",
      category: "Growth",
      benchmark: "≥ 18% CAGR",
      actual: `${fmtPct(f.patCagr)} over ${f.pat?.spanYears} year${f.pat?.spanYears > 1 ? "s" : ""} (${fmtCr(f.pat?.oldest)} → ${fmtCr(f.pat?.latest)})`,
      verdict: band(f.patCagr, 18, 8),
      weight: 2,
      whyItMatters:
        "Multi-year profit compounding separates a durable earnings engine from a company that had one exceptional year just before filing.",
      interpretation: `Profit compounded ${fmtPct(f.patCagr)} a year. A very high figure here is often base-effect driven — check the oldest year (${fmtCr(f.pat?.oldest)}) before treating it as a run-rate.`,
      source: SOURCE.FINANCIALS,
      dataQuality: QUALITY.DERIVED,
    });
  }

  if (typeof f.operatingProfitGrowth === "number") {
    const srcLabel = f.operatingProfitSourceLabel || "EBITDA";
    add({
      name: "Operating Profit Growth (YoY)",
      category: "Growth",
      benchmark: "≥ 20% YoY",
      actual: `${fmtPct(f.operatingProfitGrowth)} (${fmtCr(f.operatingProfit?.prev)} → ${fmtCr(f.operatingProfit?.latest)})`,
      verdict: band(f.operatingProfitGrowth, 20, 8),
      weight: 2,
      whyItMatters:
        "Operating profit growth strips out financing and tax effects and shows whether the core business is improving. It is the cleanest read on whether the operation itself is getting better.",
      interpretation: `Operating profit grew ${fmtPct(f.operatingProfitGrowth)}. This figure comes from the row the source publishes as "${srcLabel}" — it is operating profit, and it may differ from the EBITDA/PBIDT reported in the RHP, which is typically higher because it includes other income. Do not quote it as reported EBITDA.`,
      source: SOURCE.FINANCIALS,
    });
  }

  const marginTrendText = (t) => {
    if (!t || typeof t.prev !== "number") return "";
    if (t.direction === "declining") return ` and declining from ${t.prev}%`;
    if (t.direction === "improving") return ` and improving from ${t.prev}%`;
    return ` and broadly flat versus ${t.prev}%`;
  };

  if (typeof f.operatingMargin === "number") {
    const trendDir =
      typeof f.operatingMarginPrev === "number"
        ? f.operatingMargin < f.operatingMarginPrev * 0.95
          ? "declining"
          : f.operatingMargin > f.operatingMarginPrev * 1.05
            ? "improving"
            : "flat"
        : "unknown";
    let verdict = band(f.operatingMargin, 12, 5);
    if (trendDir === "declining" && verdict !== VERDICT.FAIL)
      verdict = downgrade(verdict);

    add({
      name: "Operating Profit Margin",
      category: "Margins & Returns",
      benchmark: "≥ 12%, and not declining",
      actual: `${f.operatingMargin}%${
        typeof f.operatingMarginPrev === "number"
          ? ` (prior year ${f.operatingMarginPrev}%)`
          : ""
      }`,
      verdict,
      weight: 3,
      whyItMatters:
        "Margin is the buffer between the business and a bad year. A thin margin means small changes in input cost or selling price swing profit violently — a 0.4% margin business loses money on a 0.5% price move it cannot pass on.",
      interpretation:
        f.operatingMargin < 3
          ? `At ${f.operatingMargin}% this is a razor-thin margin, characteristic of a high-volume, low-value-add or trading-led model${trendDir === "declining" ? ", and it is contracting" : ""}. Profit is highly sensitive to input prices and pricing power. This is Operating Profit Margin, computed from operating profit over ${incomeLabel} — it is not a reported EBITDA margin.`
          : `Operating margin is ${f.operatingMargin}%${trendDir === "declining" ? ", down from the prior year" : trendDir === "improving" ? ", up from the prior year" : ""}. Computed from operating profit over ${incomeLabel}.`,
      source: SOURCE.DERIVED,
      dataQuality: QUALITY.DERIVED,
    });
  }

  if (kpi.patMargin) {
    let verdict = band(kpi.patMargin.latest, 8, 3);
    if (kpi.patMargin.direction === "declining" && verdict !== VERDICT.FAIL)
      verdict = downgrade(verdict);
    add({
      name: "PAT Margin",
      category: "Margins & Returns",
      benchmark: "≥ 8%, and not declining",
      actual: `${kpi.patMargin.latest}%${typeof kpi.patMargin.prev === "number" ? ` (prior year ${kpi.patMargin.prev}%)` : ""}`,
      verdict,
      weight: 3,
      whyItMatters:
        "Net margin is what actually survives to the bottom line after interest and tax. Very low net margins leave no room for error and make the business highly sensitive to volume, working capital cost and price competition.",
      interpretation:
        kpi.patMargin.latest < 2
          ? `A ${kpi.patMargin.latest}% net margin means roughly ₹${(kpi.patMargin.latest * 10).toFixed(0)} of profit per ₹1,000 of income${marginTrendText(kpi.patMargin)}. Profit depends on very high turnover holding up; any slippage in volume or spread hits earnings hard.`
          : `Net margin is ${kpi.patMargin.latest}%${marginTrendText(kpi.patMargin)}.`,
      source: SOURCE.KPI,
    });
  }

  const returnRatio = (t, name, passAt, cautionAt, why) => {
    if (!t) return;
    let verdict = band(t.latest, passAt, cautionAt);
    const sharpFall = typeof t.changePp === "number" && t.changePp <= -5;
    if (sharpFall && verdict === VERDICT.PASS) verdict = VERDICT.CAUTION;
    add({
      name,
      category: "Margins & Returns",
      benchmark: `≥ ${passAt}%, and not sharply declining`,
      actual: `${t.latest}%${typeof t.prev === "number" ? ` (prior year ${t.prev}%, ${t.changePp > 0 ? "+" : ""}${t.changePp} pp)` : ""}`,
      verdict,
      weight: 4,
      whyItMatters: why,
      interpretation: sharpFall
        ? `${t.latest}% is a high absolute return, but it has fallen ${Math.abs(t.changePp)} percentage points from ${t.prev}%. High but declining — the level is strong, the direction is not, and a large equity raise will dilute it further. Treated as a Caution rather than a clean Pass.`
        : typeof t.prev === "number"
          ? `${t.latest}% versus ${t.prev}% a year earlier (${t.changePp > 0 ? "+" : ""}${t.changePp} pp).`
          : `${t.latest}%. Only one period is published, so the trend cannot be checked.`,
      source: SOURCE.KPI,
    });
  };

  returnRatio(
    kpi.roe,
    "Return on Equity (ROE)",
    18,
    10,
    "ROE measures how much profit the business generates on shareholders' money. It is the core measure of capital efficiency — but read it with the trend, because a falling ROE on a rising equity base means new capital is earning less than old capital.",
  );
  returnRatio(
    kpi.roce,
    "Return on Capital Employed (ROCE)",
    18,
    10,
    "ROCE measures returns on all capital used, debt included, so it is harder to flatter with leverage than ROE. A wide gap between a high ROCE and a falling trend usually means the capital base is growing faster than profit.",
  );

  if (typeof f.netWorthGrowth === "number") {
    add({
      name: "Net Worth Growth",
      category: "Balance Sheet & Cash",
      benchmark: "Positive and growing",
      actual: `${fmtPct(f.netWorthGrowth)} (${fmtCr(f.netWorth?.prev)} → ${fmtCr(f.netWorth?.latest)})`,
      verdict: band(f.netWorthGrowth, 15, 0),
      weight: 2,
      whyItMatters:
        "Net worth growing through retained profit is the clearest sign the business is genuinely accumulating value rather than recycling capital. It is the balance-sheet counterpart to profit growth.",
      interpretation: `Net worth ${f.netWorthGrowth >= 0 ? "rose" : "fell"} ${fmtPct(Math.abs(f.netWorthGrowth))} to ${fmtCr(f.netWorth?.latest)}, driven by retained earnings.`,
      source: SOURCE.FINANCIALS,
    });
  }

  if (typeof f.assetGrowth === "number") {
    const netWorthUp =
      typeof f.netWorthGrowth === "number" && f.netWorthGrowth > 0;
    const debtDown = typeof f.debtGrowth === "number" && f.debtGrowth < 0;
    const benignContraction = f.assetGrowth < 0 && netWorthUp && debtDown;

    let verdict;
    if (f.assetGrowth >= 12) verdict = VERDICT.PASS;
    else if (f.assetGrowth >= 0) verdict = VERDICT.CAUTION;
    else verdict = benignContraction ? VERDICT.CAUTION : VERDICT.FAIL;

    add({
      name: "Asset Base Change",
      category: "Balance Sheet & Cash",
      benchmark: "Growing, or contracting only alongside stronger equity",
      actual: `${fmtPct(f.assetGrowth)} (${fmtCr(f.assets?.prev)} → ${fmtCr(f.assets?.latest)})`,
      verdict,
      weight: 2,
      whyItMatters:
        "A growing asset base usually accompanies a growing business. But asset size is not value: for trading, distribution and other high-turnover models the balance sheet expands and contracts with inventory and receivable timing, so a shrinking asset base is not by itself a business failure.",
      interpretation: benignContraction
        ? `The asset base contracted ${fmtPct(Math.abs(f.assetGrowth))}, but net worth rose ${fmtPct(f.netWorthGrowth)} and borrowings fell ${fmtPct(Math.abs(f.debtGrowth))} over the same period. For a high-turnover business that pattern reads as a leaner, less leveraged balance sheet rather than a shrinking business — so this is flagged as a Caution to investigate, not a failure. Check the inventory and receivables movement in the RHP to confirm.`
        : f.assetGrowth < 0
          ? `The asset base contracted ${fmtPct(Math.abs(f.assetGrowth))} without an offsetting improvement in equity or debt, which warrants a closer look at what left the balance sheet.`
          : `Assets ${f.assetGrowth >= 0 ? "grew" : "fell"} ${fmtPct(Math.abs(f.assetGrowth))} to ${fmtCr(f.assets?.latest)}.`,
      source: SOURCE.FINANCIALS,
    });
  }

  if (typeof f.debtGrowth === "number" && typeof f.assetGrowth === "number") {
    const verdict =
      f.debtGrowth < f.assetGrowth
        ? VERDICT.PASS
        : f.debtGrowth <= Math.abs(f.assetGrowth) * 1.2
          ? VERDICT.CAUTION
          : VERDICT.FAIL;
    add({
      name: "Debt Growth vs Asset Growth",
      category: "Balance Sheet & Cash",
      benchmark: "Debt growing slower than assets",
      actual: `Borrowings ${f.debtGrowth >= 0 ? "up" : "down"} ${fmtPct(Math.abs(f.debtGrowth))} vs assets ${f.assetGrowth >= 0 ? "up" : "down"} ${fmtPct(Math.abs(f.assetGrowth))}`,
      verdict,
      weight: 2,
      whyItMatters:
        "When borrowings grow faster than the assets they fund, the business is buying growth with leverage. That works until rates rise or demand slips, at which point fixed interest meets falling profit.",
      interpretation: `Borrowings ${f.debtGrowth >= 0 ? "grew" : "fell"} ${fmtPct(Math.abs(f.debtGrowth))} against an asset base that ${f.assetGrowth >= 0 ? "grew" : "fell"} ${fmtPct(Math.abs(f.assetGrowth))}, so leverage is ${f.debtGrowth < f.assetGrowth ? "falling" : "rising"} relative to the balance sheet.`,
      source: SOURCE.FINANCIALS,
    });
  }

  const de =
    typeof f.debtToEquity === "number"
      ? f.debtToEquity
      : kpi.debtEquity?.latest;
  if (typeof de === "number") {
    add({
      name: "Debt to Equity",
      category: "Balance Sheet & Cash",
      benchmark: "≤ 1.0x",
      actual: fmtX(de),
      verdict: band(de, 1.0, 2.0, true),
      weight: 3,
      whyItMatters:
        "Debt to equity is the solvency cushion. A low ratio means the business can absorb a bad year without a covenant problem; a high one means lenders, not shareholders, have the first claim on cash flow.",
      interpretation:
        de <= 0.25
          ? `At ${fmtX(de)} the balance sheet is effectively unlevered, so there is very little financial risk from borrowings.`
          : de <= 1
            ? `At ${fmtX(de)} leverage is comfortable.`
            : `At ${fmtX(de)} borrowings exceed equity, so interest cost is a material fixed claim on earnings.`,
      source: typeof f.debtToEquity === "number" ? SOURCE.DERIVED : SOURCE.KPI,
      dataQuality:
        typeof f.debtToEquity === "number" ? QUALITY.DERIVED : QUALITY.VERIFIED,
    });
  }

  if (f.hasOperatingCashFlow) {
    const ocf = f.operatingCashFlow;
    const patLatest = f.pat?.latest;
    const conversion =
      typeof ocf.latest === "number" &&
      typeof patLatest === "number" &&
      patLatest !== 0
        ? Number(((ocf.latest / patLatest) * 100).toFixed(0))
        : undefined;
    let verdict;
    if (ocf.latest < 0) verdict = VERDICT.FAIL;
    else if (typeof conversion === "number") verdict = band(conversion, 70, 35);
    else verdict = VERDICT.CAUTION;

    add({
      name: "Operating Cash Flow Quality",
      category: "Balance Sheet & Cash",
      benchmark: "Positive, ≥ 70% of PAT",
      actual: `${fmtCr(ocf.latest)}${typeof conversion === "number" ? ` (${conversion}% of PAT ${fmtCr(patLatest)})` : ""}`,
      verdict,
      weight: 4,
      whyItMatters:
        "Profit is an accounting opinion; cash is a fact. A company can report rising profit while cash drains into inventory and receivables. Negative operating cash flow alongside reported profit is one of the most reliable warning signs in a prospectus, because it means growth is being funded by someone else's money.",
      interpretation:
        ocf.latest < 0
          ? `Operating cash flow is negative at ${fmtCr(ocf.latest)} despite reported PAT of ${fmtCr(patLatest)}. The business consumed cash while booking profit — usually working capital absorbing more than earnings generate. This is a serious caution for a long-term holding, regardless of how strong the profit line looks.`
          : `Operating cash flow of ${fmtCr(ocf.latest)}${typeof conversion === "number" ? ` converts ${conversion}% of reported PAT into cash` : ""}.`,
      source: SOURCE.FINANCIALS,
    });
  } else {
    na(
      "Operating Cash Flow Quality",
      "Balance Sheet & Cash",
      "Positive, ≥ 70% of PAT",
      "Profit is an accounting opinion; cash is a fact. Negative operating cash flow alongside reported profit means growth is being funded by working capital rather than earnings — one of the most reliable warning signs in a prospectus.",
      "Chittorgarh does not publish a cash flow statement for this issue, so operating cash flow could not be verified. This is reported as Not Assessed and is excluded from the score — it is NOT a pass. For a working-capital-intensive business this is the single most important thing to check in the RHP before applying for the long term.",
      4,
    );
  }

  const peerSameType = (d.sectorPeers || []).filter((p) =>
    d.category === "SME"
      ? /sme/i.test(p.issueType || "")
      : /mainboard/i.test(p.issueType || ""),
  );
  const peerSet = peerSameType.length >= 3 ? peerSameType : d.sectorPeers || [];
  const peerMedianPe = median(peerSet.map((p) => p.peRatio));
  const peerMedianGain = median(peerSet.map((p) => p.listingGainPct));

  if (typeof f.pePost === "number") {
    add({
      name: "Post-Issue P/E",
      category: "Valuation",
      benchmark: "≤ 25x",
      actual: `${fmtX(f.pePost, 1)} post-issue${typeof f.pePre === "number" ? ` (pre-issue ${fmtX(f.pePre, 1)})` : ""}`,
      verdict: band(f.pePost, 25, 40, true),
      weight: 4,
      whyItMatters:
        "The P/E you pay at the offer price sets your starting yield and how much of the future is already in the price. A high multiple needs the growth to keep delivering; a modest one leaves room for error.",
      interpretation: `The issue is priced at ${fmtX(f.pePost, 1)} post-issue earnings${
        typeof f.epsPost === "number"
          ? `, on post-issue EPS of ₹${f.epsPost}`
          : ""
      }. ${
        f.pePost <= 25
          ? "That is a moderate multiple for a new listing."
          : "That is a demanding multiple, so the price already assumes continued execution."
      }`,
      source: SOURCE.VALUATION,
    });
  }

  if (typeof f.pePost === "number" && typeof peerMedianPe === "number") {
    const ratio = Number((f.pePost / peerMedianPe).toFixed(2));
    add({
      name: "P/E vs Recently Listed Sector Peers",
      category: "Valuation",
      benchmark: "At or below sector median",
      actual: `${fmtX(f.pePost, 1)} vs sector median ${fmtX(peerMedianPe, 1)} (${ratio}x median, ${peerSet.length} peers)`,
      verdict: band(ratio, 1.0, 1.5, true),
      weight: 3,
      whyItMatters:
        "An absolute multiple means little without a reference. Comparing the offer against what recently listed companies in the same sector were priced at shows whether you are paying a premium for the same kind of business.",
      interpretation: `Priced at ${ratio}x the median P/E of ${peerSet.length} recently listed ${d.sector || "sector"} issues (${fmtX(peerMedianPe, 1)}). ${
        ratio <= 1
          ? "That is at or below what comparable recent issues commanded."
          : `That is a ${((ratio - 1) * 100).toFixed(0)}% premium to comparable recent issues, which needs to be justified by better growth or returns.`
      } The peer set is small and drawn only from recent listings, so treat it as a sanity check rather than a full peer valuation.`,
      source: SOURCE.PEERS,
      dataQuality: QUALITY.DERIVED,
    });
  }

  const pb = kpi.priceToBook?.latest;
  if (typeof pb === "number") {
    add({
      name: "Price to Book",
      category: "Valuation",
      benchmark: "≤ 4.0x",
      actual: `${fmtX(pb)}${typeof kpi.nav?.latest === "number" ? ` (offer price vs NAV ₹${kpi.nav.latest})` : ""}`,
      verdict: band(pb, 4.0, 7.0, true),
      weight: 2,
      whyItMatters:
        "Price to book shows what you pay for each rupee of net assets. It matters most for balance-sheet-driven businesses; for asset-light ones a high multiple can be justified by returns, so read it next to ROE.",
      interpretation: `You are paying ${fmtX(pb)} book value${
        kpi.roe?.latest ? `, against an ROE of ${kpi.roe.latest}%` : ""
      }. ${pb > 4 ? "A premium to book that relies on return ratios staying high." : "A moderate multiple of net assets."}`,
      source: SOURCE.KPI,
    });
  }

  if (
    typeof f.epsPre === "number" &&
    typeof f.epsPost === "number" &&
    f.epsPre !== 0
  ) {
    const dilution = Number(
      (((f.epsPre - f.epsPost) / f.epsPre) * 100).toFixed(1),
    );
    add({
      name: "EPS Dilution from Issue",
      category: "Valuation",
      benchmark: "≤ 12%",
      actual: `${dilution}% (₹${f.epsPre} pre → ₹${f.epsPost} post)`,
      verdict: band(dilution, 12, 22, true),
      weight: 2,
      whyItMatters:
        "Issuing new shares spreads the same profit across a larger base, so earnings per share fall on day one. The size of that drop is the immediate cost of the raise to a shareholder, and it must be earned back by whatever the money funds.",
      interpretation: `EPS falls ${dilution}% from ₹${f.epsPre} to ₹${f.epsPost} purely from the new shares issued. The company has to deploy the fresh capital well enough to recover that before per-share earnings advance.`,
      source: SOURCE.VALUATION,
      dataQuality: QUALITY.DERIVED,
    });
  }

  const anchorPct = d.anchor?.allocationPct;
  if (typeof anchorPct === "number") {
    add({
      name: "Anchor Investor Participation",
      category: "Demand & Market",
      benchmark: "≥ 25% of issue",
      actual: `${anchorPct}% of total issue${d.anchor?.anchorPortionCr ? ` (${fmtCr(d.anchor.anchorPortionCr)})` : ""}`,
      verdict: band(anchorPct, 25, 12),
      weight: 3,
      whyItMatters:
        "Anchor investors commit a day before the book opens, after their own diligence and at the same price you pay. A well-subscribed anchor book is the earliest hard evidence of institutional conviction — and anchor shares are locked in, which limits immediate post-listing supply.",
      interpretation: `${anchorPct}% of the issue was placed with anchor investors${
        d.anchor?.anchorPortionCr
          ? ` for ${fmtCr(d.anchor.anchorPortionCr)}`
          : ""
      }. ${anchorPct >= 25 ? "A full anchor book indicates solid institutional appetite at this price." : "A modest anchor book suggests more measured institutional interest."} Note anchor lock-ins expire in stages after listing, which can add supply.`,
      source: SOURCE.ANCHOR,
    });
  }

  if (typeof d.reservation?.qib === "number") {
    add({
      name: "QIB Reservation Share",
      category: "Demand & Market",
      benchmark: "Context only",
      actual: `${d.reservation.qib}% reserved for QIBs`,
      verdict: VERDICT.INFO,
      weight: 0,
      whyItMatters:
        "A larger institutional quota means the price discovery is driven by professional investors, but it also means retail gets a smaller share of an oversubscribed book.",
      interpretation: `${d.reservation.qib}% of the net issue is reserved for qualified institutional buyers, with ${d.reservation.retail ?? "—"}% for retail.`,
      source: SOURCE.RESERVATION,
    });
  }

  if (d.subscription && typeof d.subscription.total === "number") {
    const s = d.subscription;
    add({
      name: "Subscription Demand",
      category: "Demand & Market",
      benchmark: "≥ 5x overall, retail ≥ 2x",
      actual: `Overall ${fmtX(s.total, 2)}${typeof s.qib === "number" ? ` · QIB ${fmtX(s.qib, 2)}` : ""}${typeof s.nii === "number" ? ` · NII ${fmtX(s.nii, 2)}` : ""}${typeof s.retail === "number" ? ` · Retail ${fmtX(s.retail, 2)}` : ""}`,
      verdict: band(s.total, 5, 1),
      weight: 4,
      whyItMatters:
        "Subscription multiples are real money bid at the offer price, which makes them the most direct demand signal available. The QIB number matters most — institutions do the deepest diligence — while a heavily oversubscribed book generally supports the listing price and a weak one pressures it.",
      interpretation: `The issue is subscribed ${fmtX(s.total, 2)} overall${
        typeof s.qib === "number"
          ? `, with the QIB book at ${fmtX(s.qib, 2)}`
          : ""
      }${typeof s.retail === "number" ? ` and retail at ${fmtX(s.retail, 2)}` : ""}. ${
        s.total >= 5
          ? "Strong aggregate demand, which usually supports the listing price."
          : s.total >= 1
            ? "The issue is covered but not strongly oversubscribed, so listing support is limited."
            : "The issue is undersubscribed, which is a significant warning on pricing."
      }${
        typeof s.retail === "number" &&
        typeof s.qib === "number" &&
        s.qib > s.retail * 5
          ? " Institutional demand far exceeds retail demand, so allotment odds for retail are better than the headline number suggests."
          : ""
      }`,
      source: SOURCE.SUBSCRIPTION,
    });
  } else {
    na(
      "Subscription Demand",
      "Demand & Market",
      "≥ 5x overall, retail ≥ 2x",
      "Subscription multiples are real money bid at the offer price — the most direct demand signal available.",
      d.status === "UPCOMING"
        ? "Bidding has not opened yet, so there is no subscription data. This will become available once the issue opens and is excluded from the score until then."
        : "Subscription figures were not published on the source page for this issue.",
      4,
      SOURCE.SUBSCRIPTION,
    );
  }

  if (d.brokerRecommendation) {
    const b = d.brokerRecommendation;
    const total = b.subscribe + b.mayApply + b.neutral + b.avoid;
    if (total > 0) {
      const ratio = Number(((b.subscribe / total) * 100).toFixed(0));
      add({
        name: "Broker Consensus",
        category: "Demand & Market",
        benchmark: "≥ 65% recommend Subscribe",
        actual: `${b.subscribe} of ${total} brokers recommend Subscribe (${ratio}%)${b.avoid ? `, ${b.avoid} Avoid` : ""}${b.neutral ? `, ${b.neutral} Neutral` : ""}`,
        verdict: band(ratio, 65, 40),
        weight: 2,
        whyItMatters:
          "Broker reviews are a rough sentiment gauge, not independent research. Many are published by firms distributing the issue, so a Subscribe-heavy tally tells you the sell side is positive — it does not verify the fundamentals.",
        interpretation: `${b.subscribe} of ${total} brokers tracked in the source's own recommendations table say Subscribe (${ratio}%). This is Chittorgarh's published tally quoted as-is, not an independently verified survey${
          b.memberVotes
            ? ", and it is separate from the site's member poll"
            : ""
        }. Treat it as sentiment, and weigh it below the audited financials above.`,
        source: SOURCE.BROKERS,
      });
    }
  } else {
    na(
      "Broker Consensus",
      "Demand & Market",
      "≥ 65% recommend Subscribe",
      "Broker reviews are a rough sentiment gauge, not independent research.",
      "No broker reviews were published for this issue at the time of reading.",
      2,
      SOURCE.BROKERS,
    );
  }

  if (typeof peerMedianGain === "number" && peerSet.length > 0) {
    add({
      name: "Sector Listing Track Record",
      category: "Demand & Market",
      benchmark: "Median peer listing gain > 10%",
      actual: `Median ${fmtPct(peerMedianGain)} across ${peerSet.length} recent ${d.sector || "sector"} listings (${peerSet.filter((p) => (p.listingGainPct ?? 0) > 0).length} of ${peerSet.length} positive)`,
      verdict: band(peerMedianGain, 10, 0),
      weight: 3,
      whyItMatters:
        "How recent issues in the same sector actually performed on listing day is real evidence of how the market is currently receiving this kind of business — far more informative than a general sentiment read.",
      interpretation: `Recent ${d.sector || "sector"} listings delivered a median ${fmtPct(peerMedianGain)} on debut, with ${peerSet.filter((p) => (p.listingGainPct ?? 0) > 0).length} of ${peerSet.length} closing above the offer price. ${
        peerMedianGain > 10
          ? "The sector has been receiving new issues well."
          : peerMedianGain > 0
            ? "Sector debuts have been positive but modest."
            : "Recent sector debuts have disappointed."
      } This is a small, recency-biased sample — it describes appetite, not this company's fundamentals.`,
      source: SOURCE.PEERS,
      dataQuality: QUALITY.DERIVED,
    });
  }

  add({
    name: "Overall Market Trend",
    category: "Demand & Market",
    benchmark: "Index positive",
    actual: marketTrend?.text || "Live index data unavailable",
    verdict: marketTrend?.verdict || VERDICT.NOT_ASSESSED,
    weight: 2,
    whyItMatters:
      "IPO listing performance correlates strongly with the broad market on the day. A falling index compresses listing gains regardless of how good the company is, which matters most if you are applying for a short-term gain.",
    interpretation: marketTrend?.text
      ? `${marketTrend.text}. This is a snapshot of the index at the time of reading, not a forecast — it can change completely before listing day.`
      : "The live index quote could not be read, so market context is unassessed.",
    source: SOURCE.MARKET,
    dataQuality: marketTrend?.text ? QUALITY.VERIFIED : QUALITY.UNAVAILABLE,
  });

  return params;
};

const RATING_TIERS = [
  { min: 82, rating: "STRONG APPLY" },
  { min: 72, rating: "APPLY FOR LISTING GAIN" },
  { min: 64, rating: "APPLY LONG TERM" },
  { min: 50, rating: "APPLY WITH CAUTION" },
  { min: 0, rating: "AVOID" },
];

const RATING_ORDER = [
  "AVOID",
  "APPLY WITH CAUTION",
  "APPLY LONG TERM",
  "APPLY FOR LISTING GAIN",
  "STRONG APPLY",
];

const ratingForScore = (score) =>
  RATING_TIERS.find((t) => score >= t.min).rating;

const scoreParameters = (params, d) => {
  const scored = params.filter(
    (p) => SCORED_VERDICTS.has(p.verdict) && p.weight > 0,
  );
  const weightTotal = scored.reduce((s, p) => s + p.weight, 0);
  const weightEarned = scored.reduce(
    (s, p) => s + p.weight * VERDICT_SCORE[p.verdict],
    0,
  );

  const rawScore =
    weightTotal > 0 ? Math.round((weightEarned / weightTotal) * 100) : 0;

  const counts = {
    pass: params.filter((p) => p.verdict === VERDICT.PASS).length,
    caution: params.filter((p) => p.verdict === VERDICT.CAUTION).length,
    fail: params.filter((p) => p.verdict === VERDICT.FAIL).length,
    notAssessed: params.filter((p) => p.verdict === VERDICT.NOT_ASSESSED)
      .length,
    info: params.filter((p) => p.verdict === VERDICT.INFO).length,
  };

  const f = d.financials || {};
  const kpi = f.kpi || {};
  const byName = (needle) =>
    params.find((p) => p.name.toLowerCase().includes(needle.toLowerCase()));

  const caps = [];
  const cap = (rating, reason) => caps.push({ cap: rating, reason });

  const patMarginLatest = kpi.patMargin?.latest;
  const thinMargin = typeof patMarginLatest === "number" && patMarginLatest < 3;
  const cashFlowParam = byName("Operating Cash Flow");

  if (cashFlowParam?.verdict === VERDICT.FAIL) {
    cap(
      "APPLY WITH CAUTION",
      "Operating cash flow is negative despite reported profit, so earnings are not converting into cash. That is a material caution for any long-term view.",
    );
  } else if (cashFlowParam?.verdict === VERDICT.NOT_ASSESSED && thinMargin) {
    cap(
      "APPLY WITH CAUTION",
      `Operating cash flow could not be verified from the source and the net margin is only ${patMarginLatest}%. On a thin-margin, working-capital-heavy business, cash conversion is the deciding factor — an unverified cash flow plus a razor-thin margin does not support an unqualified long-term Apply.`,
    );
  } else if (cashFlowParam?.verdict === VERDICT.NOT_ASSESSED) {
    cap(
      "APPLY FOR LISTING GAIN",
      "Operating cash flow could not be verified from the source, so a long-term recommendation cannot be fully supported on the available data.",
    );
  }

  const promoterParam = byName("Promoter Participation in OFS");
  const richVsPeers =
    byName("P/E vs Recently Listed Sector Peers")?.verdict !== VERDICT.PASS;
  if (promoterParam?.verdict === VERDICT.CAUTION && richVsPeers) {
    cap(
      "APPLY FOR LISTING GAIN",
      "Promoters are selling into the issue while it is priced at or above comparable recent listings. The combination limits how much of a long-term bargain this can be.",
    );
  }

  const roeDeclining = kpi.roe?.direction === "declining";
  const roceDeclining = kpi.roce?.direction === "declining";
  if (roeDeclining && roceDeclining) {
    cap(
      "APPLY LONG TERM",
      `Both ROE and ROCE fell year on year (ROE ${kpi.roe.prev}% → ${kpi.roe.latest}%, ROCE ${kpi.roce.prev}% → ${kpi.roce.latest}%). The absolute levels are high, but the direction argues against a top rating.`,
    );
  }

  if (counts.fail >= 6)
    cap("AVOID", `${counts.fail} parameters failed outright.`);
  else if (counts.fail >= 4)
    cap("APPLY WITH CAUTION", `${counts.fail} parameters failed outright.`);

  const rawRating = ratingForScore(rawScore);
  let rating = rawRating;
  const appliedCaps = [];
  for (const c of caps) {
    if (RATING_ORDER.indexOf(c.cap) < RATING_ORDER.indexOf(rating)) {
      rating = c.cap;
    }
    if (RATING_ORDER.indexOf(c.cap) < RATING_ORDER.indexOf(rawRating))
      appliedCaps.push(c);
  }

  const totalWeight = params.reduce((s, p) => s + p.weight, 0);
  const assessedWeight = weightTotal;
  const coveragePct =
    totalWeight > 0 ? Math.round((assessedWeight / totalWeight) * 100) : 0;
  const confidence =
    coveragePct >= 90 ? "High" : coveragePct >= 75 ? "Medium" : "Low";

  let overallRisk = "Low Risk";
  if (counts.fail >= 5 || rating === "AVOID") overallRisk = "High Risk";
  else if (counts.fail >= 3 || rating === "APPLY WITH CAUTION")
    overallRisk = "Medium-High Risk";
  else if (counts.fail >= 1 || counts.caution >= 5) overallRisk = "Medium Risk";

  return {
    aiScore: rawScore,
    rating,
    rawRating,
    appliedCaps,
    counts,
    weightTotal,
    weightEarned: Number(weightEarned.toFixed(1)),
    coveragePct,
    confidence,
    overallRisk,
    passedCount: counts.pass,
    scoredCount: scored.length,
  };
};

const buildFlags = (d, params) => {
  const f = d.financials || {};
  const kpi = f.kpi || {};
  const split = d.issueSplit || {};

  const green = [];
  const neutral = [];
  const red = [];

  const push = (list, label, detail) => list.push({ label, detail });

  if (typeof f.totalIncomeGrowth === "number") {
    const label = `${f.totalIncomeSourceLabel || "Total Income"} ${f.totalIncomeGrowth >= 0 ? "grew" : "fell"} ${Math.abs(f.totalIncomeGrowth)}% YoY (${fmtCr(f.totalIncome?.prev)} → ${fmtCr(f.totalIncome?.latest)})`;
    push(
      f.totalIncomeGrowth >= 15
        ? green
        : f.totalIncomeGrowth >= 0
          ? neutral
          : red,
      label,
      "Figure is Total Income as published by the source, which includes other income and is not Revenue from Operations.",
    );
  }
  if (typeof f.patGrowth === "number") {
    push(
      f.patGrowth >= 18 ? green : f.patGrowth >= 0 ? neutral : red,
      `Profit After Tax ${f.patGrowth >= 0 ? "grew" : "fell"} ${Math.abs(f.patGrowth)}% YoY (${fmtCr(f.pat?.prev)} → ${fmtCr(f.pat?.latest)})`,
    );
  }
  if (typeof f.netWorthGrowth === "number" && f.netWorthGrowth > 15) {
    push(
      green,
      `Net worth rose ${f.netWorthGrowth}% to ${fmtCr(f.netWorth?.latest)}`,
      "Retained earnings are accumulating on the balance sheet.",
    );
  }

  if (kpi.roe) {
    if (kpi.roe.direction === "declining" && typeof kpi.roe.prev === "number") {
      push(
        kpi.roe.latest >= 18 ? neutral : red,
        `ROE ${kpi.roe.latest}% — high but declining from ${kpi.roe.prev}% (${kpi.roe.changePp} pp)`,
        "Strong absolute level, weakening direction. The equity raise will dilute it further.",
      );
    } else if (kpi.roe.latest >= 18) {
      push(green, `ROE of ${kpi.roe.latest}%`);
    } else {
      push(kpi.roe.latest >= 10 ? neutral : red, `ROE of ${kpi.roe.latest}%`);
    }
  }
  if (kpi.roce) {
    if (
      kpi.roce.direction === "declining" &&
      typeof kpi.roce.prev === "number"
    ) {
      push(
        kpi.roce.latest >= 18 ? neutral : red,
        `ROCE ${kpi.roce.latest}% — high but declining from ${kpi.roce.prev}% (${kpi.roce.changePp} pp)`,
      );
    } else if (kpi.roce.latest >= 18) {
      push(green, `ROCE of ${kpi.roce.latest}%`);
    }
  }

  if (typeof kpi.patMargin?.latest === "number") {
    if (kpi.patMargin.latest < 2) {
      push(
        red,
        `Net margin of just ${kpi.patMargin.latest}%`,
        "Very thin margins leave little absorption for input-cost or pricing shocks.",
      );
    } else if (kpi.patMargin.latest >= 8) {
      push(green, `Net margin of ${kpi.patMargin.latest}%`);
    } else {
      push(neutral, `Net margin of ${kpi.patMargin.latest}%`);
    }
  }

  if (typeof f.debtToEquity === "number") {
    push(
      f.debtToEquity <= 0.5 ? green : f.debtToEquity <= 1.5 ? neutral : red,
      `Debt to equity of ${fmtX(f.debtToEquity)}`,
    );
  }
  if (typeof f.debtGrowth === "number" && f.debtGrowth < 0) {
    push(
      green,
      `Borrowings reduced ${Math.abs(f.debtGrowth)}% to ${fmtCr(f.borrowing?.latest)}`,
    );
  }

  const cashParam = params.find((p) => p.name.includes("Operating Cash Flow"));
  if (cashParam?.verdict === VERDICT.FAIL) {
    push(
      red,
      `Operating cash flow is negative (${fmtCr(f.operatingCashFlow?.latest)}) despite reported profit`,
      "Earnings are not converting into cash.",
    );
  } else if (cashParam?.verdict === VERDICT.NOT_ASSESSED) {
    push(
      neutral,
      "Operating cash flow not published by the source — unverified",
      "Not a positive and not a negative: it simply could not be checked. Verify it in the RHP.",
    );
  } else if (cashParam?.verdict === VERDICT.PASS) {
    push(
      green,
      `Operating cash flow of ${fmtCr(f.operatingCashFlow?.latest)} backs the reported profit`,
    );
  }

  if (typeof split.freshPct === "number") {
    if (!split.ofsCr) {
      push(
        green,
        `100% fresh issue — the full ${fmtCr(split.freshCr)} goes to the company`,
      );
    } else {
      push(
        neutral,
        `${split.structureLabel}: ${split.freshPct}% fresh (${fmtCr(split.freshCr)}) + ${split.ofsPct}% OFS (${fmtCr(split.ofsCr)})`,
        "The OFS portion goes to selling shareholders, not the company. It is neutral, not a positive.",
      );
    }
  }
  if (split.promoterSellerNames?.length) {
    push(
      red,
      `Promoters selling ${fmtCr(split.promoterOfsAmountCr)} in the OFS (${split.promoterSellerNames.join(", ")})`,
      "The people closest to the business are reducing their stake at the offer price.",
    );
  }

  if (d.details?.postPromoterHolding) {
    const post = parseFloat(d.details.postPromoterHolding);
    if (Number.isFinite(post)) {
      push(
        post >= 60 ? green : post >= 45 ? neutral : red,
        `Promoter holding of ${d.details.postPromoterHolding} post-issue`,
      );
    }
  }

  if (typeof f.pePost === "number") {
    const peerParam = params.find((p) =>
      p.name.includes("P/E vs Recently Listed"),
    );
    if (peerParam?.verdict === VERDICT.PASS)
      push(
        green,
        `Post-issue P/E of ${fmtX(f.pePost, 1)}, at or below recent sector listings`,
      );
    else if (peerParam)
      push(
        peerParam.verdict === VERDICT.FAIL ? red : neutral,
        `Post-issue P/E ${peerParam.actual}`,
      );
    else
      push(
        f.pePost <= 25 ? green : f.pePost <= 40 ? neutral : red,
        `Post-issue P/E of ${fmtX(f.pePost, 1)}`,
      );
  }

  if (typeof d.subscription?.total === "number") {
    push(
      d.subscription.total >= 5
        ? green
        : d.subscription.total >= 1
          ? neutral
          : red,
      `Issue subscribed ${fmtX(d.subscription.total, 2)} overall`,
    );
  }
  if (typeof d.anchor?.allocationPct === "number") {
    push(
      d.anchor.allocationPct >= 25 ? green : neutral,
      `${d.anchor.allocationPct}% of the issue placed with anchor investors`,
    );
  }
  if (d.brokerRecommendation) {
    const b = d.brokerRecommendation;
    const total = b.subscribe + b.mayApply + b.neutral + b.avoid;
    if (total > 0) {
      push(
        neutral,
        `${b.subscribe} of ${total} brokers say Subscribe (as published by the source)`,
        "Sell-side sentiment quoted from the source's own table, not independently verified.",
      );
    }
  }

  return { green, neutral, red };
};

const COMMODITY_SECTOR =
  /gems|jewel|bullion|gold|silver|metal|mining|steel|oil|gas|chemical|sugar|agri|commodit|cement|textile/i;

const buildRisks = (d, params) => {
  const f = d.financials || {};
  const kpi = f.kpi || {};
  const split = d.issueSplit || {};
  const risks = [];
  const addRisk = (severity, title, description) =>
    risks.push({ severity, title, description });

  const cashParam = params.find((p) => p.name.includes("Operating Cash Flow"));
  const patMargin = kpi.patMargin?.latest;
  const thinMargin = typeof patMargin === "number" && patMargin < 3;

  if (cashParam?.verdict === VERDICT.FAIL) {
    addRisk(
      "High Risk",
      "Negative Operating Cash Flow",
      `Operating cash flow was ${fmtCr(f.operatingCashFlow?.latest)} against reported PAT of ${fmtCr(f.pat?.latest)}. The business consumed cash while booking profit, which means growth is being funded by working capital and external money rather than earnings.`,
    );
  } else if (cashParam?.verdict === VERDICT.NOT_ASSESSED) {
    addRisk(
      thinMargin ? "High Risk" : "Medium Risk",
      "Cash Flow Quality Unverified",
      `The source does not publish a cash flow statement for this issue, so it could not be confirmed whether reported profit converts into cash.${
        thinMargin
          ? ` With a net margin of only ${patMargin}%, cash conversion is the deciding variable for this business.`
          : ""
      } Read the cash flow statement in the RHP before treating the profit growth above at face value.`,
    );
  }

  if (thinMargin) {
    addRisk(
      "High Risk",
      "Structurally Thin Margins",
      `Net margin is ${patMargin}%${typeof f.operatingMargin === "number" ? ` and operating margin ${f.operatingMargin}%` : ""}. At that level a small adverse move in input cost, selling spread or volume can erase profit entirely. The model depends on very high turnover holding up.`,
    );
  }

  const wcParam = params.find((p) =>
    p.name.includes("Working Capital Intensity"),
  );
  if (wcParam && wcParam.verdict !== VERDICT.PASS) {
    addRisk(
      wcParam.verdict === VERDICT.FAIL ? "High Risk" : "Medium Risk",
      "Working Capital Dependence",
      `${wcParam.actual} funds working capital and inventory rather than durable capacity. Cash is absorbed by the operating cycle, and further growth may require further capital raising or borrowing.`,
    );
  }

  if (d.sector && COMMODITY_SECTOR.test(d.sector)) {
    addRisk(
      thinMargin ? "High Risk" : "Medium Risk",
      "Input Price Volatility",
      `The company operates in ${d.sector}, where the price of the underlying commodity moves independently of the business. Inventory is exposed to those swings, and on a ${
        typeof patMargin === "number" ? `${patMargin}%` : "thin"
      } net margin an unhedged price move can matter more to profit than trading volume does. Check the hedging policy and inventory valuation basis in the RHP.`,
    );
  }

  if (split.promoterSellerNames?.length) {
    addRisk(
      "Medium Risk",
      "Promoter Stake Sale in the Issue",
      `${split.promoterSellerNames.length} promoter shareholder${split.promoterSellerNames.length > 1 ? "s are" : " is"} selling ${fmtCr(split.promoterOfsAmountCr)} through the Offer for Sale (${split.promoterSellerNames.join(", ")}). That money leaves with them rather than funding the business, and promoter holding falls to ${d.details?.postPromoterHolding || "—"}.`,
    );
  }

  if (
    kpi.roe?.direction === "declining" &&
    kpi.roce?.direction === "declining"
  ) {
    addRisk(
      "Medium Risk",
      "Declining Return Ratios",
      `ROE fell from ${kpi.roe.prev}% to ${kpi.roe.latest}% and ROCE from ${kpi.roce.prev}% to ${kpi.roce.latest}%. The absolute levels remain high, but returns on capital are compressing — and the fresh equity from this issue will dilute them further before it earns anything.`,
    );
  }

  const peerParam = params.find((p) =>
    p.name.includes("P/E vs Recently Listed"),
  );
  if (peerParam?.verdict === VERDICT.FAIL) {
    addRisk(
      "High Risk",
      "Valuation Premium to Sector",
      `${peerParam.actual}. The price already assumes this company outperforms its recently listed peers.`,
    );
  } else if (typeof f.pePost === "number" && f.pePost > 40) {
    addRisk(
      "High Risk",
      "Elevated Valuation",
      `Post-issue P/E of ${fmtX(f.pePost, 1)} is demanding for a new listing and leaves little margin for execution slippage.`,
    );
  } else if (peerParam?.verdict === VERDICT.CAUTION) {
    addRisk(
      "Medium Risk",
      "Valuation Above Sector Median",
      `${peerParam.actual}.`,
    );
  }

  if (typeof f.assetGrowth === "number" && f.assetGrowth < -15) {
    addRisk(
      "Medium Risk",
      "Contracting Asset Base",
      `Total assets fell ${fmtPct(Math.abs(f.assetGrowth))} to ${fmtCr(f.assets?.latest)}. ${
        typeof f.netWorthGrowth === "number" && f.netWorthGrowth > 0
          ? `Net worth rose ${fmtPct(f.netWorthGrowth)} over the same period, so this looks like balance-sheet leaning rather than a shrinking business — but the composition of the decline should be confirmed in the RHP.`
          : "Confirm in the RHP what left the balance sheet."
      }`,
    );
  }

  if (
    typeof f.debtGrowth === "number" &&
    typeof f.assetGrowth === "number" &&
    f.debtGrowth > Math.abs(f.assetGrowth) * 1.2 &&
    f.debtGrowth > 0
  ) {
    addRisk(
      "Medium Risk",
      "Rising Leverage",
      `Borrowings grew ${fmtPct(f.debtGrowth)} against asset growth of ${fmtPct(f.assetGrowth)}, so debt is expanding faster than the base it funds.`,
    );
  }

  const post = parseFloat(d.details?.postPromoterHolding);
  if (Number.isFinite(post) && post < 50) {
    addRisk(
      "Medium Risk",
      "Low Promoter Holding",
      `Promoter holding of ${d.details.postPromoterHolding} post-issue leaves limited skin in the game and allows future stake sales without losing control.`,
    );
  }

  if (typeof d.subscription?.total === "number" && d.subscription.total < 1) {
    addRisk(
      "High Risk",
      "Undersubscribed Issue",
      `The book is subscribed only ${fmtX(d.subscription.total, 2)}, indicating the market is not accepting the offer price.`,
    );
  }

  if (d.category === "SME") {
    addRisk(
      "Medium Risk",
      "SME Liquidity and Lot Size",
      "SME-platform stocks trade in large minimum lots with thin volumes. Exiting a position can be difficult and price moves are exaggerated in both directions.",
    );
  }

  addRisk(
    "Low Risk",
    "Post-Listing Price Volatility",
    `Any new listing can trade well below its offer price. Anchor lock-ins${d.anchor?.anchorPortionCr ? ` on the ${fmtCr(d.anchor.anchorPortionCr)} anchor book` : ""} expire in stages after listing, which can add supply. The grey-market premium is not used anywhere in this analysis and should not be relied on.`,
  );

  return risks.map((r, i) => ({
    id: i + 1,
    ...r,
    title: `${i + 1}. ${r.title}`,
  }));
};

const buildResultGuide = (d, params, scoring) => {
  const categoryWeights = {};
  const categoryDesigned = {};
  for (const p of params) {
    if (!p.weight) continue;
    categoryDesigned[p.category] =
      (categoryDesigned[p.category] || 0) + p.weight;
    if (!SCORED_VERDICTS.has(p.verdict)) continue;
    categoryWeights[p.category] = (categoryWeights[p.category] || 0) + p.weight;
  }
  const totalWeight =
    Object.values(categoryWeights).reduce((a, b) => a + b, 0) || 1;

  return {
    howScoreWorks: [
      `Each parameter is scored Pass (full weight), Caution (half weight) or Fail (zero), then weighted by how much it actually matters. Cash flow, return ratios, valuation and real bid demand carry the heaviest weights; sentiment items carry the least.`,
      `This issue scored ${scoring.weightEarned} of ${scoring.weightTotal} available weight across ${scoring.scoredCount} scored parameters, which is ${scoring.aiScore}/100.`,
      `Anything the source does not publish is marked "Not Assessed" and excluded from the denominator, so a missing figure never counts as a pass. ${scoring.counts.notAssessed} parameter${scoring.counts.notAssessed === 1 ? " was" : "s were"} unassessable here, giving ${scoring.coveragePct}% data coverage and ${scoring.confidence} confidence.`,
    ],
    verdictLegend: [
      {
        verdict: "Pass",
        meaning: "The figure meets or beats the benchmark for this parameter.",
      },
      {
        verdict: "Caution",
        meaning:
          "The figure is acceptable but weaker than the benchmark, or the level is fine while the trend is deteriorating.",
      },
      {
        verdict: "Fail",
        meaning: "The figure misses the benchmark materially.",
      },
      {
        verdict: "Not Assessed",
        meaning:
          "The source does not publish this data. Excluded from the score — treat it as an open question, not a pass.",
      },
      {
        verdict: "Info",
        meaning: "Context that shapes interpretation but is not scored.",
      },
    ],
    ratingScale: [
      {
        rating: "STRONG APPLY",
        band: "82–100",
        meaning:
          "Fundamentals, valuation and demand all support the issue with no disqualifying gaps.",
      },
      {
        rating: "APPLY FOR LISTING GAIN",
        band: "72–81",
        meaning:
          "Demand and pricing look supportive for a debut, but something limits the long-term case.",
      },
      {
        rating: "APPLY LONG TERM",
        band: "64–71",
        meaning:
          "Business quality supports holding, though the entry price or a specific weakness caps the upside.",
      },
      {
        rating: "APPLY WITH CAUTION",
        band: "50–63",
        meaning:
          "Real positives exist alongside at least one material unresolved concern. Size the position accordingly.",
      },
      {
        rating: "AVOID",
        band: "Below 50",
        meaning: "Weaknesses outweigh the positives on the available data.",
      },
    ],
    ratingAdjustment:
      scoring.appliedCaps.length > 0
        ? {
            rawRating: scoring.rawRating,
            finalRating: scoring.rating,
            explanation: `The weighted score of ${scoring.aiScore}/100 alone maps to "${scoring.rawRating}". The final rating was capped at "${scoring.rating}" because a weighted average can dilute a single disqualifying fact. Each cap is listed below.`,
            caps: scoring.appliedCaps,
          }
        : {
            rawRating: scoring.rawRating,
            finalRating: scoring.rating,
            explanation: `The weighted score of ${scoring.aiScore}/100 maps directly to "${scoring.rating}". No rating caps were triggered.`,
            caps: [],
          },
    weightByCategory: Object.entries(categoryDesigned)
      .map(([category, designedWeight]) => {
        const weight = categoryWeights[category] || 0;
        return {
          category,
          weight,
          designedWeight,
          unassessedWeight: designedWeight - weight,
          sharePct: Number(((weight / totalWeight) * 100).toFixed(0)),
        };
      })
      .sort((a, b) => b.designedWeight - a.designedWeight),
    dataSources: [
      `All company figures are scraped live from this issue's Chittorgarh page (${d.sourceUrl || "source page"}) at the time you loaded this analysis.`,
      `Financial figures are the restated numbers Chittorgarh publishes. Row labels are kept exactly as published — "Total Income" is reported as Total Income, not as Revenue from Operations, because it includes other income.`,
      `Market context comes from a live NSE Nifty 50 quote. Broker counts are Chittorgarh's own published tally, quoted as-is.`,
    ],
    limitations: [
      "This is a rules-based reading of published figures, not investment advice, and not a price forecast.",
      "Only what the source publishes can be checked. Cash flow statements, segment detail, related-party transactions, contingent liabilities and litigation are usually absent — read the RHP for those.",
      "Growth and return figures are historical and pre-IPO. The fresh equity from this issue dilutes return ratios before it earns anything.",
      "Sector peer comparisons use a small, recency-biased set of recent listings, so treat them as a sanity check rather than a full valuation.",
      "Grey-market premium is deliberately not used anywhere in this analysis. It is unregulated, unverifiable and a poor predictor of where a stock settles.",
      ...(d.dataNotes || []),
    ],
  };
};

const analyseIpo = (d, marketTrend) => {
  const parameters = buildParameters(d, marketTrend);
  const scoring = scoreParameters(parameters, d);
  const flags = buildFlags(d, parameters);
  const risks = buildRisks(d, parameters);
  const resultGuide = buildResultGuide(d, parameters, scoring);

  return { parameters, scoring, flags, risks, resultGuide };
};

module.exports = {
  analyseIpo,
  buildParameters,
  scoreParameters,
  buildFlags,
  buildRisks,
  buildResultGuide,
  ratingForScore,
  VERDICT,
  QUALITY,
  SOURCE,
  extractCr,
  median,
  fmtCr,
  fmtPct,
  fmtX,
};
