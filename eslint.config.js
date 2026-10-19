import compat from "eslint-plugin-compat";
import vue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: ["frontend/src/features/**/*.ts", "frontend/src/shared/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ThisExpression",
          message: "Feature logic must use owned state and explicit capabilities, never a bound application context.",
        },
      ],
    },
  },
  {
    files: ["frontend/src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../features/**", "../../features/**", "../app/**"],
              message: "Shared capabilities must not import feature implementations.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["frontend/src/**/*.{ts,vue}"],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: [".vue"] } },
    plugins: { compat },
    rules: {
      "compat/compat": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "vue/no-v-html": "off",
    },
  },
);
