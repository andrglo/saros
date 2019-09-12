// @codegen
const path = require('path')
const glob = require('glob')

const reducersFiles = glob
  .sync(path.join(__dirname, '../reducers/**/*.js'))
  .filter(dir => !dir.includes('test'))

const reducers = []
for (const fullName of reducersFiles) {
  const name = path.basename(fullName, '.js')
  reducers.push(
    `import ${name} from '${fullName}';
       reducers.${name} = ${name};
       names.push('${name}')`
  )
}

module.exports = `
  const names = [];
  const reducers = {}
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
  };
  export default reducers;
`
