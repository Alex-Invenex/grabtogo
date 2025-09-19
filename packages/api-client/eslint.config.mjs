import baseConfig from "../../eslint.config.base.mjs";

const eslintConfig = [
  ...baseConfig,
  {
    files: ['**/*.{js,ts}'],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "prefer-const": "error",
    },
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
    ],
  },
];

export default eslintConfig;