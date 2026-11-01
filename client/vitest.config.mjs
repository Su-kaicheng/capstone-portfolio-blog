import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Dedicated test config: jsdom + React transform only.
// Tailwind is intentionally not loaded here — the component logic does not
// depend on generated CSS, and this keeps the test run fast.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.js"],
    css: false,
    testTimeout: 40000,
    hookTimeout: 40000,
    restoreMocks: true,
  },
});
