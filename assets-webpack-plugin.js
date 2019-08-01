const fs = require('fs')
const path = require('path')
const util = require('util')
const favicons = require('favicons')
const ejs = require('ejs')
const glob = require('glob')
const deburr = require('lodash/deburr')
const snakeCase = require('lodash/snakeCase')
const isEqual = require('lodash/isEqual')

const config = require('./saros.config')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const normalize = str => deburr((str || '').trim().toLowerCase())

const defaultConfig = {
  path: '/', // Path for overriding default icons path. `string`
  appName: null, // Your application's name. `string`
  appShortName: null, // Your application's short_name. `string`. Optional. If not set, appName will be used
  appDescription: null, // Your application's description. `string`
  developerName: null, // Your (or your developer's) name. `string`
  developerURL: null, // Your (or your developer's) URL. `string`
  dir: 'auto', // Primary text direction for name, short_name, and description
  lang: 'en-US', // Primary language for name and short_name
  background: '#fff', // Background colour for flattened icons. `string`
  theme_color: '#fff', // Theme color user for example in Android's task switcher. `string`
  appleStatusBarStyle: 'black-translucent', // Style for Apple status bar: "black-translucent", "default", "black". `string`
  display: 'standalone', // Preferred display mode: "fullscreen", "standalone", "minimal-ui" or "browser". `string`
  orientation: 'any', // Default orientation: "any", "natural", "portrait" or "landscape". `string`
  scope: '/', // set of URLs that the browser considers within your app
  start_url: '/?homescreen=1', // Start URL when launching the application from a device. `string`
  version: '1.0', // Your application's version string. `string`
  logging: false, // Print logs to console? `boolean`
  pixel_art: false, // Keeps pixels "sharp" when scaling up, for pixel art.  Only supported in offline mode.
  loadManifestWithCredentials: false, // Browsers don't send cookies when fetching a manifest, enable this to fix that. `boolean`
  icons: {
    // Platform Options:
    // - offset - offset in percentage
    // - background:
    //   * false - use default
    //   * true - force use default, e.g. set background for Android icons
    //   * color - set background for the specified icons
    //   * mask - apply mask in order to create circle icon (applied by default for firefox). `boolean`
    //   * overlayGlow - apply glow effect after mask has been applied (applied by default for firefox). `boolean`
    //   * overlayShadow - apply drop shadow after mask has been applied .`boolean`
    //
    android: true, // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
    appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
    appleStartup: true, // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
    coast: false, // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
    favicons: true, // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
    firefox: true, // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
    windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
    yandex: false // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
  }
}

let cache

class AssetsPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      'AssetsPlugin',
      (compilation, callback) => {
        const manifest = this.options.manifest || {}
        const icons = this.options.icons || {}
        const config = {
          ...defaultConfig,
          ...manifest,
          icons: {
            ...defaultConfig.icons,
            ...icons
          }
        }
        const buildAssets = response => {
          for (const image of response.images) {
            const fileName =
              config.path === '/'
                ? image.name
                : path.join(config.path, image.name)
            compilation.assets[fileName] = {
              source: () => image.contents,
              size: () => image.contents.length
            }
          }
          for (const file of response.files) {
            const fileName =
              config.path === '/'
                ? file.name
                : path.join(config.path, file.name)
            compilation.assets[fileName] = {
              source: () => file.contents,
              size: () => file.contents.length
            }
          }
          if (this.options.html) {
            let entry
            for (const filename in compilation.assets) {
              if (filename.includes('main')) {
                entry = filename
                break
              }
            }
            const str = fs.readFileSync(this.options.html).toString()
            const html = ejs.render(str, {
              assets: response.html.join('\n  '),
              entry
            })
            compilation.assets['index.html'] = {
              source: () => html,
              size: () => html.length
            }
          }
          callback()
        }
        if (cache) {
          buildAssets(cache)
          return
        }
        favicons(this.options.source, config, (err, response) => {
          if (err) {
            callback(err)
            return
          }
          buildAssets(response)
          cache = response
        })
      }
    )

    compiler.hooks.emit.tapAsync(
      'TranslationPlugin',
      (compilation, callback) => {
        const translationsFilename = './src/assets/translations.json'
        let oldTranslations
        const newTranslations = {}
        const regex = /t`[^`]+`/gm
        const extractTranslations = async filename => {
          if (!oldTranslations) {
            oldTranslations = JSON.parse(
              (await readFile(translationsFilename)).toString()
            )
          }
          const content = (await readFile(filename)).toString()
          let m = regex.exec(content)
          while (m) {
            if (m.index === regex.lastIndex) {
              regex.lastIndex += 1
            }
            m.forEach(match => {
              let text = match
                .split('\n')
                .map(str => str.trim())
                .join('')
              const requirePlural = text.match(/\$\{\d+\}/)
              text = text
                .replace(/\$\{\d+\}/g, '*')
                .replace(/`/g, '')
                .slice(1)
              const key = snakeCase(
                normalize(text).replace(/\*/g, 'n')
              )
              newTranslations[key] = {}
              config.locales.forEach(locale => {
                const oldTranslation = oldTranslations[key] || {}
                if (requirePlural) {
                  newTranslations[key][locale] = oldTranslation[
                    locale
                  ] || [text, text]
                } else {
                  newTranslations[key][locale] =
                    oldTranslation[locale] || text
                }
              })
            })
            m = regex.exec(content)
          }
        }
        const saveNewTranslations = async () => {
          const translations = {}
          Object.keys(newTranslations)
            .sort()
            .forEach(key => {
              translations[key] = newTranslations[key]
            })
          if (isEqual(oldTranslations, translations)) {
            return
          }
          await writeFile(
            translationsFilename,
            JSON.stringify(translations, null, '  ') + '\n'
          )
        }
        glob(path.join(__dirname, 'src/**/*.js*'), (err, matches) => {
          if (err) {
            callback(err)
            return
          }
          const tasks = []
          for (const filename of matches) {
            if (!filename.includes('test')) {
              tasks.push(extractTranslations(filename))
            }
          }
          Promise.all(tasks)
            .then(saveNewTranslations)
            .then(() => {
              const runtimeTranslations = {}
              Object.keys(newTranslations).forEach(text => {
                const textTranslations = newTranslations[text]
                Object.keys(textTranslations).forEach(language => {
                  runtimeTranslations[language] =
                    runtimeTranslations[language] || {}
                  runtimeTranslations[language][text] =
                    textTranslations[language]
                })
              })
              Object.keys(runtimeTranslations).forEach(language => {
                const content = JSON.stringify(
                  runtimeTranslations[language]
                )
                compilation.assets[`locale/${language}.json`] = {
                  source: () => content,
                  size: () => content.length
                }
              })
              callback()
            })
            .catch(callback)
        })
      }
    )
  }
}

module.exports = AssetsPlugin
