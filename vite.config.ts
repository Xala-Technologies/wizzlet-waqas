import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "child_process";
import { componentTagger } from "lovable-tagger";

function gitSha(): string {
  if (process.env.VITE_RELEASE_SHA) return process.env.VITE_RELEASE_SHA;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    },
  },
  define: {
    "import.meta.env.VITE_RELEASE_SHA": JSON.stringify(gitSha()),
    "import.meta.env.VITE_RELEASE_CHANNEL": JSON.stringify(
      process.env.VITE_RELEASE_CHANNEL ?? process.env.VITE_APP_ENV ?? mode,
    ),
  },
}));
