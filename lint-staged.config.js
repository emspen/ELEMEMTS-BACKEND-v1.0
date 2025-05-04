const config = {
  'backend/**/**/**/*.{ts}': ['eslint --fix', 'prettier --write', 'git add'],
}
export default config
