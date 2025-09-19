import baseConfig from "../../eslint.config.base.mjs";

const eslintConfig = [
  ...baseConfig,
  {
    files: ['**/*.{js,ts}'],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "no-console": "warn",
      "prefer-const": "error",
    },
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "test-*.js",
    ],
  },
];

export default eslintConfig;