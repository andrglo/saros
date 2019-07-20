const fs = require('fs')
const path = require('path')
const glob = require('glob')

const scanDir = dir =>
  fs
    .readdirSync(dir)
    .filter(
      file =>
        !['index', 'loader', 'test'].reduce(
          (r, v) => r || file.indexOf(v) > -1,
          false
        )
    )
    .map(file => path.basename(file, '.js'))
    .map(
      file => `import ${file} from '${path
        .join(dir, file)
        .replace(/\\/g, '/')}';
                export {${file}};
                names.push('${file}');
                `
    )

module.exports = function reducersLoader() {
  const callback = this.async()
  if (!callback) {
    console.error('Loader for apps reducers is async')
    process.exit(1)
  }

  const reducersDirs = glob.sync(path.join(__dirname, '**/reducers'))

  let reducers = []
  for (const dirName of reducersDirs) {
    reducers = [...reducers, ...scanDir(dirName)]
  }

  const source = `
    const names = [];
    ${reducers.join(';')}
    const duplicateNames = [];
    const uniqueNames = [];
    names.forEach(name => {
      if (uniqueNames.indexOf(name) === -1) {
        uniqueNames.push(name);
      } else {
        duplicateNames.push(name);
      }
    });
    if (duplicateNames.length) {
      console.error('Reducer names are duplicated:', duplicateNames);
    }
  `
  callback(null, source)
}
