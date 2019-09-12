const path = require('path')
const webpack = require('webpack')

const AssetsPlugin = require('./plugins/webpack-assets-plugin')
const {manifest} = require('./saros.config')

const production = process.env.NODE_ENV === 'production'

const config = {
  mode: production ? 'production' : 'development',
  entry: './src/index.js',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: `[name].[${production ? 'contenthash' : 'hash'}].js`,
    publicPath: '/',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: [/\.jsx$/, /loaders\/.+\.js$/],
        exclude: /node_modules/,
        use: ['babel-loader']
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
                      }),
                      require('cssnano')
                    ]
                  : [])
              ]
            }
          }
        ]
      },
      {
        test: /\.md$/,
        loader: ['babel-loader', './src/loaders/markdown.js']
      },
      {
        test: /\.svg$/,
        loader: 'svg-url-loader?limit=65536'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': `"${process.env.NODE_ENV ||
        'development'}"`
    }),
    new AssetsPlugin({
      source: `./src/assets/${
        production ? 'brown_money_bag' : 'institution_icon'
      }.svg`,
      html: './src/index.html.ejs',
      manifest
    })
  ]
}

if (production) {
  const {CleanWebpackPlugin} = require('clean-webpack-plugin')
  const WorkboxPlugin = require('workbox-webpack-plugin')
  config.optimization = {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
  config.plugins.push(new CleanWebpackPlugin())
  config.plugins.push(
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: false,
      exclude: [
        /\.(?:png|jpg|jpeg|svg)$/,
        /\/__\/auth\/{*.*,.*}/ // to allow firebase google auth
      ],
      runtimeCaching: [
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 10
            }
          }
        }
      ]
    })
  )
} else {
  config.entry = ['react-hot-loader/patch', './src/index.js']
  config.devtool = 'eval-source-map'
  config.devServer = {
    contentBase: './server',
    stats: 'minimal',
    host: 'localhost',
    port: 9000,
    hot: true,
    overlay: {
      errors: true,
      warnings: true
    }
  }
  config.plugins.push(new webpack.HotModuleReplacementPlugin())
}

module.exports = config
