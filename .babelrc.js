module.exports = {
  plugins: ['@babel/plugin-syntax-dynamic-import'],
  presets: ['@babel/preset-react'],
  env: {
    development: {plugins: ['react-hot-loader/babel']},
    test: {
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        'dynamic-import-node'
      ]
    }
  }
}
