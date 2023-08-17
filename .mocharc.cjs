module.exports = {
  'watch-files': [
    './**/*.ts'
  ],
  require: require.resolve('./mocha-setup.cjs'),
  loader: 'ts-node/esm'
}
