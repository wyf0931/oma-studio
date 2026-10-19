import compat from "eslint-plugin-compat";

// Standard-library gaps are handled by the build's core-js usage analysis.
// Keep a separate guard for browser APIs that core-js cannot implement.
export default [
  {
    ...compat.configs["flat/recommended"],
    files: ["frontend/src/**/*.js"],
    languageOptions: {
      ...compat.configs["flat/recommended"].languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
];
