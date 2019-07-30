module.exports = {
  manifest: {
    appName: 'Saros budgeting', // Your application's name. `string`
    appShortName: 'Saros', // Your application's short_name. `string`. Optional. If not set, appName will be used
    appDescription: 'Budgeting web app', // Your application's description. `string`
    background: '#2d6987', // Background colour for flattened icons. `string`
    theme_color: '#2d6987', // Theme color user for example in Android's task switcher. `string`
    start_url: '/index.html' // Start URL when launching the application from a device. `string`
  },
  locales: ['en', 'pt-BR']
}
