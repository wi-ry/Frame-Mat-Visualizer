import js from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig({
  files: ["public/**/*.js"],

  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: {
      // Standard browser globals
      Event: "readonly",
      FileReader: "readonly",
      Image: "readonly",
      setTimeout: "readonly",
      clearTimeout: "readonly",
      alert: "readonly",
      console: "readonly",
      document: "readonly",
      window: "readonly",
      HTMLInputElement: "readonly",
      HTMLSelectElement: "readonly",
      HTMLCanvasElement: "readonly",
      CanvasRenderingContext2D: "readonly",
    },
  },

  plugins: { js },
  extends: ["js/recommended"],

  rules: {
    "no-console": "off", // allow console.log
  },
});
