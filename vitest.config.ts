import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Vitest configuration for `src/lib` smoke tests.
 *
 * To enable, install Vitest:
 *   npm install --save-dev vitest @testing-library/react jsdom
 *
 * Then run:
 *   npm test            # one-shot
 *   npm run test:watch  # watch mode
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/lib/**/*.{test,spec}.{ts,tsx}"],
  },
});
