import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
  {
    rules: {
      // Downgraded from error, not disabled — both still show up in
      // `npm run lint`, they just don't fail CI. Two concrete cases show
      // why "always wrong" doesn't hold here:
      //  - CookieConsent starts hidden and reveals itself from an effect
      //    on purpose, to avoid flashing the banner to returning visitors
      //    during SSR before localStorage can be checked client-side.
      //  - CandlestickChart's ~20 flags are lightweight-charts' own
      //    imperative ref API (create/update a chart instance outside
      //    React's render cycle) — there's no idiomatic alternative.
      // Everywhere else, treat a new warning here as a real signal.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];

export default eslintConfig;
