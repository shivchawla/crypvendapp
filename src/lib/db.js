const _ = require('lodash/fp')
const pify = require('pify')
const RNFS = require('react-native-fs')
const uuid = require('uuid')
const path = require('path')

const BN = require('./bn')

let dbName

module.exports = {save, prune}

function list (dbRoot) {
  return RNFS.mkdir(dbRoot)
    .catch(() => {})
    .then(() => RNFS.readdir(dbRoot))
}

function rotate (dbRoot) {
  dbName = 'tx-db-' + uuid.v4() + '.dat'
  return RNFS.mkdir(dbRoot)
    .catch(() => {})
    .then(() => RNFS.writeFile(path.resolve(dbRoot, dbName), ''))
}

function save (dbRoot, tx) {
  // console.log("Saving Transaction");
  // console.log(path.resolve(dbRoot, dbName));
  // console.log(JSON.stringify(tx));

  return RNFS.appendFile(path.resolve(dbRoot, dbName), JSON.stringify(tx) + '\n')
}

function nuke (dbPath) {
  return RNFS.unlink(dbPath)
}

function safeJsonParse (txt) {
  // console.log("Safe JSON parse");
  // console.log(txt);
  try {
    return JSON.parse(txt)
  } catch (_) {

  }
}

function pruneFile (dbRoot, cleanP, _dbName) {
  // console.log("In Prune File");
  const dbPath = path.resolve(dbRoot, _dbName)

  // console.log(dbPath);

  return load(dbPath)
    .then(txs => {console.log("Loaded Db path"); return cleanP(txs)})
    .then(r => {
      // console.log("After Clean P; Ready to nuke");
      return nuke(dbPath)
        .catch(err => console.log(`Couldn't nuke ${dbPath}: ${err}`))
        .then(() => r)
    })
}

function prune (dbRoot, cleanP) {
  return list(dbRoot)
    .then(files => {
      // console.log(`Processing ${files.length} db files`)
      // console.log(files);

      return rotate(dbRoot)
        .then(() => {
          const promises = _.map(file => pruneFile(dbRoot, cleanP, file), files)
          return Promise.all(promises)
            .then(results => {
              const sum = _.sum(results)
              if (sum === 0) return console.log('No pending txs to process.')
              console.log(`Successfully processed ${_.sum(results)} pending txs.`)
            })
            .catch(err => {console.log(err); console.log(`Error processing pending txs: ${err.stack}`)})
        })
    })
}

function massage (tx) {
  if (!tx) return

  const massagedFields = {
    fiat: _.isNil(tx.fiat) ? undefined : BN(tx.fiat),
    cryptoAtoms: _.isNil(tx.cryptoAtoms) ? undefined : BN(tx.cryptoAtoms)
  }

  return _.assign(tx, massagedFields)
}

function load (dbPath) {
  const txTable = {}

  return RNFS.readFile(dbPath, 'utf8')
    .then(f => {
      console.log("Read File");
      console.log(dbPath);
      console.log(f);
      const recs = f.split('\n')
      const parse = _.flow([safeJsonParse, massage])
      const txs = _.remove(_.isEmpty, _.map(parse, recs))
      _.forEach(tx => { console.log("Something ForEach Tx"); console.log(tx); txTable[tx.id] = tx }, txs)
      return _.sortBy(tx => tx.deviceTime, _.values(txTable))
    })
}
