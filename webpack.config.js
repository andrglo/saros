const path = require('path')
const webpack = require('webpack')

const AssetsPlugin = require('./assets-plugin')

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
        test: /\.jsx$/,
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
        production ? 'dispersarpago' : 'institution_icon'
      }.svg`,
      html: './src/index.html.ejs',
      manifest: {
        appName: 'Cash easy notes', // Your application's name. `string`
        appShortName: 'CashNotes', // Your application's short_name. `string`. Optional. If not set, appName will be used
        appDescription: 'Budgeting web app', // Your application's description. `string`
        background: '#2d6987', // Background colour for flattened icons. `string`
        theme_color: '#2d6987', // Theme color user for example in Android's task switcher. `string`
        start_url: '/index.html' // Start URL when launching the application from a device. `string`
      }
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
