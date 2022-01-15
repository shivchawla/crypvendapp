const pify = require('pify')
const RNFS = require('react-native-file-access')
const writeFile = RNFS.FileSystem.writeFile
const path = require('path')

function save (dataPath, operatorInfo) {
  return writeFile(path.resolve(dataPath, 'operator-info.json'), JSON.stringify(operatorInfo))
}

async function load (dataPath) {
  try {
    return JSON.parse(await RNFS.FileSystem.readFile(path.resolve(dataPath, 'operator-info.json')))
  } catch (err) {
    return { active: false }
  }
}

module.exports = { save, load }
