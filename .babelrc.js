module.exports = {
  plugins: ['@babel/plugin-syntax-dynamic-import'],
  presets: ['@babel/preset-react'],
  env: {
    test: {plugins: ['@babel/plugin-transform-modules-commonjs']}
  }
}
