const pify = require('pify')
const RNFS = require('react-native-file-access')
const writeFile = RNFS.FileSystem.writeFile
const path = require('path')
const _ = require('lodash/fp')

function save (dataPath, machineInfo) {
  machineInfo = _.assign(machineInfo, { active: true })
  return writeFile(path.resolve(dataPath, 'machine-info.json'), JSON.stringify(machineInfo))
}

async function load (dataPath) {
  try {
    return JSON.parse(await RNFS.FileSystem.readFile(path.resolve(dataPath, 'machine-info.json')))
  } catch (err) {
    return { active: false }
  }
}

module.exports = { save, load }
