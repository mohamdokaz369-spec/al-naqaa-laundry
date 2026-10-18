import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pins the workspace root to this project. Without it, Next.js
    // auto-detects the root by walking up for the nearest lockfile and
    // picks up an unrelated package-lock.json in the parent ~/Desktop
    // folder (not part of this repo) — that's the "multiple lockfiles"
    // warning. See docs/PROJECT_CONTEXT or ask about that stray file;
    // it's outside this repo and safe to leave or remove independently.
    root: path.join(__dirname),
  },
};

export default nextConfig;
