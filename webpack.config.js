const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')

const production = process.env.NODE_ENV === 'production'

const config = {
  mode: production ? 'production' : 'development',
  entry: './src/index.js',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'saros.js',
    publicPath: '/',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader']
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                require('tailwindcss'),
                require('autoprefixer'),
                ...(production
                  ? [
                      require('@fullhuman/postcss-purgecss')({
                        content: ['./src/**/*.jsx'],
                        defaultExtractor: content =>
                          content.match(/[A-Za-z0-9-_:/]+/g) || []
                      })
                    ]
                  : [])
              ]
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${process.env.NODE_ENV ||
        'development'}"`,
      'process.env.FIREBASE_API_KEY': `"${process.env.FIREBASE_API_KEY}"`,
      'process.env.FIREBASE_AUTH_DOMAIN': `"${process.env.FIREBASE_AUTH_DOMAIN}"`,
      'process.env.FIREBASE_DATABASE_URL': `"${process.env.FIREBASE_DATABASE_URL}"`,
      'process.env.FIREBASE_PROJECT_ID': `"${process.env.FIREBASE_PROJECT_ID}"`,
      'process.env.FIREBASE_STORAGE_BUCKET': `"${process.env.FIREBASE_STORAGE_BUCKET}"`,
      'process.env.FIREBASE_MESSAGING_SENDER_ID': `"${process.env.FIREBASE_MESSAGING_SENDER_ID}"`,
      'process.env.FIREBASE_APP_ID': `"${process.env.FIREBASE_APP_ID}"`
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin(['./src/index.html'])
  ]
}

if (production) {
  // todo
} else {
  config.devtool = 'eval-source-map'
  config.devServer = {
    contentBase: './public',
    hot: true,
    stats: 'minimal',
    host: 'localhost',
    port: 8000,
    overlay: {
      errors: true,
      warnings: true
    }
  }
  config.plugins.push(new webpack.HotModuleReplacementPlugin())
}

module.exports = config
