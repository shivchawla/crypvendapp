const pify = require('pify')
const RNFS = require('react-native-fs')
const writeFile = RNFS.writeFile
const path = require('path')

function save (dataPath, operatorInfo) {
  return writeFile(path.resolve(dataPath, 'operator-info.json'), JSON.stringify(operatorInfo))
}

function load (dataPath) {
  try {
    return JSON.parse(RNFS.readFileSync(path.resolve(dataPath, 'operator-info.json')))
  } catch (err) {
    return { active: false }
  }
}

module.exports = { save, load }
