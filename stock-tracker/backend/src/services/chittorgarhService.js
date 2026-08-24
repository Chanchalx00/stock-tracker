const axios = require("axios");
const cheerio = require("cheerio");
const { get, set } = require("../config/redis");
const logger = require("../utils/logger");

const BASE = "https://www.chittorgarh.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const LIST_PAGES = {
  MAINBOARD: [
    `${BASE}/report/ipo-in-india-list-main-board-sme/82/mainboard/`,
    `${BASE}/report/upcoming-ipos-drhp-filed/158/mainboard/`,
  ],
  SME: [
    `${BASE}/report/ipo-in-india-list-main-board-sme/82/sme/`,
    `${BASE}/report/upcoming-ipos-drhp-filed/158/sme/`,
  ],
};

const LIST_TTL = 600;
const DETAIL_TTL = 900;
const IPO_LINK_RE = /^\/ipo\/([a-z0-9-]+)\/(\d+)\/?$/i;

const fetchHtml = async (url, timeout = 15000) => {
  const { data } = await axios.get(url, { headers: HEADERS, timeout });
  return data;
};

const cleanText = (s) => (s || "").replace(/\s+/g, " ").trim();

const toNumber = (str) => {
  if (str === undefined || str === null) return undefined;
  const m = String(str).replace(/[₹,]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : undefined;
};

const pctChange = (latest, prev) => {
  if (typeof latest !== "number" || typeof prev !== "number" || prev === 0) return undefined;
  return Number((((latest - prev) / Math.abs(prev)) * 100).toFixed(1));
};

const cagr = (latest, oldest, years) => {
  if (typeof latest !== "number" || typeof oldest !== "number") return undefined;
  if (latest <= 0 || oldest <= 0 || !years || years <= 0) return undefined;
  return Number(((Math.pow(latest / oldest, 1 / years) - 1) * 100).toFixed(1));
};

const pctPointChange = (latest, prev) => {
  if (typeof latest !== "number" || typeof prev !== "number") return undefined;
  return Number((latest - prev).toFixed(2));
};


const normLabel = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[₹()₹.]/g, "")
    .replace(/[^a-z0-9%/]+/g, "");

const colIndexOf = (headers, ...needles) => {
  const norm = (headers || []).map(normLabel);
  for (const needle of needles) {
    const n = normLabel(needle);
    const i = norm.findIndex((h) => h.includes(n));
    if (i >= 0) return i;
  }
  return -1;
};

const parseDisplayDate = (str) => {
  if (!str) return undefined;
  const d = new Date(str.replace(/(\d+)(st|nd|rd|th)/, "$1"));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const extractIpoLinks = (html) => {
  const $ = cheerio.load(html);
  const map = new Map();

  $("a[href*='/ipo/']").each((_, el) => {
    const href = $(el).attr("href") || "";
    let pathname;
    try {
      pathname = new URL(href, BASE).pathname;
    } catch {
      pathname = href;
    }
    const m = pathname.match(IPO_LINK_RE);
    if (!m) return;

    const [, slug, numericId] = m;
    const title = cleanText($(el).attr("title") || $(el).text());
    if (!title) return;

    const id = `${slug}-${numericId}`;
    if (!map.has(id)) {
      map.set(id, {
        id,
        slug,
        chittorgarhId: numericId,
        name: title.replace(/\s*IPO\s*$/i, "").trim() || title,
        url: `${BASE}/ipo/${slug}/${numericId}/`,
      });
    }
  });

  return Array.from(map.values());
};

const fetchIpoLinks = async (category) => {
  const cacheKey = `cg:links:${category}`;
  const cached = await get(cacheKey);
  if (cached) return cached;

  const pages = LIST_PAGES[category] || [];
  const settled = await Promise.allSettled(pages.map((url) => fetchHtml(url)));

  const merged = new Map();
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const item of extractIpoLinks(r.value)) {
      merged.set(item.id, { ...item, category });
    }
  }

  const list = Array.from(merged.values());
  await set(cacheKey, list, LIST_TTL);
  return list;
};

const parseKeyValueMap = ($) => {
  const kv = {};
  $("table").each((_, table) => {
    const $table = $(table);
    if ($table.find("thead").length) return;
    $table.find("tr").each((__, tr) => {
      const cells = $(tr).find("td");
      if (cells.length === 2) {
        const key = cleanText($(cells[0]).text());
        const val = cleanText($(cells[1]).text());
        if (key) kv[key] = val;
      }
    });
  });
  return kv;
};

const kvLookup = (kv, ...keys) => {
  for (const k of keys) {
    if (kv[k] !== undefined) return kv[k];
  }
  const lowerEntries = Object.entries(kv);
  for (const key of keys) {
    const found = lowerEntries.find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
    if (found) return found[1];
  }
  return undefined;
};

const parseDataTables = ($) => {
  const out = {};
  $("table").each((_, table) => {
    const $table = $(table);
    if (!$table.find("thead").length) return;

    const headers = $table
      .find("thead tr")
      .first()
      .find("th")
      .map((__, th) => cleanText($(th).text()))
      .get();
    const rows = $table
      .find("tbody tr")
      .toArray()
      .map((tr) => $(tr).find("td").toArray().map((td) => cleanText($(td).text())))
      .filter((r) => r.length >= 2);

    const id = $table.attr("id");
    const h0 = (headers[0] || "").toLowerCase();
    const hjoin = headers.join("|").toLowerCase();
    const entry = { headers, rows };

    if (id === "financialTable" || hjoin.includes("period ended")) out.financials = entry;
    else if (id === "ObjectiveIssue" || hjoin.includes("issue objects")) out.objectsOfIssue = entry;
    else if (id === "Expenses" || hjoin.includes("issue expenses")) out.expenses = entry;
    else if (hjoin.includes("investor category")) out.reservation = entry;
    else if (h0 === "application" && hjoin.includes("lots")) out.lotBreakup = entry;
    else if (hjoin.includes("kpi")) out.kpi = entry;
    else if (h0.includes("valuation metric")) out.valuation = entry;
    else if (h0 === "category" && hjoin.includes("pre ipo") && hjoin.includes("post ipo")) out.promoterHolding = entry;
    //   Name | Category | No. of Shares Offered | Amount (₹ cr.)   <- 4 col
    //   Name | Category | Estimated Amount (₹ cr.)                 <- 3 col
    else if (h0 === "name" && hjoin.includes("category") && /amount|shares offered/.test(hjoin))
      out.ofsShareholders = entry;
    else if (hjoin.includes("review by") && hjoin.includes("subscribe")) out.brokerRecommendation = entry;
    else if (hjoin.includes("subscription (x)")) out.subscription = entry;
    else if (h0 === "company" && hjoin.includes("listing gain")) out.sectorPeers = entry;
  });
  return out;
};

const parseTimetable = ($) => {
  const items = $("li.d-flex.justify-content-between")
    .map((_, li) => {
      const $li = $(li);
      const label = cleanText($li.find("span").first().text());
      const value = cleanText($li.find("span.text-end").text());
      return { label, value };
    })
    .get()
    .filter((x) => x.label && x.value);

  const find = (kw) => items.find((x) => x.label.toLowerCase().replace(/\s+/g, "").includes(kw))?.value;

  return {
    openDate: find("ipoopen"),
    closeDate: find("ipoclose"),
    allotmentDate: find("allotment"),
    refundsDate: find("refund"),
    dematCreditDate: find("creditofshares"),
    listingDate: find("listing"),
  };
};

const rowsToMetricSeries = (table) => {
  if (!table) return { periods: [], metrics: {}, rowLabels: [], get: () => undefined, labelOf: () => undefined };

  const periods = table.headers.slice(1).filter(Boolean);
  const metrics = {};
  const byNorm = new Map();
  const rowLabels = [];

  for (const row of table.rows) {
    const [name, ...vals] = row;
    if (!name || vals.length === 0) continue;
    const nums = vals.map(toNumber);
    if (nums.every((v) => v === undefined)) continue;
    metrics[name] = nums;
    rowLabels.push(name);
    const key = normLabel(name);
    if (!byNorm.has(key)) byNorm.set(key, { label: name, values: nums });
  }

  const resolve = (...aliases) => {
    for (const alias of aliases) {
      const hit = byNorm.get(normLabel(alias));
      if (hit) return hit;
    }
    for (const alias of aliases) {
      const n = normLabel(alias);
      for (const [key, hit] of byNorm) {
        if (key.includes(n)) return hit;
      }
    }
    return undefined;
  };

  return {
    periods,
    metrics,
    rowLabels,
    get: (...aliases) => resolve(...aliases)?.values,
    labelOf: (...aliases) => resolve(...aliases)?.label,
  };
};

const seriesPoints = (values) => {
  const v = values || [];
  const defined = v.filter((x) => typeof x === "number");
  return {
    latest: v[0],
    prev: v[1],
    oldest: defined.length > 1 ? defined[defined.length - 1] : undefined,
    spanYears: Math.max(0, defined.length - 1),
    all: v,
  };
};

const scrapeIpoDetail = (html, discovered) => {
  const $ = cheerio.load(html);

  const kv = parseKeyValueMap($);
  const tables = parseDataTables($);
  const timetable = parseTimetable($);

  const aboutHeading = cleanText($("#about-company-section h2.section-title").first().text());
  const legalName = aboutHeading.replace(/^About\s+/i, "").trim();
  const name = legalName || discovered.name;

  const aboutParas = $("#about-company-section #ipoSummary p, #about-company-section p")
    .map((_, p) => cleanText($(p).text()))
    .get()
    .filter((p) => p && (p.split(" ").length > 4 || /[.!?]$/.test(p)));

  const logoUrl = $('meta[property="og:image"]').attr("content") || undefined;

  const cards = {};
  $(".card-ipo").each((_, card) => {
    const label = cleanText($(card).find("p.text-muted").text()).toLowerCase();
    const value = cleanText($(card).find(".fs-5").text());
    if (label.includes("open")) cards.cardOpenDate = value;
    else if (label.includes("close")) cards.cardCloseDate = value;
    else if (label.includes("issue price")) cards.cardIssuePrice = value;
    else if (label.includes("market cap")) cards.cardMarketCap = value;
  });

  const bodyText = $("body").text();
  const comboMatch = bodyText.match(
    /([A-Z][A-Za-z0-9.&', ]{2,80}?)\s+is the (?:book running lead manager|sole lead manager|lead manager)s?\s+and\s+([A-Z][A-Za-z0-9.&', ]{2,80}?)\s+is the registrar (?:of|to) the (?:issue|offer)/,
  );
  const leadManagerOnlyMatch = bodyText.match(
    /([A-Z][A-Za-z0-9.&', ]{2,80}?)\s+is the (?:book running lead manager|sole lead manager|lead manager)/,
  );
  const registrarOnlyMatch = bodyText.match(/([A-Z][A-Za-z0-9.&', ]{2,80}?)\s+is the registrar (?:of|to) the (?:issue|offer)/);
  const leadManagerName = comboMatch?.[1] || leadManagerOnlyMatch?.[1];
  const registrarName = comboMatch?.[2] || registrarOnlyMatch?.[1];

  const finSeries = rowsToMetricSeries(tables.financials);
  const dataNotes = [];

  const totalIncome = seriesPoints(finSeries.get("Total Income", "Revenue from Operations", "Revenue"));
  const totalIncomeLabel = finSeries.labelOf("Total Income", "Revenue from Operations", "Revenue");
  const pat = seriesPoints(finSeries.get("Profit After Tax", "PAT"));
  const assets = seriesPoints(finSeries.get("Assets"));
  const borrowing = seriesPoints(finSeries.get("Total Borrowing", "Borrowings"));
  const netWorth = seriesPoints(finSeries.get("NET Worth", "Net Worth"));
  const reserves = seriesPoints(finSeries.get("Reserves and Surplus"));

  const operatingProfit = seriesPoints(finSeries.get("EBITDA", "Operating Profit", "PBIDT"));
  const operatingProfitSourceLabel = finSeries.labelOf("EBITDA", "Operating Profit", "PBIDT");
  if (operatingProfitSourceLabel && /ebitda/i.test(operatingProfitSourceLabel)) {
    dataNotes.push(
      'The row Chittorgarh publishes as "EBITDA" is used here as Operating Profit. It excludes other income and may differ from the EBITDA/PBIDT stated in the RHP — treat it as operating profit, not as reported EBITDA.',
    );
  }

  const operatingCashFlow = seriesPoints(
    finSeries.get(
      "Net Cash Flow from Operating Activities",
      "Cash Flow from Operating Activities",
      "Net Cash Generated from Operating Activities",
      "Operating Cash Flow",
    ),
  );
  const hasOperatingCashFlow = typeof operatingCashFlow.latest === "number";
  if (!hasOperatingCashFlow) {
    dataNotes.push(
      "Chittorgarh does not publish a cash flow statement for this issue, so operating cash flow could not be verified. Cash-flow quality is reported as Not Assessed rather than assumed healthy — check the RHP directly.",
    );
  }

  const totalIncomeGrowth = pctChange(totalIncome.latest, totalIncome.prev);
  const patGrowth = pctChange(pat.latest, pat.prev);
  const operatingProfitGrowth = pctChange(operatingProfit.latest, operatingProfit.prev);
  const assetGrowth = pctChange(assets.latest, assets.prev);
  const debtGrowth = pctChange(borrowing.latest, borrowing.prev);
  const netWorthGrowth = pctChange(netWorth.latest, netWorth.prev);
  const totalIncomeCagr = cagr(totalIncome.latest, totalIncome.oldest, totalIncome.spanYears);
  const patCagr = cagr(pat.latest, pat.oldest, pat.spanYears);
  const operatingProfitCagr = cagr(operatingProfit.latest, operatingProfit.oldest, operatingProfit.spanYears);

  const debtToEquity =
    typeof borrowing.latest === "number" && typeof netWorth.latest === "number" && netWorth.latest !== 0
      ? Number((borrowing.latest / netWorth.latest).toFixed(2))
      : undefined;

  const operatingMargin =
    typeof operatingProfit.latest === "number" && typeof totalIncome.latest === "number" && totalIncome.latest !== 0
      ? Number(((operatingProfit.latest / totalIncome.latest) * 100).toFixed(2))
      : undefined;
  const operatingMarginPrev =
    typeof operatingProfit.prev === "number" && typeof totalIncome.prev === "number" && totalIncome.prev !== 0
      ? Number(((operatingProfit.prev / totalIncome.prev) * 100).toFixed(2))
      : undefined;


  const kpiSeries = rowsToMetricSeries(tables.kpi);
  const kpiTrend = (...aliases) => {
    const values = kpiSeries.get(...aliases);
    if (!values) return undefined;
    const latest = values[0];
    const prev = values[1];
    if (typeof latest !== "number") return undefined;
    const changePp = pctPointChange(latest, prev);
    const relChange = pctChange(latest, prev);
    let direction = "flat";
    if (typeof changePp === "number") {

      const useRelative = Math.abs(latest) < 5 && typeof relChange === "number";
      if (useRelative) {
        if (relChange > 5) direction = "improving";
        else if (relChange < -5) direction = "declining";
      } else if (changePp > 0.5) direction = "improving";
      else if (changePp < -0.5) direction = "declining";
    }
    return { latest, prev, changePp, relChange, direction, sourceLabel: kpiSeries.labelOf(...aliases) };
  };

  const kpi = {
    periods: kpiSeries.periods,
    roe: kpiTrend("ROE"),
    roce: kpiTrend("ROCE"),
    ronw: kpiTrend("RoNW"),
    patMargin: kpiTrend("PAT Margin"),
    ebitdaMargin: kpiTrend("EBITDA Margin"),
    debtEquity: kpiTrend("Debt/Equity"),
    nav: kpiTrend("NAV"),
    priceToBook: kpiTrend("Price to Book Value"),
  };

  const valSeries = rowsToMetricSeries(tables.valuation);
  const valAt = (idx, ...aliases) => valSeries.get(...aliases)?.[idx];
  const epsPre = valAt(0, "EPS (₹)", "EPS");
  const epsPost = valAt(1, "EPS (₹)", "EPS");
  const pePre = valAt(0, "P/E (x)", "P/E");
  const pePost = valAt(1, "P/E (x)", "P/E") ?? pePre;
  const marketCapRow = tables.valuation?.rows.find((r) => /market cap/i.test(r[0]));
  const marketCapPre = marketCapRow?.[1];
  const marketCapPost = marketCapRow?.[2];

  const promoterRow = tables.promoterHolding?.rows.find((r) => /promoter/i.test(r[0]));
  const prePromoterHolding = promoterRow?.[1];
  const postPromoterHolding = promoterRow?.[2];

  const objectsOfIssue = (tables.objectsOfIssue?.rows || [])
    .filter((r) => r[1] && !/^total$/i.test(r[1]))
    .map((r) => ({ title: r[1], amount: r[2] ? `₹${r[2]} Cr` : undefined }));

  const anchorPortionCr = toNumber(kvLookup(kv, "Anchor Portion (₹ Cr.)"));
  const totalIssueSizeCr = toNumber((kvLookup(kv, "Total Issue Size") || "").match(/agg\.[^₹]*₹([\d,.]+)/)?.[1]);
  const anchorAllocationPct =
    anchorPortionCr && totalIssueSizeCr ? Number(((anchorPortionCr / totalIssueSizeCr) * 100).toFixed(1)) : undefined;

  const reservationRows = (tables.reservation?.rows || []).filter((r) => !/^[−-]/.test(r[0]));
  const reservationFor = (label) => {
    const row = reservationRows.find((r) => new RegExp(`^${label}\\b`, "i").test(r[0]));
    return row ? toNumber(row[2]) : undefined;
  };
  const reservation = {
    qib: reservationFor("QIB"),
    nii: reservationFor("NII"),
    retail: reservationFor("Retail"),
  };

  const ofsHeaders = tables.ofsShareholders?.headers || [];
  const ofsNameCol = Math.max(0, colIndexOf(ofsHeaders, "Name"));
  const ofsCategoryCol = colIndexOf(ofsHeaders, "Category", "Type");
  const ofsSharesCol = colIndexOf(ofsHeaders, "No. of Shares Offered", "Shares Offered");
  const ofsAmountCol = colIndexOf(ofsHeaders, "Amount", "Estimated Amount");

  const ofsShareholders = (tables.ofsShareholders?.rows || [])
    .filter((r) => r[ofsNameCol] && !/^total$/i.test(r[ofsNameCol]))
    .map((r) => ({
      name: r[ofsNameCol],
      category: ofsCategoryCol >= 0 ? r[ofsCategoryCol] : undefined,
      shares: ofsSharesCol >= 0 ? r[ofsSharesCol] : undefined,
      amountCr: ofsAmountCol >= 0 ? toNumber(r[ofsAmountCol]) : undefined,
    }));

  const promoterSellers = ofsShareholders.filter((s) => /promoter/i.test(s.category || ""));
  const promoterOfsAmountCr = promoterSellers.reduce((sum, s) => sum + (s.amountCr || 0), 0) || undefined;

  const brokerRow = tables.brokerRecommendation?.rows.find((r) => /broker/i.test(r[0]));
  const memberRow = tables.brokerRecommendation?.rows.find((r) => /member/i.test(r[0]));
  const brokerRecommendation = brokerRow
    ? {
        subscribe: toNumber(brokerRow[1]) || 0,
        mayApply: toNumber(brokerRow[2]) || 0,
        neutral: toNumber(brokerRow[3]) || 0,
        avoid: toNumber(brokerRow[4]) || 0,
        source: "Chittorgarh IPO Recommendations table",
        memberVotes: memberRow
          ? {
              subscribe: toNumber(memberRow[1]) || 0,
              mayApply: toNumber(memberRow[2]) || 0,
              neutral: toNumber(memberRow[3]) || 0,
              avoid: toNumber(memberRow[4]) || 0,
            }
          : undefined,
      }
    : undefined;

  const sectorHeading = $("h2, h3")
    .toArray()
    .map((h) => cleanText($(h).text()))
    .find((t) => /recently listed ipos in/i.test(t));
  const sector = sectorHeading ? sectorHeading.replace(/^.*recently listed ipos in\s*/i, "").trim() : undefined;

  const peerHeaders = tables.sectorPeers?.headers || [];
  const peerGainCol = colIndexOf(peerHeaders, "Listing Gain/Loss %", "Listing Gain");
  const peerPeCol = colIndexOf(peerHeaders, "PE Ratio", "P/E");
  const peerTypeCol = colIndexOf(peerHeaders, "Issue Type");
  const sectorPeers = (tables.sectorPeers?.rows || [])
    .filter((r) => r[0])
    .map((r) => ({
      name: r[0],
      issueType: peerTypeCol >= 0 ? r[peerTypeCol] : undefined,
      peRatio: peerPeCol >= 0 ? toNumber(r[peerPeCol]) : undefined,
      listingGainPct: peerGainCol >= 0 ? toNumber(r[peerGainCol]) : undefined,
    }));

  const subsHeaders = tables.subscription?.headers || [];
  const subsTimesCol = colIndexOf(subsHeaders, "Subscription (x)", "Subscription");
  const subsRow = (label) =>
    (tables.subscription?.rows || []).find((r) => new RegExp(`^${label}`, "i").test(cleanText(r[0])));
  const subsValue = (label) => {
    const row = subsRow(label);
    return row && subsTimesCol >= 0 ? toNumber(row[subsTimesCol]) : undefined;
  };
  const subscription = tables.subscription
    ? {
        total: subsValue("Total"),
        qib: subsValue("QIB"),
        nii: subsValue("NII"),
        bNii: subsValue("bNII"),
        sNii: subsValue("sNII"),
        retail: subsValue("Retail"),
        employee: subsValue("Employee"),
      }
    : undefined;

  const lotBreakup = (tables.lotBreakup?.rows || []).map((r) => ({
    category: r[0],
    lots: r[1],
    shares: r[2],
    amount: r[3],
  }));

  const expenses = (tables.expenses?.rows || [])
    .filter((r) => r[1] && !/^total$/i.test(r[1]))
    .map((r) => ({ title: r[1], amountCr: toNumber(r[2]) }));

  const priceBand = kvLookup(kv, "Price Band");
  const priceBandParts = (priceBand || "").split(/to|-/).map(toNumber).filter((n) => n !== undefined);
  const priceBandLow = priceBandParts[0];
  const priceBandHigh = priceBandParts.length > 1 ? priceBandParts[priceBandParts.length - 1] : priceBandParts[0];

  const issuePriceStr = kvLookup(kv, "Issue Price") || cards.cardIssuePrice;
  const issuePrice = toNumber(issuePriceStr) ?? priceBandHigh;

  const aggCr = (str) => toNumber((str || "").match(/agg\.[^₹]*₹([\d,.]+)/)?.[1]);
  const totalCr = aggCr(kvLookup(kv, "Total Issue Size"));
  const freshCr = aggCr(kvLookup(kv, "Fresh Issue"));
  const ofsCr = aggCr(kvLookup(kv, "Offer for Sale"));
  const freshPct = totalCr && typeof freshCr === "number" ? Number(((freshCr / totalCr) * 100).toFixed(1)) : undefined;
  const ofsPct = totalCr && typeof ofsCr === "number" ? Number(((ofsCr / totalCr) * 100).toFixed(1)) : undefined;

  let structureLabel;
  if (typeof freshPct === "number") {
    if (!ofsCr) structureLabel = "Pure Fresh Issue";
    else if (freshPct >= 90) structureLabel = "Fresh-Issue Dominated";
    else if (freshPct >= 60) structureLabel = "Fresh-Issue Dominated";
    else if (freshPct >= 40) structureLabel = "Balanced Fresh + OFS";
    else structureLabel = "OFS Dominated";
  }

  const issueSplit = {
    totalCr,
    freshCr,
    ofsCr,
    freshPct,
    ofsPct,
    structureLabel,
    promoterOfsAmountCr,
    promoterSellerNames: promoterSellers.map((s) => s.name),
  };

  const dates = {
    openDate: timetable.openDate || cards.cardOpenDate,
    closeDate: timetable.closeDate || cards.cardCloseDate,
    allotmentDate: timetable.allotmentDate,
    refundsDate: timetable.refundsDate,
    dematCreditDate: timetable.dematCreditDate,
    listingDate: timetable.listingDate,
  };

  const openDateObj = parseDisplayDate(dates.openDate);
  const closeDateObj = parseDisplayDate(dates.closeDate);
  const now = new Date();
  let status = "UPCOMING";
  if (openDateObj && closeDateObj) {
    if (now >= openDateObj && now <= closeDateObj) status = "OPEN";
    else if (now > closeDateObj) status = "CLOSED";
    else status = "UPCOMING";
  }

  const listingAt = kvLookup(kv, "Listing At") || "";
  const category = discovered.category || (/sme|emerge/i.test(listingAt) ? "SME" : "MAINBOARD");

  return {
    id: discovered.id,
    name,
    symbol: discovered.id,
    category,
    status,
    logoUrl,
    sourceUrl: discovered.url,
    allotmentStatusUrl: `${BASE}/ipo_allotment_status/${discovered.slug}/${discovered.chittorgarhId}/`,
    about: aboutParas.join("\n\n"),

    details: {
      issueType: kvLookup(kv, "Issue Type"),
      saleType: kvLookup(kv, "Sale Type"),
      totalIssueSize: kvLookup(kv, "Total Issue Size"),
      freshIssue: kvLookup(kv, "Fresh Issue"),
      ofs: kvLookup(kv, "Offer for Sale"),
      priceBand: priceBand || issuePriceStr,
      issuePrice: issuePriceStr,
      faceValue: kvLookup(kv, "Face Value"),
      lotSize: kvLookup(kv, "Lot Size"),
      listing: kvLookup(kv, "Listing At"),
      marketCap: kvLookup(kv, "Market Cap") || cards.cardMarketCap,
      employeeDiscount: kvLookup(kv, "Employee Discount"),
      shareHoldingPreIssue: kvLookup(kv, "Share Holding Pre Issue"),
      shareHoldingPostIssue: kvLookup(kv, "Share Holding Post Issue"),
      registrar: registrarName?.trim(),
      leadManagers: leadManagerName?.trim(),
      prePromoterHolding,
      postPromoterHolding,
    },

    dates,

    lotBreakup,
    reservation,
    objectsOfIssue,
    ofsShareholders,
    expenses,
    brokerRecommendation,

    sector,
    sectorPeers,
    subscription,
    issueSplit,
    dataNotes,

    anchor: {
      bidDate: kvLookup(kv, "Bid Date"),
      sharesOffered: kvLookup(kv, "Shares Offered"),
      anchorPortionCr,
      allocationPct: anchorAllocationPct,
    },

    financials: {
      periods: finSeries.periods,
      currency: "₹ Crore",
      rowLabels: finSeries.rowLabels,
      sourceTable: "Chittorgarh — Company Financials",

      // Exact-label figures. Names here match what the source actually publishes.
      totalIncome,
      totalIncomeSourceLabel: totalIncomeLabel,
      pat,
      operatingProfit,
      operatingProfitSourceLabel,
      assets,
      borrowing,
      netWorth,
      reserves,
      operatingCashFlow: hasOperatingCashFlow ? operatingCashFlow : undefined,
      hasOperatingCashFlow,

      totalIncomeGrowth,
      patGrowth,
      operatingProfitGrowth,
      totalIncomeCagr,
      patCagr,
      operatingProfitCagr,
      assetGrowth,
      debtGrowth,
      netWorthGrowth,
      debtToEquity,
      operatingMargin,
      operatingMarginPrev,

      kpi,

      epsPre,
      epsPost,
      pePre,
      pePost,
      marketCapPre,
      marketCapPost,

      // Series for charting.
      incomeSeries: totalIncome.all,
      patSeries: pat.all,
      operatingProfitSeries: operatingProfit.all,
      assetsSeries: assets.all,
      borrowingSeries: borrowing.all,
      netWorthSeries: netWorth.all,

      // Back-compat aliases. Kept so older consumers keep working, but note that
      // `ebitda*` here is the source's "EBITDA" row, i.e. operating profit.
      income: totalIncome,
      ebitda: operatingProfit,
      salesGrowth: totalIncomeGrowth,
      profitGrowth: patGrowth,
      ebitdaGrowth: operatingProfitGrowth,
      roe: kpi.roe?.latest,
      roce: kpi.roce?.latest,
      ronw: kpi.ronw?.latest,
      patMargin: kpi.patMargin?.latest,
      ebitdaMargin: kpi.ebitdaMargin?.latest,
      priceToBook: kpi.priceToBook?.latest,
      pe: pePost,
    },

    issuePrice,
    priceBandLow,
  };
};

const fetchChittorgarhIpoDetails = async (id) => {
  const m = String(id || "").match(/^(.+)-(\d+)$/);
  if (!m) throw new Error(`Invalid IPO id "${id}". Expected format "<slug>-<numericId>".`);
  const [, slug, numericId] = m;
  const url = `${BASE}/ipo/${slug}/${numericId}/`;

  const cacheKey = `cg:detail:${id}`;
  const cached = await get(cacheKey);
  if (cached) return cached;

  const html = await fetchHtml(url);
  const detail = scrapeIpoDetail(html, {
    id,
    slug,
    chittorgarhId: numericId,
    name: slug.replace(/-ipo$/i, "").replace(/-/g, " "),
    category: undefined,
    url,
  });

  await set(cacheKey, detail, DETAIL_TTL);
  return detail;
};

const fetchLiveIpoListFromChittorgarh = async (categoryFilter) => {
  const categories = categoryFilter ? [categoryFilter] : ["MAINBOARD", "SME"];
  const linkLists = await Promise.all(categories.map((c) => fetchIpoLinks(c)));
  const links = linkLists.flat();

  const settled = await Promise.allSettled(links.map((link) => fetchChittorgarhIpoDetails(link.id)));

  settled
    .filter((r) => r.status === "rejected")
    .forEach((r) => logger.warn(`Chittorgarh IPO detail scrape failed: ${r.reason?.message || r.reason}`, { tag: "CHITTORGARH" }));

  const details = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);

  const relevant = details.filter((d) => d.status !== "CLOSED");
  relevant.sort((a, b) => {
    if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
    return 0;
  });

  if (relevant.length === 0 && details.length > 0) {
    logger.info("Chittorgarh IPO list: all discovered IPOs are closed; returning full set.", { tag: "CHITTORGARH" });
    return details;
  }
  return relevant;
};

const IPO_SITEMAP_URL = `${BASE}/google_sitemap_urlredirect.asp?a=27`;
const SITEMAP_TTL = 60 * 60 * 24;
const SITEMAP_LINK_RE = /\/ipo\/([a-z0-9-]+)-ipo\/(\d+)\//g;

const normalizeCompanyName = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/\b(ltd\.?|limited|pvt\.?|private|invit|reit)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const fetchIpoSlugSitemap = async () => {
  const cacheKey = "cg:sitemap:ipo";
  const cached = await get(cacheKey);
  if (cached) return cached;

  const xml = await fetchHtml(IPO_SITEMAP_URL, 30000);
  const index = {};
  for (const [, slug, numericId] of xml.matchAll(SITEMAP_LINK_RE)) {
    const key = normalizeCompanyName(slug.replace(/-/g, " "));
    if (key && !index[key]) index[key] = { slug: `${slug}-ipo`, chittorgarhId: numericId };
  }
  await set(cacheKey, index, SITEMAP_TTL);
  return index;
};

const resolveIpoBySlugSitemap = async (companyName) => {
  const index = await fetchIpoSlugSitemap();
  const key = normalizeCompanyName(companyName);
  if (index[key]) return index[key];

  const nameWords = new Set(key.split(" ").filter((w) => w.length > 2));
  let best = null;
  let bestScore = 0;
  for (const [slugKey, val] of Object.entries(index)) {
    const slugWords = slugKey.split(" ").filter((w) => w.length > 2);
    if (slugWords.length < 2) continue;
    const overlap = slugWords.filter((w) => nameWords.has(w)).length;
    if (overlap === slugWords.length && overlap > bestScore) {
      best = val;
      bestScore = overlap;
    }
  }
  return best;
};

const PERF_TRACKER_URL = {
  MAINBOARD: `${BASE}/ipo/ipo_perf_tracker.asp`,
  SME: `${BASE}/ipo/ipo_perf_tracker.asp?exchange=sme`,
};
const PERF_TTL = 1800;

const fetchListedIpoPerformance = async (category) => {
  const cacheKey = `cg:perf:${category}`;
  const cached = await get(cacheKey);
  if (cached) return cached;

  const html = await fetchHtml(PERF_TRACKER_URL[category]);
  const $ = cheerio.load(html);

  let rows = [];
  $("table").each((_, table) => {
    const $table = $(table);
    if (!/listing day gain/i.test($table.find("tr").first().text())) return;
    rows = $table
      .find("tr")
      .toArray()
      .slice(1)
      .map((tr) => $(tr).find("td").toArray().map((td) => cleanText($(td).text())))
      .filter((r) => r.length >= 3 && !/no record found/i.test(r[0]));
  });

  const list = rows.map((r) => ({
    name: r[0],
    listingGainPct: toNumber(r[1]),
    currentGainPct: toNumber(r[2]),
    category,
  }));

  await set(cacheKey, list, PERF_TTL);
  return list;
};

const fetchListedIpoTrackRecord = async (categoryFilter, limitPerCategory = 12) => {
  const categories = categoryFilter ? [categoryFilter] : ["MAINBOARD", "SME"];
  const perfLists = await Promise.all(categories.map((c) => fetchListedIpoPerformance(c)));
  const capped = perfLists.flatMap((list) => list.slice(0, limitPerCategory));

  const settled = await Promise.allSettled(
    capped.map(async (p) => {
      const resolved = await resolveIpoBySlugSitemap(p.name);
      if (!resolved) return { ...p, aiAvailable: false };
      try {
        const detail = await fetchChittorgarhIpoDetails(`${resolved.slug}-${resolved.chittorgarhId}`);
        return { ...p, aiAvailable: true, detail };
      } catch {
        return { ...p, aiAvailable: false };
      }
    }),
  );

  return settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
};

module.exports = {
  fetchLiveIpoListFromChittorgarh,
  fetchChittorgarhIpoDetails,
  fetchListedIpoTrackRecord,
  // Exported for tests: pure HTML -> structured detail, no network or cache.
  scrapeIpoDetail,
};
