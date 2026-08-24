const { getQuote, getChartSeries } = require("../services/stockService");
const { computeTechnicals } = require("../services/technicals");
const {
  fetchChittorgarhIpoDetails,
  fetchLiveIpoListFromChittorgarh,
  fetchListedIpoTrackRecord,
} = require("../services/chittorgarhService");
const { analyseIpo, extractCr, VERDICT } = require("../services/ipoFramework");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const getMarketTrendText = async () => {
  try {
    const quote = await getQuote("^NSEI");
    const pct = quote.percentChange ?? 0;
    if (pct >= 0.5) return { text: `Nifty 50 up ${pct.toFixed(2)}% today — markets in a positive trend`, verdict: "Pass" };
    if (pct >= -0.5) return { text: `Nifty 50 ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(2)}% today — broadly flat`, verdict: "Caution" };
    return { text: `Nifty 50 down ${Math.abs(pct).toFixed(2)}% today — markets under pressure`, verdict: "Fail" };
  } catch {
    return { text: "Live market index data unavailable", verdict: "Caution" };
  }
};

const CATEGORY_SUMMARY_MAP = [
  { label: "Issue Structure", match: "Issue Structure", strong: "Fresh-Issue Led", weak: "OFS Dominated", mixed: "Mixed Fresh + OFS" },
  { label: "Promoter Selling", match: "Promoter Participation in OFS", strong: "No Promoter Sale", weak: "Promoter Sale", mixed: "Promoter Sale" },
  { label: "Promoter Holding", match: "Promoter Holding Post-Issue", strong: "Strong", weak: "Low", mixed: "Monitorable" },
  { label: "Use of Proceeds", match: "Use of Proceeds", strong: "No Debt Repayment", weak: "Debt Heavy", mixed: "Partly Debt Repayment" },
  { label: "Working Capital Intensity", match: "Working Capital Intensity", strong: "Low", weak: "High", mixed: "Elevated" },
  { label: "Top-Line Growth", match: "Growth (YoY)", strong: "Strong", weak: "Weak", mixed: "Moderate" },
  { label: "Profit Growth", match: "Profit After Tax Growth", strong: "Strong", weak: "Weak", mixed: "Moderate" },
  { label: "Margins", match: "PAT Margin", strong: "Healthy", weak: "Thin", mixed: "Thin" },
  { label: "Return Ratios (ROE)", match: "Return on Equity", strong: "Strong", weak: "Weak", mixed: "High but Declining" },
  { label: "Leverage", match: "Debt to Equity", strong: "Healthy", weak: "High Leverage", mixed: "Monitorable" },
  { label: "Cash Flow Quality", match: "Operating Cash Flow", strong: "Cash Backed", weak: "Cash Negative", mixed: "Unverified" },
  { label: "Valuation vs Peers", match: "P/E vs Recently Listed", strong: "At/Below Sector", weak: "Rich", mixed: "Above Sector Median" },
  { label: "Institutional Demand", match: "Anchor Investor Participation", strong: "Strong", weak: "Weak", mixed: "Moderate" },
  { label: "Bid Demand", match: "Subscription Demand", strong: "Strong", weak: "Weak", mixed: "Awaiting Bidding" },
  { label: "Sector Reception", match: "Sector Listing Track Record", strong: "Positive", weak: "Negative", mixed: "Mixed" },
];

const buildCategorySummary = (parameters, overallRisk) => {
  const rows = CATEGORY_SUMMARY_MAP.map(({ label, match, strong, weak, mixed }) => {
    const p = parameters.find((x) => x.name.includes(match));
    if (!p) return undefined;
    if (p.verdict === VERDICT.PASS) return { category: label, status: strong, type: "strong", driver: p.name };
    if (p.verdict === VERDICT.FAIL) return { category: label, status: weak, type: "weak", driver: p.name };
    if (p.verdict === VERDICT.NOT_ASSESSED) return { category: label, status: "Not Assessed", type: "unknown", driver: p.name };
    return { category: label, status: mixed, type: "mixed", driver: p.name };
  }).filter(Boolean);

  rows.push({
    category: "Overall Risk Profile",
    status: overallRisk,
    type: overallRisk === "Low Risk" ? "strong" : overallRisk === "High Risk" ? "weak" : "mixed",
    driver: "Derived from all parameter verdicts",
  });

  return rows;
};

const buildHighlights = (d, flags) => flags.green.map((g) => g.label);

const buildClosingSummary = (d, scoring) => {
  const f = d.financials || {};
  const bits = [
    `${d.name} scores ${scoring.aiScore}/100 on ${scoring.scoredCount} scored parameters (${scoring.counts.pass} Pass, ${scoring.counts.caution} Caution, ${scoring.counts.fail} Fail, ${scoring.counts.notAssessed} Not Assessed).`,
    typeof f.totalIncomeGrowth === "number"
      ? `${f.totalIncomeSourceLabel || "Total Income"} growth ${f.totalIncomeGrowth}%`
      : undefined,
    typeof f.patGrowth === "number" ? `PAT growth ${f.patGrowth}%` : undefined,
    typeof f.kpi?.patMargin?.latest === "number" ? `net margin ${f.kpi.patMargin.latest}%` : undefined,
    typeof f.pePost === "number" ? `post-issue P/E ${f.pePost}x` : undefined,
  ].filter(Boolean);

  const metrics = bits.slice(1).join(", ");
  const capNote = scoring.appliedCaps.length
    ? ` The weighted score alone would read "${scoring.rawRating}"; the rating is capped at "${scoring.rating}" because ${scoring.appliedCaps.length} disqualifying condition${scoring.appliedCaps.length > 1 ? "s were" : " was"} triggered.`
    : "";

  return `${bits[0]}${metrics ? ` Key figures: ${metrics}.` : ""} Data coverage ${scoring.coveragePct}% (${scoring.confidence} confidence).${capNote}`;
};

const toCardSummary = (d, marketTrend) => {
  const { parameters, scoring, flags, risks } = analyseIpo(d, marketTrend);
  const totalIssueCr = d.issueSplit?.totalCr ?? extractCr(d.details.totalIssueSize);

  return {
    id: d.id,
    name: d.name,
    symbol: d.id,
    logoUrl: d.logoUrl,
    category: d.category,
    sector: d.sector,
    status: d.status,
    allotmentStatusUrl: d.allotmentStatusUrl,
    sourceUrl: d.sourceUrl,
    issuePrice: d.issuePrice,
    lotSize: parseInt((d.details.lotSize || "").replace(/[^0-9]/g, ""), 10) || undefined,
    issueSize: totalIssueCr ? `₹${totalIssueCr.toLocaleString("en-IN")} Cr` : d.details.totalIssueSize,
    issueSplit: d.issueSplit,
    openDate: d.dates.openDate,
    closeDate: d.dates.closeDate,
    listingDate: d.dates.listingDate,
    allotmentDate: d.dates.allotmentDate,
    reservation: d.reservation,
    subscription: d.subscription,
    brokerRecommendation: d.brokerRecommendation,

    aiScore: scoring.aiScore,
    rating: scoring.rating,
    rawRating: scoring.rawRating,
    confidence: scoring.confidence,
    coveragePct: scoring.coveragePct,
    verdictCounts: scoring.counts,
    aiVerdict: `${d.name} scores ${scoring.aiScore}/100 across ${scoring.scoredCount} weighted parameters sourced live from Chittorgarh (${scoring.counts.pass} Pass · ${scoring.counts.caution} Caution · ${scoring.counts.fail} Fail · ${scoring.counts.notAssessed} Not Assessed). Rating: ${scoring.rating}.`,

    parameters,
    // Legacy key kept so existing clients keep rendering; it is the same array.
    parameters20: parameters,
    passedCount: scoring.passedCount,
    parameterCount: parameters.length,

    swot: {
      strengths: flags.green.map((g) => g.label).slice(0, 4),
      risks: risks.filter((r) => r.severity !== "Low Risk").map((r) => r.description).slice(0, 3),
    },
  };
};

const getIpoAnalysis = asyncHandler(async (req, res) => {
  const category = ["MAINBOARD", "SME"].includes((req.query.category || "").toUpperCase())
    ? req.query.category.toUpperCase()
    : undefined;

  const [liveList, marketTrend] = await Promise.all([fetchLiveIpoListFromChittorgarh(category), getMarketTrendText()]);
  const ipoResults = liveList.map((d) => toCardSummary(d, marketTrend));

  const brokerBacked = ipoResults.filter((i) => i.brokerRecommendation);
  const avgSubscribeRatio =
    brokerBacked.length > 0
      ? Number(
          (
            brokerBacked.reduce((acc, i) => {
              const { subscribe, mayApply, neutral, avoid } = i.brokerRecommendation;
              const total = subscribe + mayApply + neutral + avoid;
              return acc + (total > 0 ? (subscribe / total) * 100 : 0);
            }, 0) / brokerBacked.length
          ).toFixed(1),
        )
      : undefined;

  res.status(200).json(
    new ApiResponse(200, "IPO analysis fetched from Chittorgarh.", {
      summary: {
        activeIposCount: ipoResults.length,
        avgBrokerSubscribeRatio: avgSubscribeRatio,
        topPick: ipoResults.slice().sort((a, b) => b.aiScore - a.aiScore)[0]?.name,
        marketSentiment:
          avgSubscribeRatio === undefined ? "N/A" : avgSubscribeRatio >= 60 ? "BULLISH" : avgSubscribeRatio >= 40 ? "MODERATE" : "CAUTIOUS",
        marketTrend: marketTrend?.text,
        dataSource: "Chittorgarh IPO pages, scraped live per request",
      },
      ipos: ipoResults,
    }),
  );
});

const getDeepIpoAnalysis = asyncHandler(async (req, res) => {
  const { symbol: id } = req.params;
  if (!id) throw new ApiError(400, "IPO id is required.");

  let d;
  try {
    d = await fetchChittorgarhIpoDetails(id);
  } catch (err) {
    throw new ApiError(404, `Could not find IPO "${id}" on Chittorgarh: ${err.message}`);
  }

  const marketTrend = await getMarketTrendText();
  const { parameters, scoring, flags, risks, resultGuide } = analyseIpo(d, marketTrend);
  const { financials } = d;

  const financialCards = (financials.periods || []).map((period, idx) => ({
    period,
    totalIncome: financials.incomeSeries?.[idx],
    pat: financials.patSeries?.[idx],
    operatingProfit: financials.operatingProfitSeries?.[idx],
    netWorth: financials.netWorthSeries?.[idx],
    assets: financials.assetsSeries?.[idx],
    borrowing: financials.borrowingSeries?.[idx],
  }));

  res.status(200).json(
    new ApiResponse(200, "Deep IPO analysis fetched from Chittorgarh.", {
      company: {
        name: d.name,
        symbol: d.id,
        category: d.category,
        sector: d.sector,
        status: d.status,
        logoUrl: d.logoUrl,
        sourceUrl: d.sourceUrl,
        allotmentStatusUrl: d.allotmentStatusUrl,
        about: d.about,
        details: d.details,
        dates: d.dates,
        lotBreakup: d.lotBreakup,
        reservation: d.reservation,
        anchor: d.anchor,
        objectsOfIssue: d.objectsOfIssue,
        ofsShareholders: d.ofsShareholders,
        expenses: d.expenses,
        brokerRecommendation: d.brokerRecommendation,
        subscription: d.subscription,
        sectorPeers: d.sectorPeers,
        issueSplit: d.issueSplit,

        financials,
        financialCards,
        // Notes about how the source labels its own data, surfaced verbatim so the
        // UI can disclose them next to the figures.
        dataNotes: d.dataNotes,

        highlights: buildHighlights(d, flags),
        // Three buckets. An OFS component lives in `neutral`, never in `green`.
        flags,

        riskFactorAnalysis: {
          overallRating: scoring.overallRisk,
          risks,
        },

        finalObservations: {
          positives: flags.green.map((g) => g.label),
          watchItems: flags.neutral.map((g) => g.label),
          concerns: flags.red.map((g) => g.label),
          closingSummary: buildClosingSummary(d, scoring),
          closingRating: scoring.rating,
        },

        finalDashboard: {
          // Counts come straight from the parameter verdicts, so they always add up
          // to the number of parameters shown in the table.
          counts: {
            greenFlags: scoring.counts.pass,
            yellowFlags: scoring.counts.caution,
            redFlags: scoring.counts.fail,
            notAssessed: scoring.counts.notAssessed,
            informational: scoring.counts.info,
            totalParameters: parameters.length,
          },
          categorySummary: buildCategorySummary(parameters, scoring.overallRisk),
        },
      },

      metrics: {
        aiScore: scoring.aiScore,
        rating: scoring.rating,
        rawRating: scoring.rawRating,
        passedCount: scoring.passedCount,
        parameterCount: parameters.length,
        scoredCount: scoring.scoredCount,
        weightEarned: scoring.weightEarned,
        weightTotal: scoring.weightTotal,
        coveragePct: scoring.coveragePct,
        confidence: scoring.confidence,
        overallRisk: scoring.overallRisk,
        verdictCounts: scoring.counts,
        appliedCaps: scoring.appliedCaps,
      },

      // Everything the reader needs to interpret the numbers above.
      resultGuide,

      parameters,
      // Legacy alias.
      parameters20: parameters,
    }),
  );
});

const isApplyRating = (rating) => rating === "STRONG APPLY" || rating === "APPLY FOR LISTING GAIN" || rating === "APPLY LONG TERM";

const compareAiVsReal = (rating, currentGainPct) => {
  if (typeof currentGainPct !== "number") return "Not enough data";
  if (rating === "APPLY WITH CAUTION") return "Hedged Call";
  const aiSaidApply = isApplyRating(rating);
  const actuallyGained = currentGainPct > 0;
  if (aiSaidApply === actuallyGained) return "Correct Call";
  return aiSaidApply ? "Overestimated" : "Missed Opportunity";
};

const getIpoTrackRecord = asyncHandler(async (req, res) => {
  const category = ["MAINBOARD", "SME"].includes((req.query.category || "").toUpperCase())
    ? req.query.category.toUpperCase()
    : undefined;

  const [records, marketTrend] = await Promise.all([fetchListedIpoTrackRecord(category), getMarketTrendText()]);

  const results = records.map((r) => {
    if (!r.aiAvailable || !r.detail) {
      return {
        name: r.name,
        category: r.category,
        listingGainPct: r.listingGainPct,
        currentGainPct: r.currentGainPct,
        aiAvailable: false,
      };
    }

    const d = r.detail;
    const { scoring } = analyseIpo(d, marketTrend);

    return {
      id: d.id,
      name: d.name,
      logoUrl: d.logoUrl,
      category: d.category,
      sector: d.sector,
      sourceUrl: d.sourceUrl,
      listingGainPct: r.listingGainPct,
      currentGainPct: r.currentGainPct,
      aiAvailable: true,
      aiScore: scoring.aiScore,
      passedCount: scoring.passedCount,
      parameterCount: scoring.scoredCount,
      confidence: scoring.confidence,
      rating: scoring.rating,
      comparison: compareAiVsReal(scoring.rating, r.currentGainPct),
    };
  });

  const withAi = results.filter((r) => r.aiAvailable);
  // Only directional calls count towards accuracy; hedged and no-data rows are excluded
  // from the denominator so the percentage means what it says.
  const directional = withAi.filter((r) => r.comparison === "Correct Call" || r.comparison === "Overestimated" || r.comparison === "Missed Opportunity");
  const correctCalls = directional.filter((r) => r.comparison === "Correct Call").length;

  res.status(200).json(
    new ApiResponse(200, "Listed IPO track record fetched from Chittorgarh.", {
      summary: {
        totalTracked: results.length,
        aiEvaluated: withAi.length,
        directionalCalls: directional.length,
        hedgedCalls: withAi.filter((r) => r.comparison === "Hedged Call").length,
        accuracyPct: directional.length > 0 ? Number(((correctCalls / directional.length) * 100).toFixed(1)) : undefined,
        accuracyBasis:
          "Share of directional Apply/Avoid calls whose direction matched the stock's current gain or loss versus its issue price. Hedged 'Apply with Caution' ratings are excluded.",
      },
      ipos: results,
    }),
  );
});

const TECHNICAL_METHODOLOGY = {
  summary:
    "Every indicator below is computed from up to two years of real daily OHLC candles for this stock. Nothing is approximated from today's percentage move, and any indicator without enough history is reported as unavailable rather than estimated.",
  indicators: [
    {
      name: "RSI (14)",
      how: "Wilder's Relative Strength Index over 14 daily closes, using Wilder smoothing.",
      read: "Above 70 is conventionally overbought, below 30 oversold. In a strong trend RSI can stay stretched for a long time, so it is a warning about pace, not a reversal signal on its own.",
    },
    {
      name: "MACD (12, 26, 9)",
      how: "EMA(12) minus EMA(26), with a 9-period EMA of that line as the signal. The histogram is the gap between them, and a crossover is a genuine sign change in the histogram — located by scanning the actual series.",
      read: "The MACD line above its signal line indicates upward momentum. The bars-since-crossover figure tells you how old that signal is; a fresh cross carries more information than one from months ago.",
    },
    {
      name: "Moving averages (20, 50, 200)",
      how: "Simple moving averages of the daily close, plus a 20-period exponential average.",
      read: "Price above a rising 50-day and 200-day average is the classic definition of an uptrend. The 200-day needs 200 trading days of history, so recently listed stocks will not have one.",
    },
    {
      name: "ATR (14)",
      how: "Average True Range, Wilder-smoothed, expressed in rupees and as a percentage of price.",
      read: "How far this stock typically moves in a day. It sizes positions and stop distances — a 5% ATR stock needs far more room than a 1% ATR one.",
    },
    {
      name: "Bollinger Bands (20, 2)",
      how: "20-day simple moving average plus and minus two standard deviations of the close.",
      read: "Bandwidth measures how volatile the recent range has been. Price outside a band is an extreme relative to recent history, not a signal by itself.",
    },
    {
      name: "Support and resistance",
      how: "Swing pivots found by a fractal test — a candle whose high or low is the extreme of the seven candles centred on it — then clustered when they sit within about 1% of each other.",
      read: "The touch count matters: a level tested several times is more meaningful than a single wick. Where no pivot exists above or below the current price, the level is left blank rather than invented.",
    },
    {
      name: "Relative volume",
      how: "Latest session volume divided by the 20-day average volume.",
      read: "Above 2x means unusual participation, which makes a price move more significant. Low volume moves are easier to reverse.",
    },
  ],
  limitations: [
    "Technical indicators describe what price has already done. They do not predict what it will do next.",
    "No price target is published here. A target would require assumptions about the future that this data cannot support.",
    "The ATR stop reference is a volatility measurement, not a recommendation — it shows how far two average daily ranges sit below the current price, nothing more.",
    "Indicators are computed on daily candles only, and are not adjusted for corporate actions beyond what the data provider supplies.",
    "This is information, not investment advice. Consult a SEBI-registered adviser before trading.",
  ],
};


const buildTechnicalSignals = (t, percentChange) => {
  const list = [];
  const add = (name, direction, weight, detail) => list.push({ name, direction, weight, detail });

  const price = t.currentPrice;

  // Trend: price relative to its own moving averages.
  if (t.sma50 !== null && price !== null) {
    const above = price > t.sma50;
    add(
      "Price vs 50-day average",
      above ? "BULLISH" : "BEARISH",
      2,
      `₹${price} is ${above ? "above" : "below"} the 50-day average of ₹${t.sma50}.`,
    );
  }
  if (t.sma200 !== null && price !== null) {
    const above = price > t.sma200;
    add(
      "Price vs 200-day average",
      above ? "BULLISH" : "BEARISH",
      3,
      `₹${price} is ${above ? "above" : "below"} the 200-day average of ₹${t.sma200}, the conventional dividing line between a long-term uptrend and downtrend.`,
    );
  }
  if (t.sma50 !== null && t.sma200 !== null) {
    const golden = t.sma50 > t.sma200;
    add(
      "50-day vs 200-day average",
      golden ? "BULLISH" : "BEARISH",
      2,
      golden
        ? `The 50-day average (₹${t.sma50}) sits above the 200-day (₹${t.sma200}) — a golden-cross configuration.`
        : `The 50-day average (₹${t.sma50}) sits below the 200-day (₹${t.sma200}) — a death-cross configuration.`,
    );
  }

  // Momentum.
  let rsiZone = null;
  if (t.rsi14 !== null) {
    let direction = "NEUTRAL";
    if (t.rsi14 >= 70) {
      rsiZone = "OVERBOUGHT";
      direction = "BEARISH";
    } else if (t.rsi14 <= 30) {
      rsiZone = "OVERSOLD";
      direction = "BULLISH";
    } else if (t.rsi14 >= 55) {
      rsiZone = "BULLISH";
      direction = "BULLISH";
    } else if (t.rsi14 <= 45) {
      rsiZone = "BEARISH";
      direction = "BEARISH";
    } else {
      rsiZone = "NEUTRAL";
    }
    add(
      "RSI (14)",
      direction,
      2,
      `RSI is ${t.rsi14} (${rsiZone.toLowerCase()})${t.rsiReliability === "limited" ? ", computed on limited history so it has not fully settled" : ""}.`,
    );
  }

  if (t.macd) {
    const bullish = t.macd.position === "ABOVE_SIGNAL";
    add(
      "MACD (12, 26, 9)",
      bullish ? "BULLISH" : "BEARISH",
      2,
      `MACD ${t.macd.macd} is ${bullish ? "above" : "below"} its signal line ${t.macd.signal} (histogram ${t.macd.histogram})${
        t.macd.crossover ? `. Last crossover was ${t.macd.crossover.toLowerCase()}, ${t.macd.barsSinceCrossover} sessions ago` : ""
      }.`,
    );
  }

  if (t.relativeVolume !== null) {
    const heavy = t.relativeVolume >= 1.5;
    add(
      "Relative volume",
      heavy ? (percentChange >= 0 ? "BULLISH" : "BEARISH") : "NEUTRAL",
      1,
      `Latest volume is ${t.relativeVolume}x the 20-day average${heavy ? ", unusually heavy participation" : ""}.`,
    );
  }

  if (t.pctFrom52High !== null && t.pctFrom52Low !== null) {
    const nearHigh = t.pctFrom52High >= -5;
    const nearLow = t.pctFrom52Low <= 10;
    add(
      "52-week range position",
      nearHigh ? "BULLISH" : nearLow ? "BEARISH" : "NEUTRAL",
      1,
      `${Math.abs(t.pctFrom52High)}% ${t.pctFrom52High >= 0 ? "above" : "below"} the 52-week high of ₹${t.high52}, and ${t.pctFrom52Low}% above the 52-week low of ₹${t.low52}.`,
    );
  }

  const weightTotal = list.reduce((s, x) => s + x.weight, 0);
  const bullWeight = list.filter((x) => x.direction === "BULLISH").reduce((s, x) => s + x.weight, 0);
  const bearWeight = list.filter((x) => x.direction === "BEARISH").reduce((s, x) => s + x.weight, 0);

  const score =
    weightTotal > 0 ? Math.round(50 + ((bullWeight - bearWeight) / weightTotal) * 50) : 50;

  let grade = "NEUTRAL";
  if (score >= 75) grade = "STRONG BULLISH";
  else if (score >= 60) grade = "BULLISH";
  else if (score <= 25) grade = "STRONG BEARISH";
  else if (score <= 40) grade = "BEARISH";

  const MAX_WEIGHT = 13;
  const coverage = Math.min(100, Math.round((weightTotal / MAX_WEIGHT) * 100));
  const confidence = coverage >= 90 ? "High" : coverage >= 60 ? "Medium" : "Low";

  let trendSignal = "NO CLEAR TREND";
  if (t.sma50 !== null && t.sma200 !== null && price !== null) {
    if (price > t.sma50 && t.sma50 > t.sma200) trendSignal = "UPTREND";
    else if (price < t.sma50 && t.sma50 < t.sma200) trendSignal = "DOWNTREND";
    else trendSignal = "MIXED / TRANSITIONING";
  } else if (t.sma50 !== null && price !== null) {
    trendSignal = price > t.sma50 ? "ABOVE 50-DAY AVERAGE" : "BELOW 50-DAY AVERAGE";
  }

  const insights = [
    `${bullWeight} of ${weightTotal} weighted signal points are bullish and ${bearWeight} bearish, giving a momentum score of ${score}/100 (${grade}).`,
    trendSignal !== "NO CLEAR TREND"
      ? `Trend structure reads as ${trendSignal.toLowerCase()} based on price against its 50-day and 200-day averages.`
      : "There is not enough moving-average history to describe the trend structure.",
    t.atrPct !== null
      ? `Typical daily range is ${t.atrPct}% of price (ATR ₹${t.atr14}), which is the volatility any stop or position size has to accommodate.`
      : "Average True Range could not be computed from the available history.",
  ];

  if (t.levels?.support1 && t.levels?.resistance1) {
    insights.push(
      `Nearest swing support is ₹${t.levels.support1} (${t.levels.support1Touches} touch${t.levels.support1Touches === 1 ? "" : "es"}) and nearest resistance ₹${t.levels.resistance1} (${t.levels.resistance1Touches} touch${t.levels.resistance1Touches === 1 ? "" : "es"}).`,
    );
  }

  return { list, score, grade, confidence, coverage, rsiZone, trendSignal, insights };
};

const getStockAnalysis = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const cleanSym = symbol ? symbol.toUpperCase().trim() : undefined;
  if (!cleanSym) throw new ApiError(400, "Symbol is required.");

  let quote;
  let series;
  try {
    [quote, series] = await Promise.all([
      getQuote(cleanSym),
      getChartSeries(cleanSym, { range: "2y", interval: "1d", ttl: 900 }),
    ]);
  } catch {
    throw new ApiError(404, `No market data found for "${cleanSym}". It may not be listed yet.`);
  }

  const currentPrice = quote.currentPrice;
  const percentChange = quote.percentChange ?? 0;
  const t = computeTechnicals(series.points, currentPrice);
  const signals = buildTechnicalSignals(t, percentChange);

  res.status(200).json(
    new ApiResponse(200, "Stock analysis computed from daily price history.", {
      symbol: cleanSym,
      name: series.name,
      currentPrice: Number(currentPrice.toFixed(2)),
      percentChange: Number(percentChange.toFixed(2)),

      momentumScore: signals.score,
      momentumGrade: signals.grade,
      trendSignal: signals.trendSignal,
      confidence: signals.confidence,

      technicalIndicators: {
        rsi14: t.rsi14,
        rsiZone: signals.rsiZone,
        rsiReliability: t.rsiReliability,
        macd: t.macd,
        sma20: t.sma20,
        sma50: t.sma50,
        sma200: t.sma200,
        ema20: t.ema20,
        atr14: t.atr14,
        atrPct: t.atrPct,
        bollinger: t.bollinger,
        relativeVolume: t.relativeVolume,
        avgVolume20: t.avgVolume20,
        latestVolume: t.latestVolume,
      },

      levels: {
        support1: t.levels?.support1 ?? null,
        support1Touches: t.levels?.support1Touches ?? null,
        support2: t.levels?.support2 ?? null,
        resistance1: t.levels?.resistance1 ?? null,
        resistance1Touches: t.levels?.resistance1Touches ?? null,
        resistance2: t.levels?.resistance2 ?? null,
        high52: t.high52,
        low52: t.low52,
        pctFrom52High: t.pctFrom52High,
        pctFrom52Low: t.pctFrom52Low,
        atrStopReference:
          t.atr14 && currentPrice ? Number((currentPrice - 2 * t.atr14).toFixed(2)) : null,
        atrStopBasis: t.atr14 ? `2 × ATR(14) of ₹${t.atr14} below the current price` : null,
      },

      signals: signals.list,
      insights: signals.insights,

      dataQuality: {
        candles: t.candles,
        rangeRequested: "2y daily",
        firstCandle: t.firstCandle,
        lastCandle: t.lastCandle,
        // Everything the series was too short to support, named explicitly.
        unavailable: t.unavailable,
        note:
          t.unavailable.length > 0
            ? "Indicators that need more history than this stock has are reported as unavailable rather than estimated."
            : "Full daily history was available for every indicator shown.",
      },

      methodology: TECHNICAL_METHODOLOGY,
    }),
  );
});

module.exports = {
  getIpoAnalysis,
  getStockAnalysis,
  getDeepIpoAnalysis,
  getIpoTrackRecord,
};
