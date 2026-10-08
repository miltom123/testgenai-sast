module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  env: { node: true, es2022: true },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:security/recommended-legacy'],
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/', 'reports/'],
};
