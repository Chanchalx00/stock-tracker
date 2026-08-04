import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (server + only the
  // node_modules it actually needs) so the Docker image doesn't have to
  // ship the full node_modules tree.
  output: "standalone",
  // The repo root now also has a package-lock.json (for the Husky
  // pre-commit hook), which made Turbopack's root-inference guess wrong —
  // pin it explicitly to this directory instead.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
