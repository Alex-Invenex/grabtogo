import baseConfig from "../../eslint.config.base.mjs";

const eslintConfig = [
  ...baseConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "error",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
    ],
  },
];

export default eslintConfig;