const axios = require("axios");
const { get, set } = require("../config/redis");

const DOMAIN_MAP = {
  "RELIANCE.NS": "ril.com",
  "RELIANCE": "ril.com",
  "TCS.NS": "tcs.com",
  "TCS": "tcs.com",
  "HDFCBANK.NS": "hdfcbank.com",
  "HDFCBANK": "hdfcbank.com",
  "ICICIBANK.NS": "icicibank.com",
  "ICICIBANK": "icicibank.com",
  "INFY.NS": "infosys.com",
  "INFY": "infosys.com",
  "SBIN.NS": "sbi.co.in",
  "SBIN": "sbi.co.in",
  "BHARTIARTL.NS": "airtel.in",
  "BHARTIARTL": "airtel.in",
  "ITC.NS": "itcportal.com",
  "ITC": "itcportal.com",
  "LT.NS": "larsentoubro.com",
  "LT": "larsentoubro.com",
  "HINDUNILVR.NS": "hul.co.in",
  "HINDUNILVR": "hul.co.in",
  "KOTAKBANK.NS": "kotak.com",
  "KOTAKBANK": "kotak.com",
  "ASIANPAINT.NS": "asianpaints.com",
  "ASIANPAINT": "asianpaints.com",
  "AXISBANK.NS": "axisbank.com",
  "AXISBANK": "axisbank.com",
  "MARUTI.NS": "marutisuzuki.com",
  "MARUTI": "marutisuzuki.com",
  "SUNPHARMA.NS": "sunpharma.com",
  "SUNPHARMA": "sunpharma.com",
  "TITAN.NS": "titan.co.in",
  "TITAN": "titan.co.in",
  "ULTRACEMCO.NS": "ultratechcement.com",
  "ULTRACEMCO": "ultratechcement.com",
  "NESTLEIND.NS": "nestle.in",
  "NESTLEIND": "nestle.in",
  "BAJFINANCE.NS": "bajajfinserv.in",
  "BAJFINANCE": "bajajfinserv.in",
  "WIPRO.NS": "wipro.com",
  "WIPRO": "wipro.com",
  "M&M.NS": "mahindra.com",
  "M&M": "mahindra.com",
  "TATASTEEL.NS": "tatasteel.com",
  "TATASTEEL": "tatasteel.com",
  "ADANIENT.NS": "adanienterprises.com",
  "ADANIENT": "adanienterprises.com",
  "HYUNDAI": "hyundai.com",
  "SWIGGY": "swiggy.com",
  "WAAREE": "waaree.com",
  "NTPCGREEN": "ntpcgreenenergy.com",
  "AFCONS": "afcons.com",
};

const LOGO_TTL = 60 * 60 * 24 * 7; 
const LOGO_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

const fetchImage = async (url) => {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers: LOGO_HEADERS,
    timeout: 5000,
    validateStatus: (status) => status === 200,
  });

  const contentType = res.headers["content-type"] || "image/png";
  return { data: Buffer.from(res.data).toString("base64"), contentType };
};

const getLogo = async (symbol) => {
  const cleanSym = symbol.toUpperCase().replace(/\.(NS|BO)$/i, "");
  let domain = DOMAIN_MAP[symbol.toUpperCase()] || DOMAIN_MAP[cleanSym] || `${cleanSym.toLowerCase()}.com`;

  const cacheKey = `logo_v3:${cleanSym}`;
  const cached = await get(cacheKey);
  if (cached && !cached.missing && cached.contentType !== "image/svg+xml") {
    return cached;
  }

  // 1. Try Companies Market Cap official HD stock logo CDN
  const cmcUrls = [
    `https://companiesmarketcap.com/img/company-logos/64/${cleanSym}.NS.png`,
    `https://companiesmarketcap.com/img/company-logos/64/${cleanSym}.png`,
  ];

  for (const cmcUrl of cmcUrls) {
    try {
      const logo = await fetchImage(cmcUrl);
      if (logo && logo.data && logo.data.length > 500) {
        await set(cacheKey, logo, LOGO_TTL);
        return logo;
      }
    } catch {
      // try next
    }
  }

  // 2. Try candidate domain logo open APIs
  const candidateDomains = [
    domain,
    `${cleanSym.toLowerCase()}.co.in`,
    `${cleanSym.toLowerCase()}india.com`,
  ];

  for (const dom of candidateDomains) {
    const sources = [
      `https://logo.clearbit.com/${dom}?size=128`,
      `https://icon.horse/icon/${dom}`,
      `https://unavatar.io/${dom}`,
      `https://www.google.com/s2/favicons?domain=${dom}&sz=128`,
    ];

    for (const url of sources) {
      try {
        const logo = await fetchImage(url);
        if (logo && logo.data && logo.data.length > 300) {
          await set(cacheKey, logo, LOGO_TTL);
          return logo;
        }
      } catch {
        // try next source
      }
    }
  }

  return generateFallbackLogo(symbol);
};

const PALETTE = [
  "#059669",
  "#2563eb",
  "#7c3aed",
  "#d97706",
  "#e11d48",
  "#0891b2",
  "#4f46e5",
  "#db2777",
  "#0d9488",
  "#ea580c",
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

const initialsForSymbol = (symbol) => {
  const clean = symbol.replace(/^\^/, "").replace(/\.(NS|BO)$/i, "").toUpperCase();
  return clean.slice(0, 3);
};

const generateFallbackLogo = (symbol) => {
  const text = escapeXml(initialsForSymbol(symbol));
  const color = colorForSymbol(symbol);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="32" fill="${color}" />
    <text x="64" y="70" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;

  return {
    data: Buffer.from(svg).toString("base64"),
    contentType: "image/svg+xml",
  };
};

module.exports = { getLogo, generateFallbackLogo };
