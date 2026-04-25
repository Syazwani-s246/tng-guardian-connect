// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      port: 8080,
      proxy: {
        // Proxy API calls to AWS API Gateway during local development (avoids CORS)
        "/receiver": {
          target:
            process.env.VITE_API_URL ??
            "https://vmctgel4cf.execute-api.ap-southeast-1.amazonaws.com/prod",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  },
});
