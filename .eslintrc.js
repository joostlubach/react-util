module.exports = {
  extends: '../../.eslintrc.web.yml',
  ignorePatterns: ['/.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  }
}