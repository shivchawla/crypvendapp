'use strict'

// console.log("In True Trader");
const EventEmitter = require('events').EventEmitter
const qs = require('querystring')
const util = require('util')

import 'react-native-get-random-values';
const uuid = require('uuid')

const _ = require('lodash/fp')
const semver = require('semver')

// console.log("In True Trader - 2");

const BN = require('./bn')
const E = require('./error')

const version = require('../config/version.json').version

// console.log("In True Trader - 3");

const mapValuesWithKey = _.mapValues.convert({ 'cap': false })

const _request = require('./request')
const logs = require('./logs')
const operatorInfo = require('./operator-info')
const machineInfo = require('./machine-info')

// console.log("In True Trader - 4");
const { TRIGGER_TYPES, DIRECTIONS, REQUIREMENTS } = require('./compliance/triggers/consts')


// console.log("In True Trader - 5");
const NETWORK_DOWN_COUNT_THRESHOLD = 3
const DISPENSE_TIMEOUT = 120000
const NETWORK_TIMEOUT = 5000
const LOGS_SYNC_INTERVAL = 60 * 1000

let serialNumber = 0
let networkDownCount = 0
let epipeLog = null
let epipePoll = null

// console.log("In True Trader - 7");
const pid = uuid.v4()

// console.log("In True Trader - 8");


// console.log("In True Trader - 6");

// TODO: need to pass global options to request
const Trader = function (protocol, clientCert, connectionInfo, dataPath, relayedModel) {
  if (!(this instanceof Trader)) return new Trader(protocol, clientCert, connectionInfo, dataPath, relayedModel)
  EventEmitter.call(this)

// console.log("Trader: WTF 1")
  const globalOptions = {
    protocol,
    connectionInfo,
    clientCert
  }


  // console.log("Trader: WTF 2")

  this.request = options => _request.request(this.configVersion, globalOptions, options)
  this.globalOptions = globalOptions
  this.model = relayedModel ? relayedModel : 'unknown'
  this.balanceRetries = 0
  this.pollRetries = 0
  this.state = { state: 'initial', isIdle: false }
  this.configVersion = null
  this.dispenseIntervalPointer = null
  this.terms = false
  this.termsConfigVersion = null
  this.dataPath = dataPath
  this.operatorInfo = operatorInfo.load(dataPath)
  this.areThereAvailablePromoCodes = null

  // console.log("Trader: WTF 3")
  // Start logs sync
  setInterval(this.syncLogs.bind(this), LOGS_SYNC_INTERVAL)
  this.syncLogs()
}

util.inherits(Trader, EventEmitter)

/**
 * Synchronize logs with the server
 *
 * @name syncLogs
 * @function
 *
 * @returns {null}
 */
Trader.prototype.syncLogs = function syncLogs () {
  // Get last seen timestamp from server
  epipeLog = new Date()
  this.request({ path: '/logs', method: 'get', noRetry: true })
    .then(data => data.body)
  // Delete log files that are two or more days old
    .then((it) => {
      const twoDaysAgo = (() => {
        let date = new Date()

        // Notice that `setDate()` can take negative values. So if you'd take
        // -2 days on the 1st of April you'd get the 30th of March. Several
        // examples can be seen at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setDate#Using_setDate()
        date.setDate(date.getDate() - 2)
        return date
      })()

      return logs.removeLogFiles(twoDaysAgo).then(() => it)
    })
  // Load unseen logs to send
    .then(logs.queryNewestLogs)
  // Send unsaved logs to server
    .then(logs => {
      if (logs.length === 0) return
      return this.request({
        path: '/logs',
        method: 'POST',
        body: { logs },
        noRetry: true
      })
    })
    .catch(err => {
      // Ignore request timeout and forced timeout
      if (err.code === 'ETIMEDOUT' || err.statusCode === 408) return
      console.log('Sync logs error:', err)
    })
}

Trader.prototype.clearConfigVersion = function clearConfigVersion () {
  this.configVersion = null
}

Trader.prototype.setConfigVersion = function setConfigVersion () {
  if (!this.latestConfigVersion) throw new Error('We don\'t have a configVersion')
  this.configVersion = this.latestConfigVersion
}

Trader.prototype.verifyUser = function verifyUser (idRec, cb) {
  console.log(idRec)
  return this.request({
    path: '/verify_user',
    method: 'POST',
    body: idRec
  })
}

Trader.prototype.rates = function rates (cryptoCode) {
  if (this._rates) return this._rates[cryptoCode]
}

Trader.prototype.verifyTransaction = function verifyTransaction (idRec) {
  console.log(idRec)

  return this.request({
    path: '/verify_transaction',
    method: 'POST',
    body: idRec
  }).catch(err => console.log(err))
}

Trader.prototype.epipeLog = function epipeLog () {
  console.log(`EPIPE: Log last try: ${epipeLog}`)
  console.log(`EPIPE: Poll last try: ${epipePoll}`)
}

Trader.prototype.poll = function poll () {
  // console.log("In Trader Poll");

  epipePoll = new Date()
  const stateRec = this.state
  const path = '/poll?state=' + stateRec.state + '&model=' + this.model + '&version=' + version + '&idle=' + stateRec.isIdle + '&pid=' + pid + '&sn=' + serialNumber.toString()
  serialNumber++

  // console.log("In Trader Poll ", path);

  return this.request({
    path,
    method: 'GET',
    noRetry: true
  })
    .then(r => this.pollHandler(r.body))
    .catch(err => this.pollError(err))
}

Trader.prototype.verifyPromoCode = function verifyPromoCode (code, tx) {
  return this.request({
    path: '/verify_promo_code',
    method: 'POST',
    body: { codeInput: code, tx: tx }
  }).then(r => { return r.body })
}

function massage (tx) {
  if (!tx) return tx

  if (tx.direction === 'cashIn') {
    return _.assign(tx, {
      cryptoAtoms: BN(tx.cryptoAtoms),
      fiat: BN(tx.fiat),
      cashInFee: BN(tx.cashInFee),
      commissionPercentage: BN(tx.commissionPercentage),
      minimumTx: BN(tx.minimumTx)
    })
  }

  return _.assign(tx, {
    cryptoAtoms: BN(tx.cryptoAtoms),
    commissionPercentage: BN(tx.commissionPercentage),
    fiat: BN(tx.fiat)
  })
}

Trader.prototype.postTx = function postTx (tx) {
  // Don't retry because that's handled at a higher level.

  // console.log("In Trader - Post Tx");
  // console.log(tx);
  // console.log("balances")
  // console.log(this.balances);

  const requestId = uuid.v4()

  return this.request({
    path: '/tx?rid=' + requestId,
    method: 'POST',
    body: tx,
    noRetry: true
  })
    .then(r => massage(r.body))
    .catch(err => {
      // console.log("In trader - Post Tx Error");
      // console.log(err);
      // console.log("Status Code");
      // console.log(err.statusCode);
      // console.log("Status");
      // console.log(err.status);

      if (err.statusCode === 409) {
        const errorType = _.get('errorType', err, 'ratchet')

        console.log(`Encountered ${errorType} error, txId: %s ${tx.id}`)
        if (errorType === 'stale') throw new E.StaleError('Stale error')
        throw new E.RatchetError('Ratchet error')
      }

      if (err.statusCode >= 500) throw err
      if (isNetworkError(err)) return
      throw err
    })
}

function isNetworkError (err) {
  switch (err.name) {
    case 'RequestError':
    case 'ReadError':
    case 'ParseError':
      return true
    default:
      return false
  }
}

function stateChange (state, isIdle) {
  this.state = { state, isIdle }

  const rec = { state, isIdle, uuid: uuid.v4() }

  // Don't retry because we're only interested in the current state
  // and things could get confused.
  return this.request({
    path: '/state',
    method: 'POST',
    body: rec,
    noRetry: true
  }).catch(() => {})
}

// At machine startup two stateChanges occur virtually at the same time: 'idleState' and 'chooseCoin'
// It was frequently seen on the server requests arriving out of order, the throttle mitigates this issue
// This is particularlly important at startup because of the 'machine stuck' notification
Trader.prototype.stateChange = _.throttle(1000, stateChange)

Trader.prototype.phoneCode = function phoneCode (phone) {
  return this.request({
    path: `/phone_code?version=${version}`,
    method: 'POST',
    body: { phone }
  })
    .then(r => r.body)
    .catch(err => {
      if (err && err.statusCode === 401) {
        const badNumberErr = new Error('Bad phone number')
        badNumberErr.name = 'BadNumberError'
        throw badNumberErr
      }

      throw err
    })
}

Trader.prototype.fetchPhoneTx = function fetchPhoneTx (phone) {
  return this.request({
    path: '/tx?' + qs.stringify({ phone }),
    method: 'GET'
  })
    .then(r => massage(r.body))
}

Trader.prototype.fetchDeviceTx = function fetchDeviceTx ({phone = "", page = 1, perPage = 20}) {
  return this.request({
    path: '/txs?' + qs.stringify({phone, page, perPage}),
    method: 'GET'
  })
  .then(r => {
    console.log("Response - in Trader");
    console.log(r.body);
    return r.body.map(tx => massage(tx));
  })
}


Trader.prototype.processPayment = function processPayment(tx, amount, cardData) {
  return this.request({
    path: '/pay',
    body: {tx, amount, cardData},
    method: 'POST'
  })
  .then(r => {
    console.log("Payment Response - in Trader");
    console.log(r.body);
    return r.body;
  })
}


Trader.prototype.cancelTransaction = function cancelTransaction(txId, reason) {
  return this.request({
    path: `/tx/${txId}?` + qs.stringify({cancel: true, reason}),
    method: 'PUT',
    body: {},
  })
  .catch(err => {
    console.log("Error - Canceling Transaction");
    console.log(err);
  })
}

Trader.prototype.updateCustomer = function updateCustomer (customerId, customerPatch, txId) {
  return this.request({
    path: `/customer/${customerId}?txId=${txId}&version=${version}`,
    body: customerPatch,
    method: 'PATCH'
  })
    .then(r => r.body)
}

Trader.prototype.triggerSanctions = function triggerSanctions (customerId) {
  return this.request({
    path: `/customer/${customerId}/sanctions`,
    method: 'patch'
  })
    .then(r => r.body)
}

Trader.prototype.triggerBlock = function triggerBlock (customerId) {
  return this.request({
    path: `/customer/${customerId}/block`,
    method: 'patch'
  })
    .then(r => r.body)
}

Trader.prototype.triggerSuspend = function triggerSuspend (customerId, triggerId) {
  return this.request({
    path: `/customer/${customerId}/suspend`,
    body: { triggerId: triggerId },
    method: 'patch'
  })
    .then(r => r.body)
}

//Check for NaN -- Added by Shiv
function toBN (obj) {
  try {
    var bg = BN(obj)
    if(bg.isNaN()) {
      return obj
    }

    return bg
  } catch (__) {
    return obj
  }
}

Trader.prototype.pollHandler = function pollHandler (res) {
  console.log("Poll Handler");
  // console.log(res);

  console.log("Res Locale");
  console.log(res.locale);

  // console.log("Mapping");
  // console.log(_.map(_.mapValues(toBN), res.coins));

  this.locale = res.locale
  this.hasLightning = res.hasLightning
  this.operatorInfo = res.operatorInfo
  this.machineInfo = res.machineInfo
  this.receiptPrintingActive = res.receiptPrintingActive
  this.serverVersion = res.version

  // BACKWARDS_COMPATIBILITY 7.5
  // Servers before 7.5 uses old compliance settings
  if (res.version && semver.gte(res.version, '7.5.0-beta.0')) {
    this.triggers = res.triggers
  } else {
    this.triggers = createCompatTriggers(res)
  }

  machineInfo.save(this.dataPath, res.machineInfo)
    .catch(err => console.log('failure saving machine info', err))

  operatorInfo.save(this.dataPath, res.operatorInfo)
    .catch(err => console.log('failure saving operator info', err))

  networkDownCount = 0

  if (res.cassettes) {
    const mapper = (v, k) => k === 'denomination' ? BN(v) : v
    this.cassettes = _.map(mapValuesWithKey(mapper), res.cassettes.cassettes)
    this.virtualCassettes = _.map(BN, res.cassettes.virtualCassettes)
  }

  this.twoWayMode = res.twoWayMode
  this.zeroConfLimits = res.zeroConfLimits
  this._rates = _.mapValues(_.mapValues(toBN), res.rates)
  this.coins = _.filter(coin => isActiveCoin(res, coin), _.map(_.mapValues(toBN), res.coins))

  console.log("Setting up balances")
  console.log(res.balances);
  this.balances = _.mapValues(toBN, res.balances)
  this.latestConfigVersion = res.configVersion
  this.areThereAvailablePromoCodes = res.areThereAvailablePromoCodes
 
  // BACKWARDS_COMPATIBILITY 7.4.9
  // Servers before 7.4.9 sends terms on poll
  if (res.version && semver.gte(res.version, '7.4.9')) {
    this.fetchTerms(res.configVersion)
  } else {
    this.terms = res.terms || false
  }

  // console.log("In Trader Poll ", this.coins);
  if (_.isEmpty(this.coins)) {
    return this.emit('networkDown')
  }

  console.log("Emitting Poll Update...Printing locale");
  console.log(this.locale)

  this.emit('pollUpdate', isNewState(this))
  this.emit('networkUp')
}

Trader.prototype.fetchTerms = function fetchTerms (configVersion) {
  if (configVersion === this.termsConfigVersion) return

  return this.request({ path: '/terms_conditions', method: 'GET' })
    .then(({ body }) => {
      this.terms = (body && body.terms) || false
      this.termsConfigVersion = body && body.version
    })
    .catch(err => console.log('failure fetching terms and conditions', err))
}

Trader.prototype.pollError = function pollError (err) {
  console.log("Poll Error");
  console.log(err);

  if (isNetworkError(err)) {
    networkDownCount++

    if (networkDownCount > NETWORK_DOWN_COUNT_THRESHOLD) {
      return this.emit('networkDown')
    }

    console.log('Temporary network hiccup [%s]', err.message)

    return
  }

  if (err.statusCode === 403) {
    console.log("Emitting UNPAIR");
    return this.emit('unpair')
  }

  this.emit('networkDown')
}

let oldState = {}
function isNewState (res) {
  const pare = r => ({
    twoWayMode: r.twoWayMode,
    locale: r.locale,
    coins: _.map('cryptoCode', r.coins)
  })

  if (_.isEqual(pare(res), oldState)) return false

  oldState = pare(res)
  return true
}

function isActiveCoin (res, coin) {
  return !_.isNil(res.rates[coin.cryptoCode]) && !_.isNil(res.balances[coin.cryptoCode])
}

function createCompatTriggers (res) {
  const newTrigger = _.assign({
    triggerType: TRIGGER_TYPES.TRANSACTION_VOLUME,
    direction: DIRECTIONS.BOTH,
    thresholdDays: 1
  })

  const requirements = [
    { name: 'sms', id: REQUIREMENTS.PHONE_NUMBER },
    { name: 'idCardData', id: REQUIREMENTS.ID_CARD_DATA },
    { name: 'idCardPhoto', id: REQUIREMENTS.ID_CARD_PHOTO },
    { name: 'sanctions', id: REQUIREMENTS.SANCTIONS },
    { name: 'frontCamera', id: REQUIREMENTS.FACEPHOTO },
  ]

  const isEnabled = (name) => res[`${name}VerificationActive`]
  const getThreshold = (name) => res[`${name}VerificationThreshold`]
  const hasLimitSet = (name) => !_.isNil(getThreshold(name))

  const filterEnabled = _.filter(({ name }) => isEnabled(name) && hasLimitSet(name))
  const mapToTrigger = _.map(({ id, name }) => newTrigger({ threshold: getThreshold(name), requirement: id }))

  return _.compose(mapToTrigger, filterEnabled)(requirements)
}

module.exports = Trader
