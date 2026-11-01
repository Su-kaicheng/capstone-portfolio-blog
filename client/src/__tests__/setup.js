import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// The live API can occasionally take a moment on a cold start.
configure({ asyncUtilTimeout: 8000 });

// jsdom does not implement these browser APIs that the SPA uses.
beforeEach(() => {
  window.scrollTo = () => {};
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  }
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
