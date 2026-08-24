const fs = require("fs");
const path = require("path");

const { scrapeIpoDetail } = require("../../src/services/chittorgarhService");
const { analyseIpo, VERDICT } = require("../../src/services/ipoFramework");

const fixture = (name) => fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8");

const detailFrom = (file, slug, id) =>
  scrapeIpoDetail(fixture(file), {
    id: `${slug}-${id}`,
    slug,
    chittorgarhId: id,
    name: slug,
    url: `https://www.chittorgarh.com/ipo/${slug}/${id}/`,
  });

const MARKET_TREND = { text: "Nifty 50 up 0.62% today — markets in a positive trend", verdict: VERDICT.PASS };

const paramNamed = (params, needle) => params.find((p) => p.name.toLowerCase().includes(needle.toLowerCase()));

describe("Chittorgarh scraper — labelling and table detection", () => {
  const augmont = detailFrom("augmont-ipo.html", "augmont-enterprises-ipo", "2673");
  const lalithaa = detailFrom("lalithaa-ipo.html", "lalithaa-jewellery-mart-ipo", "2469");

  it("detects the 3-column Offer-for-Sale table and identifies promoter sellers", () => {
    // Regression: the old detector only matched the 4-column layout, so this table
    // was dropped entirely and the framework reported "no promoter stake sale".
    expect(augmont.ofsShareholders).toHaveLength(3);
    expect(augmont.ofsShareholders.every((s) => s.category === "Promoter")).toBe(true);
    expect(augmont.issueSplit.promoterOfsAmountCr).toBe(180);
    expect(augmont.issueSplit.promoterSellerNames).toEqual([
      "Namita Ketan Kothari",
      "Vivek Prithviraj Kothari",
      "Dimple Mukesh Kothari",
    ]);
  });

  it("detects the 4-column Offer-for-Sale table with a shares column", () => {
    expect(lalithaa.ofsShareholders).toHaveLength(1);
    expect(lalithaa.ofsShareholders[0]).toMatchObject({
      name: "Kiran Kumar Jain",
      category: "Promoter",
      amountCr: 500,
    });
    expect(lalithaa.ofsShareholders[0].shares).toBeTruthy();
  });

  it("classifies a 75% fresh issue as fresh-issue dominated, not OFS heavy", () => {
    expect(augmont.issueSplit).toMatchObject({
      totalCr: 825,
      freshCr: 620,
      ofsCr: 205,
      freshPct: 75.2,
      ofsPct: 24.8,
      structureLabel: "Fresh-Issue Dominated",
    });
  });

  it("keeps the source label for the row published as EBITDA and reports it as operating profit", () => {
    // The source's "EBITDA" row is operating profit; it must not be presented as
    // reported EBITDA/PBIDT.
    expect(augmont.financials.operatingProfitSourceLabel).toBe("EBITDA");
    expect(augmont.financials.operatingProfit.latest).toBe(385.95);
    expect(augmont.financials.operatingProfitGrowth).toBe(26.9);
    expect(augmont.dataNotes.join(" ")).toMatch(/operating profit, not as reported EBITDA/i);
  });

  it("labels the income row as Total Income rather than Revenue", () => {
    expect(augmont.financials.totalIncomeSourceLabel).toBe("Total Income");
    expect(augmont.financials.totalIncome.latest).toBe(94282.47);
  });

  it("reports operating cash flow as unavailable instead of inferring it", () => {
    expect(augmont.financials.hasOperatingCashFlow).toBe(false);
    expect(augmont.financials.operatingCashFlow).toBeUndefined();
    expect(augmont.dataNotes.join(" ")).toMatch(/does not publish a cash flow statement/i);
  });

  it("captures both KPI periods so a declining ratio is visible", () => {
    expect(augmont.financials.kpi.roe).toMatchObject({ latest: 51.04, prev: 74.19, direction: "declining" });
    expect(augmont.financials.kpi.roce).toMatchObject({ latest: 40.27, prev: 70.1, direction: "declining" });
  });

  it("judges thin margins on relative change rather than percentage points", () => {
    // 0.46% -> 0.41% is a 10.9% relative decline; a flat pp threshold called it "flat".
    expect(augmont.financials.kpi.ebitdaMargin).toMatchObject({ latest: 0.41, prev: 0.46, direction: "declining" });
  });

  it("resolves valuation rows despite label spacing differences", () => {
    // Lookup was previously "EPS(₹)" against a source label of "EPS (₹)".
    expect(augmont.financials.epsPre).toBe(41.71);
    expect(augmont.financials.epsPost).toBe(38.12);
    expect(augmont.financials.pePost).toBe(20.67);
  });

  it("extracts sector, sector peers and net worth growth", () => {
    expect(augmont.sector).toBe("Gems, Jewellery And Watches");
    expect(augmont.sectorPeers.length).toBeGreaterThan(3);
    expect(augmont.sectorPeers[0]).toHaveProperty("listingGainPct");
    expect(augmont.financials.netWorthGrowth).toBe(119.1);
  });

  it("parses subscription data when the book has opened, and omits it when it has not", () => {
    expect(lalithaa.subscription).toMatchObject({ total: 66.63, qib: 153.8, retail: 12.51 });
    expect(augmont.subscription).toBeUndefined();
  });
});

describe("IPO framework — verdicts and scoring", () => {
  const augmont = detailFrom("augmont-ipo.html", "augmont-enterprises-ipo", "2673");
  const result = analyseIpo(augmont, MARKET_TREND);
  const { parameters, scoring, flags, risks, resultGuide } = result;

  it("flags promoter OFS participation as a Caution, never a Pass", () => {
    const p = paramNamed(parameters, "Promoter Participation in OFS");
    expect(p.verdict).toBe(VERDICT.CAUTION);
    expect(p.actual).toMatch(/3 promoter shareholders selling/);
    expect(p.actual).not.toMatch(/No promoter stake sale/i);
  });

  it("marks unavailable cash flow as Not Assessed and excludes it from the score", () => {
    const p = paramNamed(parameters, "Operating Cash Flow");
    expect(p.verdict).toBe(VERDICT.NOT_ASSESSED);
    expect(p.weight).toBeGreaterThan(0);

    // Not Assessed parameters must not contribute weight in either direction.
    const scoredWeight = parameters
      .filter((x) => [VERDICT.PASS, VERDICT.CAUTION, VERDICT.FAIL].includes(x.verdict) && x.weight > 0)
      .reduce((s, x) => s + x.weight, 0);
    expect(scoring.weightTotal).toBe(scoredWeight);
    expect(scoring.coveragePct).toBeLessThan(100);
  });

  it("treats a high but sharply falling return ratio as a Caution", () => {
    const roe = paramNamed(parameters, "Return on Equity");
    expect(roe.verdict).toBe(VERDICT.CAUTION);
    expect(roe.interpretation).toMatch(/high but declining/i);
  });

  it("does not treat asset contraction as an automatic failure when equity strengthens", () => {
    const p = paramNamed(parameters, "Asset Base Change");
    expect(p.actual).toMatch(/-32\.3%/);
    expect(p.verdict).toBe(VERDICT.CAUTION);
    expect(p.interpretation).toMatch(/leaner, less leveraged balance sheet/i);
  });

  it("caps the rating below the raw score when a disqualifying condition applies", () => {
    expect(scoring.rawRating).toBe("APPLY FOR LISTING GAIN");
    expect(scoring.rating).toBe("APPLY WITH CAUTION");
    expect(scoring.appliedCaps.length).toBeGreaterThan(0);
    expect(scoring.appliedCaps.map((c) => c.reason).join(" ")).toMatch(/cash flow could not be verified/i);
    expect(scoring.overallRisk).toBe("Medium-High Risk");
  });

  it("never lists an OFS component as a green flag", () => {
    const greenText = flags.green.map((g) => g.label).join(" | ");
    expect(greenText).not.toMatch(/OFS|Offer[- ]for[- ]Sale/i);

    const neutralText = flags.neutral.map((g) => g.label).join(" | ");
    expect(neutralText).toMatch(/OFS/i);
  });

  it("puts no filler text in the red flag bucket", () => {
    const redText = flags.red.map((g) => g.label).join(" | ");
    expect(redText).not.toMatch(/within normal range|in line with disclosed|allocated per objects/i);
    expect(flags.red.length).toBeGreaterThan(0);
    // Promoter selling is a genuine red flag and must be present.
    expect(redText).toMatch(/Promoters selling/i);
  });

  it("raises the risks that a generic market-volatility note would miss", () => {
    const titles = risks.map((r) => r.title).join(" | ");
    expect(titles).toMatch(/Cash Flow Quality Unverified/i);
    expect(titles).toMatch(/Thin Margins/i);
    expect(titles).toMatch(/Working Capital Dependence/i);
    expect(titles).toMatch(/Input Price Volatility/i);
    expect(titles).toMatch(/Promoter Stake Sale/i);
    expect(titles).toMatch(/Declining Return Ratios/i);
  });

  it("reconciles the verdict counts with the parameter list", () => {
    const { pass, caution, fail, notAssessed, info } = scoring.counts;
    expect(pass + caution + fail + notAssessed + info).toBe(parameters.length);
  });

  it("attributes every parameter to a source and a data-quality level", () => {
    for (const p of parameters) {
      expect(typeof p.source).toBe("string");
      expect(p.source.length).toBeGreaterThan(0);
      expect(p.dataQuality).toBeTruthy();
      expect(p.whyItMatters.length).toBeGreaterThan(40);
      expect(p.interpretation.length).toBeGreaterThan(20);
    }
  });

  it("attributes broker consensus to the source without claiming verification", () => {
    const p = paramNamed(parameters, "Broker Consensus");
    expect(p.actual).toMatch(/6 of 9 brokers recommend Subscribe/);
    expect(p.interpretation).toMatch(/not an independently verified survey/i);
  });

  it("explains the score, the rating and the limits of the analysis", () => {
    expect(resultGuide.howScoreWorks.length).toBeGreaterThan(0);
    expect(resultGuide.ratingScale.map((r) => r.rating)).toContain("APPLY WITH CAUTION");
    expect(resultGuide.ratingAdjustment.caps.length).toBeGreaterThan(0);
    expect(resultGuide.limitations.join(" ")).toMatch(/grey-market premium is deliberately not used/i);
    expect(resultGuide.weightByCategory.reduce((s, w) => s + w.weight, 0)).toBe(scoring.weightTotal);
  });

  it("grows the framework well beyond the original 20 parameters", () => {
    expect(parameters.length).toBeGreaterThanOrEqual(30);
  });
});

describe("IPO framework — an issue with published subscription data", () => {
  const lalithaa = detailFrom("lalithaa-ipo.html", "lalithaa-jewellery-mart-ipo", "2469");
  const { parameters, scoring } = analyseIpo(lalithaa, MARKET_TREND);

  it("scores real bid demand when the source publishes it", () => {
    const p = paramNamed(parameters, "Subscription Demand");
    expect(p.verdict).toBe(VERDICT.PASS);
    expect(p.actual).toMatch(/Overall 66\.63x/);
    expect(p.interpretation).toMatch(/QIB book/i);
  });

  it("marks operating profit as unassessable when the source omits the row", () => {
    // Lalithaa's financial table has no EBITDA/operating profit row at all.
    expect(lalithaa.financials.operatingProfit.latest).toBeUndefined();
    expect(paramNamed(parameters, "Operating Profit Growth")).toBeUndefined();
    expect(paramNamed(parameters, "Operating Profit Margin")).toBeUndefined();
  });

  it("still caps the rating for unverified cash flow", () => {
    expect(scoring.rating).toBe("APPLY FOR LISTING GAIN");
    expect(scoring.appliedCaps.map((c) => c.reason).join(" ")).toMatch(/cash flow could not be verified/i);
  });
});
