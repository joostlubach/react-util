module.exports = {
  extends: '../../.eslintrc.yml',
  ignorePatterns: ['/.eslintrc.js', '/hooks.d.ts'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  }
}