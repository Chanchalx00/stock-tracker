const axios = require("axios");
const { get, set } = require("../config/redis");

const DOMAIN_MAP = {
  "RELIANCE.NS": "ril.com",
  "TCS.NS": "tcs.com",
  "HDFCBANK.NS": "hdfcbank.com",
  "ICICIBANK.NS": "icicibank.com",
  "INFY.NS": "infosys.com",
  "SBIN.NS": "sbi.co.in",
  "BHARTIARTL.NS": "airtel.in",
  "ITC.NS": "itcportal.com",
  "LT.NS": "larsentoubro.com",
  "HINDUNILVR.NS": "hul.co.in",
  "KOTAKBANK.NS": "kotak.com",
  "ASIANPAINT.NS": "asianpaints.com",
  "AXISBANK.NS": "axisbank.com",
  "MARUTI.NS": "marutisuzuki.com",
  "SUNPHARMA.NS": "sunpharma.com",
  "TITAN.NS": "titan.co.in",
  "ULTRACEMCO.NS": "ultratechcement.com",
  "NESTLEIND.NS": "nestle.in",
  "BAJFINANCE.NS": "bajajfinserv.in",
  "WIPRO.NS": "wipro.com",
  "M&M.NS": "mahindra.com",
  "TATASTEEL.NS": "tatasteel.com",
  "ADANIENT.NS": "adanienterprises.com",
  "ADANIPORTS.NS": "adaniports.com",
  "JSWSTEEL.NS": "jsw.in",
  "BAJAJFINSV.NS": "bajajfinserv.in",
  "HINDALCO.NS": "hindalco.com",
  "INDUSINDBK.NS": "indusind.com",
  "TECHM.NS": "techmahindra.com",
  "CIPLA.NS": "cipla.com",
  "DRREDDY.NS": "drreddys.com",
  "EICHERMOT.NS": "eichermotors.com",
  "BRITANNIA.NS": "britannia.co.in",
  "APOLLOHOSP.NS": "apollohospitals.com",
  "DIVISLAB.NS": "divislabs.com",
  "BPCL.NS": "bharatpetroleum.in",
  "HEROMOTOCO.NS": "heromotocorp.com",
  "HDFCLIFE.NS": "hdfclife.com",
  "SHRIRAMFIN.NS": "shriramfinance.in",
  "TATACONSUM.NS": "tataconsumer.com",
  "BEL.NS": "bel-india.com",
};

const LOGO_TTL = 60 * 60 * 24; 
const LOGO_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" };

const fetchImage = async (url) => {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers: LOGO_HEADERS,
    timeout: 6000,
    validateStatus: (status) => status === 200,
  });

  const contentType = res.headers["content-type"] || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Response was not an image");
  }

  return { data: Buffer.from(res.data).toString("base64"), contentType };
};

const getLogo = async (symbol) => {
  const domain = DOMAIN_MAP[symbol.toUpperCase()];
  if (!domain) return null;

  const cacheKey = `logo:${domain}`;
  const cached = await get(cacheKey);
  if (cached) return cached.missing ? null : cached;

  const sources = [
    `https://logo.clearbit.com/${domain}?size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  for (const url of sources) {
    try {
      const logo = await fetchImage(url);
      await set(cacheKey, logo, LOGO_TTL);
      return logo;
    } catch {
      // try the next source
    }
  }

  await set(cacheKey, { missing: true }, LOGO_TTL);
  return null;
};

const PALETTE = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const colorForSymbol = (symbol) => {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const escapeXml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const initialsForSymbol = (symbol) =>
  symbol.replace(/^\^/, "").replace(/\.(NS|BO)$/i, "");

const fontSizeForText = (text) => {
  const usableWidth = 100;
  const estimatedCharWidth = 0.62;
  const maxFont = 52;
  const minFont = 16;
  const fit = usableWidth / (text.length * estimatedCharWidth);
  return Math.round(Math.max(minFont, Math.min(maxFont, fit)));
};
const generateFallbackLogo = (symbol) => {
  const text = escapeXml(initialsForSymbol(symbol));
  const color = colorForSymbol(symbol);
  const fontSize = fontSizeForText(text);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><text x="64" y="66" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}" fill="${color}" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;

  return {
    data: Buffer.from(svg).toString("base64"),
    contentType: "image/svg+xml",
  };
};

module.exports = { getLogo, generateFallbackLogo };
