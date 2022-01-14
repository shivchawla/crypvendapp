var RNFS = require('react-native-fs');
const os = require('os')
const path = require('path')
const semver = require('semver')
const _ = require('lodash/fp')
const minimist = require('minimist')
// const Rx = require('rxjs/Rx')
const Rx = require('rxjs')
const pify = require('pify')
const pDelay = require('delay')
const pAny = require('p-any')
const pSettle = require('p-settle')
const moment = require('moment-timezone');

import NetInfo from "@react-native-community/netinfo";

const xstate = require('xstate')

const commandLine = {}; 

const operatorInfo = require('./operator-info')
const sms = require('./compliance/flows/sms')
const { utils: coinUtils, CRYPTO_CURRENCIES } = require('lamassu-coins')

const pairing = require('./pairing')
const Tx = require('./tx')
const BN = require('./bn')
const version = require('../config/version.json').version
const db = require('./db')
const actionEmitter = require('./action-emitter')

const deviceConfig = require('../config/device_config.json')

const E = require('./error')
const complianceTiers = require('./compliance/compliance-tiers')
const idCardData = require('./compliance/flows/id-card-data')
const idCardPhoto = require('./compliance/flows/id-card-photo')
const facephoto = require('./compliance/flows/facephoto')
const sanctions = require('./compliance/flows/sanctions')
const usSsn = require('./compliance/flows/US-SSN')
const { getLowestAmountPerRequirement, getAmountToHardLimit, getTriggered } = require('./compliance/triggers/triggers')
const { ORDERED_REQUIREMENTS, REQUIREMENTS } = require('./compliance/triggers/consts')

const printerLoader = require('./printer/loader')
const BigNumber = BN.klass

let transitionTime

const COMPLIANCE_VERIFICATION_STATES = ['smsVerification', 'permission_id', 'permission_face_photo', 'usSsnPermission']
const COMPLIANCE_REJECTED_STATES = ['registerUsSsn']
const BILL_ACCEPTING_STATES = ['billInserted', 'billRead', 'acceptingBills',
  'acceptingFirstBill', 'maintenance']
const NON_TX_STATES = ['networkDown', 'connecting', 'wifiConnected', 'pairing',
  'initializing', 'booting']
const ARE_YOU_SURE_ACTIONS = ['cancelTransaction', 'continueTransaction']
const ARE_YOU_SURE_HANDLED = ['depositCancel']
const ARE_YOU_SURE_SMS_HANDLED = ['cancelPhoneNumber', 'cancelSecurityCode']
const ARE_YOU_SURE_HANDLED_SMS_COMPLIANCE = ['deposit_timeout', 'rejected_zero_conf']
const INITIAL_STATE = 'start'
const MIN_SCREEN_TIME = 1000
const POLL_INTERVAL = commandLine.pollTime || 5000
const INSUFFICIENT_FUNDS_CODE = 570
const NETWORK_TIMEOUT_INTERVAL = 20000
const MIN_WAITING = 500
const STATUS_QUERY_TIMEOUT = 2000

// console.log("Serial Port");
// var SerialPort = require('react-native-serial-port-api').default;
var SerialPort = require('react-native-usb-serialport').RNSerialport;

// console.log(SerialPort);

const Brain = function (config) {
  if (!(this instanceof Brain)) return new Brain(config)

  this.rootConfig = config
  this.config = config.brain

  this.bootTime = Date.now()

  // ExternalStorageDirectoryPath
  // DocumentDirectoryPath
  // this.dataPath = RNFS.ExternalStorageDirectoryPath + '/Android/data/com.crypvendapp/files/'; //path.resolve(__dirname, '..', this.config.dataPath)
  this.dataPath = path.resolve(RNFS.DocumentDirectoryPath); //path.resolve(__dirname, '..', this.config.dataPath)

  //Cert path not required  
   this.certPath = {
    cert: path.resolve(this.dataPath, this.config.certs.certFile),
    key: path.resolve(this.dataPath, this.config.certs.keyFile)
  }

  this.connectionInfoPath = path.resolve(this.dataPath, 'connection_info.json');
  // console.log(this.connectionInfoPath);

  this.dbRoot = path.resolve(this.dataPath, 'tx-db')
  this.scanner = require('./mocks/scanner');
  // this.scanner = config.mockCam
    // ? require('./mocks/scanner')
    // : require('./scanner')

  this.scanner.config(config);

  config.billValidator.rs232.device = determineDevicePath(config.billValidator.rs232.device)
  if (config.billDispenser) {
    config.billDispenser.device = determineDevicePath(config.billDispenser.device)
  }

  this.billValidator = this.loadBillValidator();

  console.log(this.billValidator);

this.billValidator.on('error', function (err) { console.log(err) })
this.billValidator.on('disconnected', function () { console.log('Disconnnected') })
this.billValidator.on('billAccepted', function () { console.log('Bill accepted') })
this.billValidator.on('billRead', function (data) { console.log('Bill read') })
this.billValidator.on('billValid', function () { console.log('Bill valid') })
this.billValidator.on('billRejected', function () { console.log('Bill rejected') })
this.billValidator.on('timeout', function () { console.log('Bill timeout') })
this.billValidator.on('standby', function () { console.log('Standby') })
this.billValidator.on('jam', function () { console.log('jam') })
this.billValidator.on('stackerOpen', function () { console.log('Stacker open') })
this.billValidator.on('enabled', function (data) { console.log('Enabled') })

var bv = this.billValidator
bv.run(function (err) {
  console.log("Running Bill Validator");

  if (err) {
    console.log("WTF-- What is the error?")
    console.log(err)
    process.exit(1);
  } else {
    console.log("ENABLing!!!");
    setTimeout(function () { bv.enable() }, 5000)
    console.log('success.')
  }
})

  return;

  this._setState(INITIAL_STATE)
  this.tx = null
  this.permissionsGiven = {}
  this.requirementAmountTriggered = {}
  this.pk = null
  this.currentScreenTimeout = null
  this.locked = true
  this.wifis = null
  this.screenTimeout = null
  this.lastPowerUp = Date.now()
  this.networkDown = true
  this.hasConnected = false
  this.localeInfo = this.config.locale.localeInfo
  this.dirtyScreen = false
  this.startDisabled = false
  this.testModeOn = false
  this.uiCassettes = null
  this.powerDown = false
  this.beforeIdleState = true
  this.scannerTimeout = null
  this.routerRef = null;
}

const EventEmitter = require('events').EventEmitter
const util = require('util')
util.inherits(Brain, EventEmitter)

function osPlatform () {
  switch (os.platform()) {
    case 'darwin': return 'MacOS'
    case 'linux': return 'Linux'
    case 'win32': return 'Windows'
    default: return 'Unknown'
  }
}


function platformDisplay (code) {
  if (code === 'N7G1') return 'Trofa'
  if (code === 'AAEON') return 'Douro'
  return osPlatform()
}

Brain.prototype.traderRun = function traderRun () {
  this.pollHandle = setInterval(() => {
    if (this.state === 'networkDown') this.trader.clearConfigVersion()
    this.trader.poll()
  }, POLL_INTERVAL)

  return this.trader.poll()
}


Brain.prototype.stop = function stop () {
  clearInterval(this.pollHandle)
}

Brain.prototype.prunePending = function prunePending (txs) {
  // console.log("Prune Pending");
  // console.log(txs);

  const pendingTxs = _.filter('dirty', txs)

  // console.log("pendingTxs");
  // console.log(pendingTxs);

  if (_.isEmpty(pendingTxs)) return 0

  // console.log("Has non empty pendingTxs");    

  const modifier = tx => tx.direction === 'cashIn'
    ? Tx.update(tx, {send: true, timedout: true})
    : Tx.update(tx, {timedout: true})

  const postTx = tx => {
    return this.postTx(modifier(tx))
      .catch(err => {
        // console.log("In brain - Got err")
        // console.log(err);
        // console.log(err instanceof E.RatchetError);
        if (err instanceof E.RatchetError) return

        // console.log("Throwing Again")  
        throw err
      })
  }

  // Since it's pending we want to send and not wait for more bills
  const promises = _.map(postTx, pendingTxs)

  return Promise.all(promises)
    .then(() => pendingTxs.length)
}

//Comment added by Shiv
//This is called to check pending transactions
Brain.prototype.processPending = function processPending () {
  console.log('Processing pending txs...')
  return db.prune(this.dbRoot, txs => this.prunePending(txs))
    .catch(err => console.log(err.stack))
}

Brain.prototype.selectBillValidatorClass = function selectBillValidatorClass () {
  if (commandLine.mockBillValidator) return require('./mocks/id003')

  // if (this.rootConfig.billValidator.deviceType === 'cashflowSc') {
  //   return require('./mei/cashflow_sc')
  // }

  // if (this.rootConfig.billValidator.deviceType === 'ccnet') {
  //   return require('./ccnet/ccnet')
  // }

  return require('./id003/id003');
}

Brain.prototype.loadBillValidator = function loadBillValidator () {
  const billValidatorClass = this.selectBillValidatorClass()
  return billValidatorClass.factory(this.rootConfig.billValidator)
}


//First function called when the POS starts
Brain.prototype.run = async function run() {
  const self = this
  this._init();

  actionEmitter.on('message', function (req) { self._processRequest(req) })

  // console.log("Run: Initialized. Calling _connectedBrowser");
  this._connectedBrowser();

  // console.log("Run: Certpath", this.certPath );
  this.clientCert = await pairing.getCert(this.certPath);

  // console.log("Run: ClientCert", this.clientCert);

  if (!this.clientCert) {
    // console.log("Run: When client State is null")
    return this._transitionState('virgin', { version })
  }

  // console.log("Run: yahan aaya");

  return this.checkWifiStatus()
}

Brain.prototype.epipeLog = function epipeLog () {
  if (this.trader) {
    this.trader.epipeLog()
  }
}

Brain.prototype._executeCallbackAfterASufficientIdlePeriod =
function _executeCallbackAfterASufficientIdlePeriod (callback) {
  const self = this
  const config = this.config
  const exitTime = config.exitTime
  const exitOnIdle = exitTime + config.idleTime

  setInterval(function () {
    if (self.isStaticState()) {
      const date = new Date()
      const elapsed = (date.getTime()) - self.bootTime
      if (exitOnIdle && elapsed > exitOnIdle) {
        callback()
      }
    }
  }, this.config.checkIdle)
}

// Brain.prototype._periodicLog = function _periodicLog () {
//   const self = this
//   const batteryCapacityPath = this.config.batteryCapacityPath
//   const tempSensorPath = this.config.tempSensorPath
//   const readFile = pify(fs.readFile)
//   const tempSensorPaths = _.compact(_.castArray(tempSensorPath))
//   const batteryCapacityPaths = _.compact(_.castArray(batteryCapacityPath))

//   function reporting () {
//     const clauses = ['version: %s, cpuLoad: %s, memUse: %s, memFree: %s\n  nodeUptime: %s, ' +
//     'osUptime: %s']

//     const batteryPromises = _.map(path => readFile(path, {encoding: 'utf8'}), batteryCapacityPaths)
//     const tempPromises = _.map(path => readFile(path, {encoding: 'utf8'}), tempSensorPaths)
//     const tempReading = pAny(tempPromises)
//     const batteryReading = pAny(batteryPromises)

//     return pSettle([tempReading, batteryReading])
//       .then(([temperature, battery]) => {
//         if (battery.value) {
//           clauses.push('battery: ' + battery.value.trim() + '%')
//         }

//         if (temperature.value) {
//           clauses.push('CPU temperature: ' + (temperature.value.trim() / 1000) + '° C')
//         }

//         const cpuLoad = os.loadavg()[1].toFixed(2)
//         const memUse = (process.memoryUsage().rss / Math.pow(1000, 2)).toFixed(1) +
//       ' MB'
//         const memFree = (os.freemem() * 100 / os.totalmem()).toFixed(1) + '%'
//         const nodeUptimeMs = Date.now() - self.bootTime
//         const nodeUptime = (nodeUptimeMs / 3600000).toFixed(2) + 'h'
//         const osUptime = (os.uptime() / 3600).toFixed(2) + 'h'
//         const format = clauses.join(', ')
//         console.log(format, version, cpuLoad, memUse, memFree, nodeUptime, osUptime)
//       })
//   }
//   reporting()
//   setInterval(reporting, this.config.periodicLogInterval)
// }

Brain.prototype.initialize = async function initialize () {

  console.log("Initialize:", this.certPath);
  
  this.clientCert = await pairing.getCert(this.certPath)

  if (!this.clientCert) this._transitionState('initializing')

  return pairing.init(this.certPath)
  .then(clientCert => {
    console.log("Initialize: ClientCert");    
    console.log(clientCert);
    this.clientCert = clientCert
    return this.checkWifiStatus()  
  })
  
}

Brain.prototype.checkWifiStatus = function checkWifiStatus () {
  console.log("Checking Wifi Status");
  const self = this

  // this._transitionState('booting')

  //This is called here to prevent wificonnected being called before prior setup
  this._initWifiEvents(); //this will immediately call wificonnecte if connected

  // NetInfo.fetch('wifi')
  // .then(state => {
  //   if(state.isConnected) {
  //     self.config.ip = state.details.ipAddress;
  //     self._wifiConnected()
  //     return
  //   } else {
  //     self._wifiConnecting()
  //   }
  // })
  // .catch(err => {
  //    console.log(err.stack)
  // })

}

Brain.prototype._init = function init () {
  // this._initWifiEvents();
  this._initBrainEvents()
  // this._initBillValidatorEvents();
  this._initActionEvents()
}

Brain.prototype._initBillValidatorEvents = function _initBillValidatorEvents () {
  const self = this
  const billValidator = this.billValidator

  billValidator.on('error', function (err) { self._billValidatorErr(err) })
  billValidator.on('disconnected', function () { self._billValidatorErr() })
  billValidator.on('billAccepted', function () { self._billInserted() })
  billValidator.on('billRead', function (data) { self._billRead(data) })
  billValidator.on('billValid', function () { self.updateBillScreen() })
  billValidator.on('billRejected', function () { self._billRejected() })
  billValidator.on('timeout', function () { self._billTimeout() })
  billValidator.on('standby', function () { self._billStandby() })
  billValidator.on('jam', function () { self._billJam() })
  billValidator.on('stackerOpen', function () { self._stackerOpen() })
  billValidator.on('enabled', function (data) { self._billsEnabled(data) })
}

Brain.prototype._initWifiEvents = function _initWifiEvents () {
  const self = this

  // this.wifi.on('scan', function (res) {
  //   self.wifis = res
  //   self.browser().send({wifiList: res})
  // })

  // this.wifi.on('connected', function () {
  //   if (self.state === 'wifiList') {
  //     self.wifi.stopScanning()
  //     self._wifiConnected()
  //   }
  // })

  console.log("_initWifiEvents: Subscribe to WIFI Events");
  NetInfo.addEventListener(state => {
    console.log("_initWifiEvents: Connection type", state.type);
    console.log("_initWifiEvents: Is connected?", state.isConnected);
   
    if(state.isConnected) {
      console.log("_initWifiEvents: Wifi is connected");
      self.config.ip = state.details.ipAddress;
      self._wifiConnected()
    } else {
      self._wifiConnecting()
    }
  });

}

Brain.prototype._initTraderEvents = function _initTraderEvents () {
  const self = this
  this.trader.on('pollUpdate', needsRefresh => this._pollUpdate(needsRefresh))
  this.trader.on('networkDown', function () { self._networkDown() })
  this.trader.on('networkUp', function () { self._networkUp() })
  this.trader.on('error', function (err) { console.log(err.stack) })
  this.trader.on('unpair', function () { self._unpair() })
}

Brain.prototype.processBrowserEvent = function processBrowserEvent(req) {
    const self = this;
    self._processRequest(req);
}


Brain.prototype._initBrainEvents = function _initBrainEvents () {
  this.on('newState', function (state) {
    console.log('new brain state:', state)
  })
}

Brain.prototype._initActionEvents = function _initActionEvents () {
  actionEmitter.on('action', (...args) => this.processAction.apply(this, args))
}

Brain.prototype.processAction = function processAction (action, stateMachine) {
  console.log("In processAction");
  console.log(action);
  console.log(stateMachine);

  //Changed from xstate@v3.04 to xstate@4.19 (type to be used now)
  switch (action) {
    // idCardData actions
    case 'scanPDF':
      this.scanPDF()
      break
    case 'authorizeIdCardData':
      this.authorizeIdCardData()
      break
    // idCardPhoto actions
    case 'scanPhotoCard': // this is called to turn on the scanner  but in POS - not needed?
      this.scanPhotoCard()
      break;  
    case 'authorizePhotoCardData':
      this.authorizePhotoCardData()
      break
    // facephoto actions
    case 'retryTakeFacephoto':
    case 'takeFacephoto':
      this.takeFacephoto()
      break
    case 'authorizeFacephotoData':
      this.authorizeFacephotoData()
      break
    // generic actions
    //As scan  
    case 'timeoutToScannerCancel':
      this.timeoutToScannerCancel(stateMachine)
      break
    case 'transitionScreen':
      this.transitionScreen()
      break
    case 'timeoutToFail':
      setTimeout(() => stateMachine.dispatch('FAIL'), _.get('scanner.timeout', this.rootConfig))
      break
    case 'success':
      console.log("On success");
      this.smsFlowHandleReturnState()
      break
    case 'failure':
      this.failedCompliance = stateMachine.key
      this.failedComplianceValue = this.requirementAmountTriggered[this.failedCompliance]
      this.smsFlowHandleReturnState()
      break
    // sanctions
    case 'triggerSanctions':
      this.triggerSanctions()
      break
    case 'sanctionsFailure':
      this._timedState('sanctionsFailure')
      break
    // suspend
    case 'triggerSuspend':
      this.triggerSuspend()
      break
    // block
    case 'triggerBlock':
      this.triggerBlock()
      break
  }
}

Brain.prototype.transitionScreen = function transitionScreen () {

  console.log("In transitionScreen");
  let appState = null

  // check idCardData state
  let machineState = idCardData.getState()
  switch (machineState) {
    case 'scanId':
      appState = 'scan_id_data'
      break
    case 'authorizing':
      appState = 'verifying_id_data'
      break
    case 'idScanFailed':
      appState = 'failed_scan_id_data'
      break
    case 'idVerificationFailed':
      appState = 'failed_permission_id'
      break
  }

  if (!appState) {
    // otherwise check idCardPhoto state
    machineState = idCardPhoto.getState()
    switch (machineState) {
      case 'scanPhotoCard':
        appState = 'scan_id_photo'
        break
      case 'scanPhotoCardManual':
        appState = 'scan_manual_id_photo'
        break
      case 'authorizing':
        appState = 'verifying_id_photo'
        break
      case 'photoCardScanFailed':
        appState = 'failed_scan_id_photo'
        break
      case 'photoCardVerificationFailed':
        appState = 'failed_verifying_id_photo'
        break
    }
  }

  if (!appState) {
    // otherwise check facephoto state
    machineState = facephoto.getState()
    switch (machineState) {
      case 'takeFacephoto':
        appState = 'scan_face_photo'
        break
      case 'retryTakeFacephoto':
        appState = 'retry_scan_face_photo'
        break
      case 'authorizing':
        appState = 'verifying_face_photo'
        break
      case 'facephotoFailed':
        appState = 'failed_scan_face_photo'
        break
      case 'facephotoVerificationFailed':
        appState = 'failed_permission_id'
        break
    }

    if (!appState) {
      // sanctions state
      machineState = sanctions.getState()
      switch (machineState) {
        case 'triggerSanctions':
          appState = 'waiting'
          break
      }
    }

    if (!appState) {
      // usSsn state
      machineState = usSsn.getState()
      switch (machineState) {
        case 'askForSsn':
          appState = 'registerUsSsn'
          break
        case 'authorizing':
          appState = 'waiting'
          break
      }
    }
  }

  if (!appState) { return }

  this._transitionState(appState, { context: 'compliance' })
}

Brain.prototype.clearTimeoutToScannerCancel = function clearTimeoutToScannerCancel () {
  if (!this.scannerTimeout) { return }

  clearTimeout(this.scannerTimeout)
  this.scannerTimeout = null
}



function getStateMachine(key) {
   switch(key) {
    case "idCardPhoto":
      return idCardPhoto;
      break;

    case "idCardData":
      return idCardData;
      break;

    case "facephoto":
      return facephoto;
      break;

    case "sanctions":
      return sanctions;
      break;  

    default:
      return null;   
  }
}

Brain.prototype.timeoutToScannerCancel = function timeoutToScannerCancel (stateMachine) {
  this.clearTimeoutToScannerCancel()
  this.scannerTimeout = setTimeout(() => {
    
  //Not valid for POS
  //this.scanner.cancel()
 
    stateMachine.dispatch('SCAN_ERROR')
  
  }, _.get('scanner.timeout', this.rootConfig))
}

Brain.prototype.scanPDF = function scanPDF () {
  this.scanBayLightOn()
  this.scanner.scanPDF417((err, result) => {
    this.scanBayLightOff()
    this.startDisabled = false

    if (err) {
      console.log(err)
      return idCardData.dispatch('SCAN_ERROR')
    }

    if (!result) {
      console.log('No PDF417 result')
      return
    }

    if (this.hasExpired(result)) {
      console.log('Expired ID card')
      return idCardData.dispatch('SCAN_ERROR')
    }

    idCardData.setData(result)
    return idCardData.dispatch('SCANNED')
  })
}

Brain.prototype.hasExpired = function hasExpired (cardData) {
  // TODO: ZA cards currently do not have an expiration date to confirm against
  if (cardData.country === 'ZA') return false

  const expirationYear = cardData.expirationDate.substring(0, 4)
  const expirationMonth = cardData.expirationDate.substring(4, 6)
  const expirationDay = cardData.expirationDate.substring(6, 8)
  const expirationDate = new Date(expirationYear, expirationMonth, expirationDay)

  const now = Date.now()
  return expirationDate < now
}

Brain.prototype.triggerSanctions = function triggerSanctions () {
  const dispatchBySanctions = customerSanction => {
    const action = customerSanction ? 'SUCCESS' : 'FAILURE'
    sanctions.dispatch(action)
  }

  const customer = this.customer

  // explictly test false since sanctions can be empty
  if (customer.sanctions === false) return dispatchBySanctions(false)

  // BACKWARDS_COMPATIBLITY 7.5
  // older server can't use "trigger sanctions" request
  const serverVersion = this.trader.serverVersion
  if (!serverVersion || semver.lt(serverVersion, '7.5.0-beta.0')) {
    dispatchBySanctions(customer.sanctions)
  }

  return this.trader.triggerSanctions(customer.id)
    .then(result => {
      this.customer = result.customer
      dispatchBySanctions(result.customer.sanctions)
    })
    .catch(err => {
      console.log('sanction error', err)
      dispatchBySanctions(false)
    })
}

Brain.prototype.triggerSuspend = function triggerSuspend () {
  const customer = this.customer
  const now = new Date()
  return this.trader.triggerSuspend(customer.id, this.suspendTriggerId)
    .then(result => {
      this.customer = result.customer
    })
    .catch(err => {
      console.log('block error', err)
    })
    .then(() => {
      return this.showSuspendedCustomer(this.customer, now)
    })
}

Brain.prototype.triggerBlock = function triggerBlock () {
  const customer = this.customer

  return this.trader.triggerBlock(customer.id)
    .then(result => {
      this.customer = result.customer
    })
    .catch(err => {
      console.log('block error', err)
    })
    .then(() => {
      return this.showBlockedCustomer()
    })
}


Brain.prototype.fromYYYYMMDD = function (string) {
  let year = string.substring(0, 4)
  let month = string.substring(4, 6)
  let day = string.substring(6, 8)

  return new Date(year, month-1, day);
}

Brain.prototype.authorizeIdCardData = function authorizeIdCardData () {
  return Promise.resolve()
    .then(() => {
      this.clearTimeoutToScannerCancel()

      const customer = this.customer
      const data = idCardData.getData()
      const idCardDataExpiration = data.expirationDate ? this.fromYYYYMMDD(data.expirationDate) : null

      // BACKWARDS_COMPATIBLITY 7.5.0-beta.2
      // older server does not have id_card_data_raw
      const serverVersion = this.trader.serverVersion
      if (!serverVersion || semver.lt(serverVersion, '7.5.0-beta.2')) {
        return this.trader.updateCustomer(customer.id, {
          idCardData: data,
          idCardDataNumber: data.documentNumber,
          idCardDataExpiration
        }, this.tx.id)
      }
      return this.trader.updateCustomer(customer.id, {
        idCardData: _.omit(['raw'], data),
        idCardDataRaw: JSON.stringify(data.raw),
        idCardDataNumber: data.documentNumber,
        idCardDataExpiration
      }, this.tx.id)
    })
    .then(result => {
      this.customer = result.customer
      idCardData.dispatch('AUTHORIZED')
    }, err => {
      this._fiatError(err)
    })
    .catch(err => {
      console.log('authorizeIdCardData error', err)
      idCardData.dispatch('BLOCKED_ID')
    })
}


Brain.prototype._handleIdPhotoScan = function _handleIdPhotoScan ({err, result}) {
  if (err) {
    console.log(err)
    return idCardPhoto.dispatch('SCAN_ERROR')
  }

  if (!result) {
    console.log('No card photo result')
    return
  }

  // idCardPhoto.setData(result.toString('base64'))
  idCardPhoto.setData(result)  
  return idCardPhoto.dispatch('SCANNED')
}

//In case of POS, we don't need the scanner   
Brain.prototype.scanPhotoCard = function scanPhotoCard () {
    browserEmit({action: 'scan_id_photo'});
}

Brain.prototype.authorizePhotoCardData = function authorizePhotoCardData () {

  console.log("authorizePhotoCardData");

  return Promise.resolve()
    .then(() => {
      this.clearTimeoutToScannerCancel()

      const customer = this.customer
      const data = idCardPhoto.getData()
      return this.trader.updateCustomer(customer.id, {
        idCardPhotoData: data
      }, this.tx.id)
    })
    .then(result => {
      this.customer = result.customer
      console.log("Here in authorizePhotoCardData");
      idCardPhoto.dispatch('AUTHORIZED')
    }, err => {
      this._fiatError(err)
    })
    .catch(err => {
      console.log('authorizePhotoCardData error', err)
      idCardPhoto.dispatch('BLOCKED_ID')
    })
}

Brain.prototype.retryFacephoto = function retryFacephoto () {
  facephoto.dispatch('RETRY')
}


Brain.prototype._handleFacePhotoScan = function _handleFacePhotoScan ({err, result}) {
    if (err) {
      console.log(err)
      return facephoto.dispatch('SCAN_ERROR')
    }

    if (!result) {
      console.log('No photo result')
      return
    }

    // facephoto.setData(result.toString('base64'))
    facephoto.setData(result)
    return facephoto.dispatch('PHOTO_TAKEN')
}


Brain.prototype.takeFacephoto = function takeFacephoto () {
  browserEmit({action: 'scan_face_photo'});
}

Brain.prototype.authorizeFacephotoData = function authorizeFacephotoData () {
  return Promise.resolve()
    .then(() => {
      this.clearTimeoutToScannerCancel()

      const customer = this.customer
      const data = facephoto.getData()
      return this.trader.updateCustomer(customer.id, {
        frontCameraData: data
      }, this.tx.id)
    })
    .then(result => {
      this.customer = result.customer
      facephoto.dispatch('AUTHORIZED')
    }, err => {
      this._fiatError(err)
    })
    .catch(err => {
      console.log('facephoto error', err)
      facephoto.dispatch('BLOCKED_ID')
    })
}


Brain.prototype._connectedBrowser = function _connectedBrowser () {
  //  TODO: have to work on this: console.assert(this.state === State.IDLE)
  console.log('connected to browser')
  const cryptomatModel = this.rootConfig.cryptomatModel || 'pos'

  // const wifiList = this.state === 'wifiList' && this.wifis
  //   ? this.wifis
  //   : []

  if (!this.trader || !this.trader.coins) {
    const rec = {
      action: this.state,
      // wifiList,
      locale: 'en-US',
      cryptomatModel,
      version,
      operatorInfo: this.trader ? this.trader.operatorInfo : operatorInfo.load(this.dataPath),
      supportedCoins: CRYPTO_CURRENCIES
    }

    return browserEmit(rec)
  }

  const cryptoCode = this.singleCrypto()
    ? this.trader.coins[0].cryptoCode
    : null

  const _rates = {
    rates: this.trader.rates(cryptoCode),
    cryptoCode: cryptoCode,
    coins: coinUtils.cryptoCurrencies()
  }

  const rates = cryptoCode
    ? _rates
    : undefined

  const fullRec = {
    action: this.state,
    localeInfo: this.localeInfo,
    fiatCode: this.fiatCode,
    cryptoCode: cryptoCode,
    cassettes: this.uiCassettes,
    coins: this.trader.coins,
    twoWayMode: this.twoWayMode(),
    // wifiList: wifiList,
    rates,
    version,
    operatorInfo: this.trader.operatorInfo,
    cryptomatModel,
    areThereAvailablePromoCodes: this.trader.areThereAvailablePromoCodes,
    supportedCoins: CRYPTO_CURRENCIES
  }

  browserEmit(fullRec)
}

Brain.prototype._processRequest = function _processRequest (req) {

  console.log("In process Request");
  console.log(req);

  if (this.areYouSureHandled(req.button)) {
    return this.areYouSure()
  }

  if (_.includes(req.button, ARE_YOU_SURE_ACTIONS)) {
    return this._processAreYouSure(req)
  }

  if (this.flow) {
    return this.flow.handle(req.button, req.data)
  }

  this._processReal(req)
}

Brain.prototype._processAreYouSure = function _processAreYouSure (req) {
  switch (req.button) {
    case 'continueTransaction':
      this.continueTransaction(req.data)
      break
    case 'cancelTransaction':
      const {previousState, reason} = req.data || {};
      this.cancelTransaction(previousState, reason)
      break
  }
}

Brain.prototype._processReal = function _processReal (req) {

  console.log("In process Real");
  console.log(req);

  const model = deviceConfig.cryptomatModel || 'sintra'

  console.log("Button");
  console.log(req.button);
  
  switch (req.button) {
    case 'locked':
      this._locked()
      break
    case 'unlock':
      this._unlock(req.data)
      break
    case 'cancelLockPass':
      this._cancelLockPass()
      break
    case 'initialize':
      this.initialize()
      break
    case 'pairingScan':
      this._pairingScan(req.data)
      break
    case 'pairingScanCancel':
      this.scanner.cancel()
      break
    case 'pairingErrorOk':
      this._unpaired()
      break
    case 'testMode':
      this._testMode()
      break
    case 'start':
      this._chooseCoin(req.data)
      break
    case 'idDataActionCancel':
      this._scanActionCancel(idCardData)
      break
    case 'idPhotoActionCancel':
      this._scanActionCancel(idCardPhoto)
      break
    case 'cancelIdScan':
      this._cancelIdScan()
      break
    
    case 'idCodeFailedRetry':
      idCardData.start()
      break
    case 'idVerificationFailedOk':
      idCardData.dispatch('FAIL')
      break
    case 'photoScanVerificationCancel':
      idCardPhoto.dispatch('FAIL')
      break
    case 'cancelScan':
      this._cancelScan()
      break
    case 'bye':
      this._bye()
      break
    case 'retryPhotoScan':
      idCardPhoto.start(model)
      break
    case 'fiatReceipt':
      this._fiatReceipt()
      break
    case 'cancelInsertBill':
      this._cancelInsertBill()
      break
    case 'sendCoins':
      this._sendCoins()
      break

    case 'finalizeSale': //Accept credit card details and finalize sale
      this._finalizeSale(req.data);
      break;  

    /**
     * User clicked finish button before completing sms compliance.
     * If the user has inserted any bills, set the sendCoins state
     * else redirect user to chooseCoin state
     */
    case 'finishBeforeSms':
      if (this.tx.fiat.gt(0)) return this._sendCoins()
      this._idle()
      break
    case 'completed':
      this._completed()
      break
    case 'machine':
      this._machine()
      break
    case 'cancelMachine':
      this._cancelMachine()
      break
    case 'powerOff':
      this._powerOffButton()
      break
    case 'cam':
      this._cam()
      break
    case 'fixTransaction':
      this._fixTransaction()
      break
    case 'abortTransaction':
      this._abortTransaction()
      break
    case 'redeem':
      this._redeem()
      break
    case 'changeLanguage':
      this._timedState('changeLanguage')
      break
    case 'setLocale':
      this._setLocale(req.data)
      break
    case 'idle':
      this._idle()
      break
    case 'chooseCoin':
      this._chooseCoin(req.data)
      break
    case 'retryFacephoto':
      this.retryFacephoto()
      break

    case 'scanIdCardPhoto': //Not used as scanning is handled by RN
      idCardPhoto.dispatch('READY_TO_SCAN')
      break
    case 'permissionIdCompliance':
      this.permissionsGiven.id = true
      this._continueSmsCompliance()
      break
    case 'permissionSmsCompliance':
      this.permissionsGiven.sms = true
      this._continueSmsCompliance()
      break
    case 'permissionPhotoCompliance':
      this.permissionsGiven.photo = true
      this._continueSmsCompliance()
      break
    case 'permissionUsSsnCompliance':
      this.permissionsGiven.usSsn = true
      this._continueSmsCompliance()
      break
    case 'blockedCustomerOk':
      this._idle()
      break
    case 'termsAccepted':
      this.acceptTerms()
      break
    //Added to SCAN address from POS  
    case 'addressScan':
      this._handleAddressScan(req.data);
      break;  
    case 'startAddressScan':
    case 'invalidAddressTryAgain':
      this._startAddressScan()
      break
    case 'printAgain':
      this._privateWalletPrinting()
      break
    case 'printerScanAgain':
      this._startPrintedWalletScan()
      break
    case 'usSsn':
      this.registerUsSsn(req.data)
      break
    case 'insertPromoCode':
      this._insertPromoCode()
      break
    case 'cancelPromoCode':
      this._cancelPromoCode()
      break
    case 'submitPromoCode':
      this._submitPromoCode(req.data)
      break

    //Added new state to handle fiat Amount validation
    case 'fiatValidate':
      this._handleFiatInput(req.data);
      break;  

    //Added to handle ID photo scan from RN  
    case 'idPhotoValidate':
      this._handleIdPhotoScan(req.data);
      break;

    //Added to handle Face photo scan from RN    
    case 'facePhotoValidate':
      this._handleFacePhotoScan(req.data);
      break; 

    case 'cancelTransaction':
      console.log("In Cancel Transaction -switch")
      this.cancelTransaction();
      break           
  }
}

Brain.prototype.getTransactions = function getTransactions (query) {
  
  return this.trader.fetchDeviceTx(query)
  .then(txs => {

    const massage = (tx) => {
      const cashInCommission = BN(1).plus(BN(tx.commissionPercentage))
      const rate = BN(tx.rawTickerPrice).multipliedBy(cashInCommission).precision(2);

      const date = tx.sendTime ? moment.tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss')  : null;

      return {
        customer: tx.phone,
        session: tx.id,
        fiat: tx.fiat ? `${tx.fiat.toString()} ${tx.fiatCode}` : null,
        crypto: tx.cryptoAtoms ? `${this.toCryptoUnits(tx.cryptoAtoms, tx.cryptoCode)} ${tx.cryptoCode}` : null,
        rate: `1 ${tx.cryptoCode} = ${rate} ${tx.fiatCode}`,
        address: tx.toAddress,
        txId: tx.txHash,
        status: tx.sendConfirmed ? "Complete" : tx.sendPending ? "Pending" : "Unknown",
        ...date && {date},
        cryptoCode: tx.cryptoCode
      }
    }

    return _.map(massage, txs)
  })
}

Brain.prototype._continueSmsCompliance = function () {
  if (!this.tx.toAddress) {
    return this.smsCompliance({ returnState: this.returnState })
  }

  const returnState = this.tx.fiat.eq(0)
    ? 'acceptingFirstBill'
    : 'acceptingBills'
  this.smsCompliance({ returnState })
}

Brain.prototype._setState = function _setState (state, oldState) {
  console.log("Setting State");
  console.log("Old State: ", oldState);
  console.log("New State: ", state);
  if (this.state === state) return false

  if (oldState) this._assertState(oldState)

  if (this.currentScreenTimeout) {
    clearTimeout(this.currentScreenTimeout)
    this.currentScreenTimeout = null
  }

  // Starting a transaction
  if (this.isIdleState()) this.trader.setConfigVersion()

  this.state = state

  this.emit(state)
  this.emit('newState', state)
  if (this.trader) this.trader.stateChange(state, this.isIdleState())

  return true
}

Brain.prototype._locked = function _locked () {
  this._setState('lockedPass', 'locked')
  browserEmit({action: 'lockedPass'}
)}

Brain.prototype._unlock = function _unlock () {
  this._wifiList()
}


Brain.prototype._cancelLockPass = function _cancelLockPass () {
  this._setState('locked', 'lockedPass')
  browserEmit({action: 'locked'})
}


Brain.prototype._wifiConnecting = function _wifiConnecting () {
  this._setState('wifiConnecting')
  browserEmit({action: 'wifiConnecting'})
}

Brain.prototype._wifiConnected = async function _wifiConnected () {
  if (this.state === 'maintenance') return
  this._setState('wifiConnected')
  await this.initTrader()
}

Brain.prototype._unpaired = function _unpaired () {
  this._setState('unpaired')
  browserEmit({action: 'unpaired', version})
}

Brain.prototype._pairingScan = function _pairingScan ({totem}) {
    console.log("Scanning totem");
    console.log(totem);  
    if (!totem) return this.initTrader()
    this._pair(totem)
}

Brain.prototype.activate = async function activate () {
  console.log("In Activate");
  const connectionInfo = await pairing.connectionInfo(this.connectionInfoPath)
  const config = this.rootConfig
  const protocol = config.http ? 'http:' : 'https:'

  console.log("Activate: Protocol ", protocol);

  // this._transitionState('booting')

  // if (config.mockTrader) {
  //   this.trader = require('./mocks/trader')(protocol, this.clientCert, connectionInfo, this.dataPath, deviceConfig.cryptomatModel)
  // } else {
    this.trader = require('./trader')(protocol, this.clientCert, connectionInfo, this.dataPath, deviceConfig.cryptomatModel)
  // }

  // console.log("Activate: WTF 1")

  this.idVerify = require('./compliance/id_verify').factory({trader: this.trader})


  // console.log("Activate: WTF 2")
  this._initTraderEvents()

  // console.log("Activate: WTF 3")
  
  console.log("Running Trade Poller")  
  return this.traderRun()
  .then(() => this.initValidator())

}

Brain.prototype._pair = function _pair (totem) {
  const self = this
  // console.log("WTF");
  this._transitionState('pairing')

  const model = platformDisplay()
  // const model = ""
  console.log(model);
  console.log(totem); 
  return pairing.pair(totem, this.clientCert, this.connectionInfoPath, model)
    .then(() => this.activate())
    .catch(err => {
      console.log(err.stack)
      self._pairingError(err)
    })
}

Brain.prototype._pairingError = function _pairingError (err) {
  this._setState('pairingError')
  browserEmit({action: 'pairingError', err: err.message})
}

Brain.prototype._isTestMode = function _isTestMode () {
  return this.testModeOn
}

Brain.prototype._testMode = function _testMode () {
  const self = this
  this.testModeOn = true
  this.traderOld = this.trader
  this.trader.removeAllListeners()
  this.trader = require('./mocks/trader')()
  this._initTraderEvents()
  this.networkDown = false
}

Brain.prototype._isPendingScreen = function _isPendingScreen () {
  return _.includes(this.state, ['goodbye'])
}

Brain.prototype.initTrader = async function initTrader () {
  console.log("In initTrader");
  // console.log("initTrader: Printing Connection Info Path")
  // console.log(this.connectionInfoPath);  

  const connectionInfo = await pairing.connectionInfo(this.connectionInfoPath)


  // console.log("initTrader: Printing Connection Info");
  // console.log(connectionInfo);

  const config = this.rootConfig

  //what is root config?
  console.log("initTrader: Printing Root Config");
  console.log(config);
  if (!connectionInfo && !config.mockTrader) {
    console.log("initTrader: Unpairing");
    this._unpaired()
    return false
  }

  console.log("Activating");
  await this.activate()

  return true
}

Brain.prototype.initValidator = function initValidator () {
  console.log('Waiting for server...')
  const h = setInterval(() => {
    if (_.isNil(this.fiatCode)) return

    clearInterval(h)

    this.billValidator.setFiatCode(this.fiatCode)

    return this.billValidator.run(err => {
      if (err) return this._billValidatorErr(err)
      console.log('Bill validator connected.')
    })
  }, 200)
}

Brain.prototype._idle = function _idle (locale) {
  console.log("_idle");
  const self = this
  const delay = transitionTime
    ? MIN_SCREEN_TIME - (Date.now() - transitionTime)
    : 0

  if (delay > 0 && self._isPendingScreen()) {
    setTimeout(function () { self._idle(locale) }, delay)
    return
  }

  if (this.networkDown) return this._forceNetworkDown()

  const pollPromise = this.trader.poll()
  this.idVerify.reset()
  this.currentPhoneNumber = null
  this.currentSecurityCode = null
  this.numCoins = this.trader.coins.length

  console.log("Setting Default Tx");
  this.tx = Tx.newTx()
  this.pk = null
  this.bill = null
  this.lastRejectedBillFiat = BN(0)
  this.failedCompliance = null
  this.failedComplianceValue = null
  this.redeem = false
  this.returnState = null
  this.complianceReason = null
  this.flow = null
  this.permissionsGiven = {}
  this.requirementAmountTriggered = {}
  this.suspendTriggerId = null

  /**
   * Clear any data from previously
   * validated customers (id & dailyVolume)
   */
  this.customer = null
  this.customerTxHistory = null

  this._setState('pendingIdle')

  // We've got our first contact with server

  const localeInfo = _.cloneDeep(this.localeInfo)
  locale = locale || localeInfo.primaryLocale
  localeInfo.primaryLocale = locale

  this.localeInfo = localeInfo

  this.beforeIdleState = false
  this.trader.clearConfigVersion()
  this.scanner.cancel()

  this.tx = Tx.update(this.tx, {fiatCode: this.fiatCode})

  pollPromise
    .then(() => this._idleByMode(this.localeInfo))
    .catch(console.log)
}

Brain.prototype._idleByMode = function _idleByMode (localeInfo) {
  console.log("In _idleByMode");

  if (this.trader.twoWayMode) {
    this._idleTwoWay(localeInfo)
  } else {
    this._idleOneWay(localeInfo)
  }
}

Brain.prototype.singleCrypto = function singleCrypto () {
  return this.trader.coins.length === 1
}

Brain.prototype.twoWayMode = function twoWayMode () {
  return this.trader.twoWayMode
}

/**
 * Check if the customer is suspended
 *
 * That happens if the customer has reached
 * one of the enabled compliance tier thresholds
 *
 * @name isSuspended
 * @function
 *
 * @param {object} customer Acting customer
 * @param {date} now Current date
 * @returns {bool} Whether customer is suspended or not
 */
Brain.prototype.isSuspended = function isSuspended (customer, now) {
  return customer && customer.suspendedUntil && new Date(customer.suspendedUntil) > now
}

/**
 * Display the suspended screens for customer
 * If the customer hasn't inserted bills yet,
 * the suspendedCustomer screen will displayed with ok button,
 * else the bill screen will be displayed with the relative error message
 *
 * @name showSuspendedCustomer
 * @function
 *
 * @param {object} customer Acting customer
 * @param {date} now Current date
 *
 */
Brain.prototype.showSuspendedCustomer = function showSuspendedCustomer (customer, now) {
  const data = this.getHardLimitReachedData(customer, now)

  
  /*
   * Current transaction's fiat not including current bill
   */

  const insertedBills = this.tx.fiat.gt(0)
  if (!insertedBills) {
    return this._timedState('hardLimitReached', { data })
  }

  /*
   * Set acceptingBills first as transition (in updateBillScreen) so that sendOnly
   * reason message would be displayed on that screen
   */
  this.updateBillScreen(true)
    .then(() => {
      browserEmit({
        action: 'errorTransaction',
        reason: 'blockedCustomer',
        cryptoCode: this.tx.cryptoCode
      })
    })
}

/*
* Calculates the time difference between the
* current date and the suspension time
*
* @name hardLimitReached
* @function
*
* @param {object} customer Acting customer
* @param {date} now Current date
* @returns {object} hard limit
*/
Brain.prototype.getHardLimitReachedData = function getHardLimitReachedData (customer, now) {
  const diff = new Date(customer.suspendedUntil).valueOf() - now.valueOf()

  const diffInWeeks = _.floor(diff / 1000 / 60 / 60 / 24 / 7)
  const diffInDays = _.floor((diff / 1000 / 60 / 60 / 24) - (diffInWeeks * 7))
  const diffInHours = _.ceil((diff / 1000 / 60 / 60) - (diffInDays * 24) - (diffInWeeks * 7))

  return {
    hardLimit: {
      hardLimitWeeks: diffInWeeks,
      hardLimitDays: diffInDays,
      hardLimitHours: diffInHours
    }
  }
}

/**
 * Check if the customer is blocked
 *
 * That happens if the customer has reached
 * one of the enabled compliance tier thresholds
 * and has the relevant override status to blocked
 *
 * @name isBlocked
 * @function
 *
 * @param {object} customer Acting customer
 * @returns {bool} Whether customer is blocked or not
 */
Brain.prototype.isBlocked = function isBlocked (customer) {
  return customer.authorizedOverride === 'blocked'
}

/**
 * Display the blocked screens for customer
 * If the customer hasn't inserted bills yet,
 * the blockedCustomer screen will displayed with ok button,
 * else the bill screen will be displayed with the relative error message
 *
 * @name showBlockedCustomer
 * @function
 *
 * @param {object} customer Acting customers
 */
Brain.prototype.showBlockedCustomer = function showBlockedCustomer () {
  
  /*
   * Current transaction's fiat not including current bill
   */

  const insertedBills = this.tx.fiat.gt(0)
  if (!insertedBills) {
    return this._transitionState('blockedCustomer', {insertedBills})
  }

  /*
   * Set acceptingBills first as transition (in updateBillScreen) so that sendOnly
   * reason message would be displayed on that screen
   */
  this.updateBillScreen(true)
    .then(() => {
      browserEmit({
        action: 'errorTransaction',
        reason: 'blockedCustomer',
        cryptoCode: this.tx.cryptoCode
      })
    })
}

Brain.prototype.smsCompliance = function smsCompliance (opts = {}) {
  this.returnState = opts.returnState
  this.complianceReason = opts.reason

  /**
   * If the phone is already verified
   * proceeed with the next compliance tier
   */
  if (this.tx.phone) {
    return this.smsFlowHandleReturnState()
  }

  const flow = new sms.Flow({noCode: opts.noCode})
  this.flow = flow

  flow.on('screen', rec => {
    this._transitionState(rec.screen, {context: 'compliance'})
  })

  flow.on('idle', () => {
    this._idle()
  })

  flow.on('sendCode', phone => {
    this.trader.phoneCode(phone.phone)
      .then(result => {
        this.customer = result.customer
        
        // BACKWARDS_COMPATIBLITY 7.5
        // Old servers don't send txHistory
        const serverVersion = this.trader.serverVersion
        if (!serverVersion || semver.lt(serverVersion, '7.5.0-beta.0')) {
          this.customerTxHistory = []
        } else {
          this.customerTxHistory = result.customer.txHistory.filter(it => it.id !== this.tx.id)
        }

        this.tx = Tx.update(this.tx, {customerId: result.customer.id})

        /*
         * Check to see if customer is blocked
         * and show the relevant screen
         */
        if (this.isBlocked(this.customer)) {
          this.flow = null
          return this.showBlockedCustomer()
        }
        const now = new Date()

        /*
         * Check to see if customer is suspended
         * and show the relevant screen
         */
        if (this.isSuspended(this.customer, now)) {
          this.flow = null
          return this.showSuspendedCustomer(this.customer, now)
        }

        return flow.handle('requiredSecurityCode', result.code)
      })
      .catch(err => {
        if (err.name === 'BadNumberError') {
          return flow.handle('badPhoneNumber')
        }

        /**
         * In case of API error throw
         */
        if (err.statusCode === 500) {
          throw err
        }

        /**
         * In case the returnState is acceptingBills,
         * display the acceptingBills screen with
         * networkDown reason and sendOnly flag to true
         * instead of a networkDown screen before user
         * returns to acceptingBills
         *
         * If returnState is not  acceptingBills this flag
         * will be ignored. Brain will handle the networkDown
         *
         */
        this.networkDown = true
        this.smsFlowHandleReturnState()
      })
      .catch(err => {
        this.flow = null
        this._fiatError(err)
      })
  })

  flow.on('success', () => {
    const phone = flow.phone
    this.flow = null

    const txPromise = this.redeem
      ? this.trader.fetchPhoneTx(phone)
      : Promise.resolve(Tx.update(this.tx, {phone}))

    return txPromise
      .then(tx => {
        this.tx = tx
        return this.smsFlowHandleReturnState()
      })
      .catch(err => {
        if (err.statusCode === 404) {
          return this._timedState('unknownPhoneNumber')
        }

        if (err.statusCode === 411) {
        // Transaction not seen on the blockchain
          this.tx = null
          return this._timedState('txNotSeen')
        }

        if (err.statusCode === 412) {
        // There are unconfirmed transactions
          this.tx = null
          return this._timedState('unconfirmedDeposit')
        }

        this._fiatError(err)
        throw err
      })
  })

  flow.on('fail', () => {
    this.flow = null
    this.failedCompliance = 'sms'
    this.failedComplianceValue = this.requirementAmountTriggered[this.failedCompliance]

    if (this.returnState && !_.includes(this.complianceReason, ARE_YOU_SURE_HANDLED_SMS_COMPLIANCE)) {
      return this.smsFlowHandleReturnState()
    }

    this._idle()
  })

  flow.handle('start')
}

Brain.prototype.isTierCompliant = function isTierCompliant (tier) {
  const tx = this.tx
  const customer = this.customer || {}

  console.log(customer);

  switch (tier) {
    case 'sms':
      return !_.isNil(tx.phone)
    case 'idCardData':
      if (customer.idCardDataOverride === 'verified') return true
      if (customer.idCardDataOverride === 'blocked') return false
      return !_.isEmpty(customer.idCardData)
    case 'idCardPhoto':
      if (customer.idCardPhotoOverride === 'verified') return true
      if (customer.idCardPhotoOverride === 'blocked') return false
      return !_.isEmpty(customer.idCardPhotoPath)
    case 'sanctions':
      return customer.sanctions
    case 'facephoto':
      if (customer.frontCameraOverride === 'verified') return true
      if (customer.frontCameraOverride === 'blocked') return false
      return !_.isEmpty(customer.frontCameraPath)
    case 'usSsn':
      if (customer.usSsnOverride === 'verified') return true
      if (customer.usSsnOverride === 'blocked') return false
      return !_.isEmpty(customer.usSsn)
    case 'block':
    case 'suspend':
      return false
    default:
      throw new Error(`Unsupported tier: ${tier}`)
  }
}

Brain.prototype.minimumFiat = function minimumFiat () {
  return _.head(this.trader.cassettes).denomination
}

Brain.prototype.smsFlowHandleReturnState = function smsFlowHandleReturnState () {

  console.log("smsFlowHandleReturnState");
  
  console.log("smsFlowHandleReturnState - 1");

  const returnState = this.returnState
  const tx = this.tx

  const amount = this.complianceAmount()
  const triggerTx = { fiat: amount, direction: tx.direction}

  console.log("smsFlowHandleReturnState - 2");

  const nonCompliantTiers = this.nonCompliantTiers(this.trader.triggers, this.customerTxHistory, triggerTx)
  const isCompliant = _.isEmpty(nonCompliantTiers)
  const otherTiers = _.isNil(this.failedCompliance) && !isCompliant


  console.log("smsFlowHandleReturnState - 3");

  /**
   * Are there any other compliance tier to run?
   */
  if (otherTiers) {
    return this.runComplianceTiers(nonCompliantTiers)
  }

  const isStartOfTx = BN(0).eq(this.tx.fiat)
  const now = new Date()

  if (isStartOfTx && this.isSuspended(this.customer, now)) {
    const data = this.getHardLimitReachedData(this.customer, now)

    return this._timedState('hardLimitReached', { data })
  }

  console.log("smsFlowHandleReturnState - 4");

  if (!returnState) {

    /**
     * Return to startScreen
     * to continue cashIn procedure
     */
    if (tx.direction === 'cashIn' && isCompliant) {
      return this.startScreen()
    }

    return this._idle()
  }

  console.log("smsFlowHandleReturnState - 5");

  /**
   * Return to idle state only if the pre-sms flow state was
   * acceptingFirstBill and sms flow failed at some point.
   * Otherwise if sms registration was successfull,
   * redirect user to insert the first bill (see below on transition)
   */
  if (returnState === 'acceptingFirstBill' && !isCompliant) {
    return this._idle()
  }

  console.log("smsFlowHandleReturnState - 6");

  if (returnState === 'acceptingBills') {
    /**
     * If a network error occured during sms compliance authorization,
     * return to acceptingBills first, and then call _networkDown()
     * to display the networkDown reason instantly,
     * instead of showing networkDown screen
     */
    const hasFailedCompliance = !_.isNil(this.failedCompliance)

    this.updateBillScreen(hasFailedCompliance)
    if (this.networkDown) this._networkDown()
    return
  }


  console.log("smsFlowHandleReturnState - 7");
  console.log(returnState);

  // if (returnState === 'acceptingFirstBill' && this.bill) {
  if (this.bill) {
    // return this._transitionState('requestConfirmation', {bill: this.bill});    
    return this._requestConfirmation();
  }

  this._transitionState(returnState)
}

Brain.prototype._requestConfirmation = function _requestConfirmation() {
  if (this.bill && this.tx) {
    const bill = this.bill;
    const tx = this.tx;
    var cryptoCode = tx.cryptoCode
    var cryptoAtoms = Tx.truncateCrypto(
        _.reduce((acc, v) => acc.plus(Tx.toCrypto(tx, BN(v.fiat - v.cashInFee))), BN(0), [bill]),
        cryptoCode);

    //Temporary adjustment to tx
    this._transitionState('requestConfirmation', {tx: {...tx, cryptoAtoms, fiat: bill.fiat}});
  }
}

/**
 * Returns the daily volume taking into consideration the compliance restrictions
 * At the start of the tx we add the minimum value for the tx to the volume
 * 
 * @returns {BigNumber}
 */
Brain.prototype.complianceAmount = function complianceAmount () {
  const tx = this.tx
  const amount = tx.fiat

  const isStartOfTx = BN(0).eq(amount)


  const lastRejectedBill = _.defaultTo(BN(0), this.lastRejectedBillFiat)

  // We can either have no bill inserted or first bill rejected
  // Grab the higher value to add into the daily volume
  if (isStartOfTx) {
    const coin = _.find(['cryptoCode', tx.cryptoCode], this.trader.coins)
    
    //Bill validator is not requied for POS -- then what ???
    return amount.plus(
      BigNumber.max(

        // this.billValidator.lowestBill(coin.minimumTx),
        lastRejectedBill
      )
    )
  }

  // On cash in we always have to take lastRejectedBill into account
  return amount.plus(lastRejectedBill)
}


//Called after sending rates - part of step 2
Brain.prototype.startScreen = function startScreen () {
  const direction = this.tx.direction
  console.log("In Start Screen");

  // check if terms screen is enabled
  // and user still need to accept terms
  if (this.mustAcceptTerms()) {
    return this._transitionState('termsScreen')
  }

  console.log("Heading to _start function - To Step 2");
  if (direction === 'cashIn') return this._start()

  throw new Error(`No such direction ${direction}`)
}



Brain.prototype.mustAcceptTerms = function mustAcceptTerms () {
  return (
    // check if terms screen is enabled
    this.trader.terms &&
    this.trader.terms.active &&
    // and user still need to accept terms
    !this.tx.termsAccepted
  )
}

Brain.prototype.acceptTerms = function acceptTerms () {
  // mark terms as accepted
  // and redirect user to start screen
  this.tx = Tx.update(this.tx, {termsAccepted: true})
  this.startScreen()
}


Brain.prototype._idleOneWay = function _idleOneWay (localeInfo) {
  this._chooseCoinScreen(localeInfo)
}

Brain.prototype._chooseCoinScreen = function _chooseCoinScreen (localeInfo, cassettes) {
  console.log("in ChooseCoinScreen");
  this._transitionState('chooseCoin', {
    localeInfo: localeInfo,
    cassettes: cassettes,
    coins: this.trader.coins,
    twoWayMode: this.twoWayMode()
  })
}


//Step - 1 on message 'start'
Brain.prototype._chooseCoin = function _chooseCoin (data) {
  console.log("_chooseCoin");
  // console.log(data);

  this.tx = Tx.update(this.tx, data)
  browserEmit({cryptoCode: data.cryptoCode})
  this.sendRates()
  this.startScreen()
}

Brain.prototype.isIdleState = function isIdleState () {
  return this.state === 'chooseCoin'
}

Brain.prototype._setLocale = function _setLocale (data) {
  const self = this
  this._idle(data.locale)
  this._screenTimeout(function () { self._idle() }, 30000)
}

Brain.prototype.isLowBalance = function isLowBalance () {
  const fiatBalance = this.balance()
  // const highestBill = this.billValidator.highestBill(fiatBalance)
  const highestBill = getHighestBill(fiatBalance)

  return highestBill.lt(0)
}

Brain.prototype.nonCompliantTiers = function nonCompliantTiers (triggers, history, triggerTx) {
  const triggered = getTriggered(triggers, history, triggerTx)
  const getHighestSuspend = _.compose(_.get('id'), _.maxBy('suspensionDays'), _.filter({ requirement: REQUIREMENTS.SUSPEND }))
  this.suspendTriggerId = getHighestSuspend(triggered)

  const requirements = _.uniq(_.map(_.get('requirement'))(triggered))
  const unorderedTiers = _.isEmpty(requirements) ? [] : _.union(requirements, ['sms'])
  const requiredTiers = _.sortBy(name => _.indexOf(name, ORDERED_REQUIREMENTS))(unorderedTiers)

  this.requirementAmountTriggered = getLowestAmountPerRequirement(triggered)

  return _.filter(tier => !this.isTierCompliant(tier), requiredTiers)
}

Brain.prototype._startBalanceCheck = function _startBalanceCheck() {
  this._transitionState('checkBalance');
}


//Still part of step - 1 
Brain.prototype._start = function _start () {

  console.log("In _start")
  if (this.startDisabled) return

  //Bill validator check -- not required in POS  
  if (this.isLowBalance()) return this._timedState('balanceLow')

  const cryptoCode = this.tx.cryptoCode
  const coin = _.find(['cryptoCode', cryptoCode], this.trader.coins)

  const updateRec = {
    direction: 'cashIn',
    cashInFee: coin.cashInFee,
    commissionPercentage: BN(coin.cashInCommission).div(100),
    rawTickerPrice: BN(coin.rates.ask),
    minimumTx: coin.minimumTx, //this.billValidator.lowestBill(coin.minimumTx),
    cryptoNetwork: coin.cryptoNetwork
  }

  const update = _.assignAll([this.tx, updateRec])
  this.tx = Tx.update(this.tx, update)

  //INstead of calling start Address Scan, we should first get Fiat input to check balance
  //this._startAddressScan()
  this._startBalanceCheck();
  browserEmit({tx: this.tx})
}

Brain.prototype._privateWalletPrinting = function _privateWalletPrinting () {
  this._transitionState('cashInWaiting')

  if (!this.printer) {
    console.log('[ERROR]: The kiosk printer was not loaded.')
    return this._timedState('printerError')
  }

  return this.printer.checkStatus(deviceConfig.kioskPrinter, STATUS_QUERY_TIMEOUT)
    .then((printerStatus) => {
      console.log('Kiosk printer status: ', printerStatus)
      if (printerStatus.hasErrors) throw new Error()

      const wallet = coinUtils.createWallet(this.tx.cryptoCode)
      const printerCfg = deviceConfig.kioskPrinter
      this.pk = wallet.privateKey
      return this.printer.printWallet(wallet, printerCfg)
        .then(() => {
          this.tx = Tx.update(this.tx, { isPaperWallet: true, toAddress: wallet.publicAddress })
          this._startPrintedWalletScan(this.tx.toAddress)
        })
    })
    .catch((err) => {
      console.log('[ERROR]: The kiosk printer is in an invalid state.', err)
      return this._timedState('printerError')
    })
}

Brain.prototype._startPrintedWalletScan = function _startPrintedWalletScan () {
  this._transitionState('printerScanAddress')
  const txId = this.tx.id

  if (this.hasNewScanBay()) this.scanBayLightOn()

  this.scanner.scanPK((err, pk) => {
    this.scanBayLightOff()
    clearTimeout(this.screenTimeout)
    this.startDisabled = false

    if (err) this.emit('error', err)
    const startState = _.includes(this.state, ['printerScanAddress', 'goodbye'])
    const freshState = this.tx.id === txId && startState

    if (!freshState) return
    if (!pk) return this._idle()
    if ((err && err.message === 'Invalid address') || this.pk !== pk) {
      return this._timedState('printerScanningError')
    }

    browserEmit({ tx: this.tx })
    this._handleScan(this.tx.toAddress)
  })

  this.screenTimeout = setTimeout(() => {
    if (this.state !== 'printerScanAddress') return
    this.scanner.cancel()
  }, this.config.qrTimeout)
}


Brain.prototype._scanActionCancel = function _scanActionCancel (fsm) {
  this.clearTimeoutToScannerCancel()
  this.scanner.cancel()
  fsm.dispatch('FAIL')
}

Brain.prototype._cancelIdScan = function _cancelIdScan () {
  this.clearTimeoutToScannerCancel()
  this.startDisabled = true
  this._bye({timeoutHandler: () => { this.handleUnresponsiveCamera() }})
  this.scanner.cancel()
}

Brain.prototype.hasNewScanBay = function hasNewScanBay () {
  const model = deviceConfig.cryptomatModel
  return model === 'sintra' || model === 'gaia'
}


//Added by Shiv to preview rates (and exchange) before scanning
Brain.prototype._previewRates = function _previewRates () {
  const bill = this.bill;
  const tx = this.tx;

  if (bill && tx) {
    var cryptoCode = tx.cryptoCode
    var cryptoAtoms = Tx.truncateCrypto(
        _.reduce((acc, v) => acc.plus(Tx.toCrypto(tx, BN(v.fiat - v.cashInFee))), BN(0), [bill]),
        cryptoCode);

    //Temporary adjustment to tx
    this._transitionState('previewRates', {tx: {...this.tx, cryptoAtoms, fiat: bill.fiat}});
  } else {
    this._startAddressScan();
  }
}

Brain.prototype._startAddressScan = function _startAddressScan () {
  this._transitionState('scanAddress')
}

//THis is new function..Originally part of _startAddressScan
//Because in POS Scanning is handled by UI component
Brain.prototype._handleAddressScan = function _handleAddressScan ({address}) {
  console.log("In Handle Address Scan");
  console.log(address);

  const txId = this.tx.id

  // if (this.hasNewScanBay()) this.scanBayLightOn()

  //Validate the QR code
  const network = 'main';
  try {
    address = coinUtils.parseUrl(this.tx.cryptoCode, network, address);
  } catch (err) {
    if (err && err.message === 'Invalid address') return this._invalidAddress()
    if (err) this.emit('error', err)
  }

  console.log("Validates address");
  console.log(address);

  const startState = _.includes(this.state, ['scanAddress', 'goodbye'])
  const freshState = this.tx.id === txId && startState

  if (!freshState) return
  if (!address) return this._idle()
  this._handleScan(address)

}

Brain.prototype._bye = function _bye (opts) {
  this._timedState('goodbye', opts)
}

Brain.prototype._invalidAddress = function _invalidAddress () {
  this._timedState('invalidAddress', {
    timeout: this.config.invalidAddressTimeout
  })
}

Brain.prototype._cancelScan = function _cancelScan () {
  this.startDisabled = true
  // TODO new-admin
  this._bye({timeoutHandler: () => { this.handleUnresponsiveCamera() }})
  this.scanner.cancel()
}

Brain.prototype.isStaticState = function isStaticState () {
  const staticStates = ['chooseCoin', 'idle', 'pendingIdle', 'dualIdle',
    'networkDown', 'unpaired', 'maintenance', 'virgin', 'wifiList']

  return _.includes(this.state, staticStates)
}

Brain.prototype.balance = function balance () {
  const cryptoCode = this.tx.cryptoCode
  if (!cryptoCode) throw new Error('No cryptoCode, this shouldn\'t happen')

  return this.trader.balances[cryptoCode]
}


//Sent on choosing coins as part of Step 1
Brain.prototype.sendRates = function sendRates () {
  const cryptoCode = this.tx.cryptoCode
  if (!cryptoCode) return

  const rec = {
    fiatCode: this.fiatCode,
    rates: {
      rates: this.trader.rates(cryptoCode),
      cryptoCode: cryptoCode,
      coins: Tx.coins
    },
    coins: this.trader.coins,
    twoWayMode: this.twoWayMode(),
    terms: this.trader.terms,
    operatorInfo: this.trader.operatorInfo,
    areThereAvailablePromoCodes: this.trader.areThereAvailablePromoCodes
  }

  browserEmit(rec)
}

Brain.prototype._pollUpdate = function _pollUpdate (needsRefresh) {
  console.log("In Poll update, Trade Locale");
  console.log(this.trader.locale);

  const locale = this.trader.locale;


  this.fiatCode = locale.fiatCode;
  this.localeInfo = locale.localeInfo;

  if (!this.isIdleState()) return

  this.sendRates()
  if (needsRefresh) this._idle()
}

Brain.prototype._networkDown = function _networkDown () {
  console.log("Network Down");

  if (this.state === 'networkDown') return

  if (_.isEmpty(this.trader.coins)) {
    console.log('No active cryptocurrencies.')
  }

  this.networkDown = true

  const tx = this.tx

  const doForceDown = !tx ||
    !tx.direction ||
    (tx.direction === 'cashIn' && _.isEmpty(tx.bills))

  if (doForceDown) return this._forceNetworkDown()

  if (tx.direction !== 'cashIn') return
}

Brain.prototype._forceNetworkDown = function _forceNetworkDown () {
  console.log("_forceNetworkDown");
  const self = this

  this.trader.clearConfigVersion()

  if (!this.hasConnected && this.state !== 'connecting') {
    this._transitionState('connecting')
    setTimeout(function () {
      self.hasConnected = true
      if (self.state === 'connecting') self._idle()
    }, self.config.connectingTimeout)
    return
  }

  if (this.hasConnected) this._transitionState('networkDown')
}

const isNonTx = state => _.includes(state, NON_TX_STATES)

let firstUp = true
Brain.prototype._networkUp = function _networkUp () {
  console.log("_networkUp");
  console.log(this.state);
  // Don't go to start screen yet
  // if (!this.billValidator.hasDenominations()) return

  this.networkDown = false
  this.hasConnected = true

  if (firstUp) {
    firstUp = false
    console.log(this.state);
    console.log("Process Pending");
    this.processPending()
  }

  console.log("Calling Idle");

  if (isNonTx(this.state)) return this._idle()

}

Brain.prototype._timedState = function _timedState (state, opts) {
  const self = this
  opts = opts || {}

  if (this.state === state) {
    // console.trace('WARNING: Trying to set to same state: %s', state)
    return
  }
  const timeout = opts.timeout || 30000
  const handler = opts.timeoutHandler
    ? opts.timeoutHandler
    : opts.revertState
      ? function () { self._transitionState(opts.revertState) }
      : function () { self._idle() }

  this._transitionState(state, opts.data)
  this._screenTimeout(handler, timeout)
}

Brain.prototype._transitionState = function _transitionState (state, auxData) {
  // TODO refactor code to use this
  // If we're in maintenance state, we stay there till we die
  if (this.state === state || this.state === 'maintenance') return false
  const rec = { action: state, direction: this.tx && this.tx.direction }
  transitionTime = Date.now()
  this._setState(state)
  browserEmit(_.merge(auxData, rec))
  return true
}

Brain.prototype._cryptoFractionalDigits = function _cryptoFractionalDigits (amount) {
  const log = Math.floor(Math.log(amount) / Math.log(10))
  return (log > 0) ? 2 : 2 - log
}

Brain.prototype._assertState = function _assertState (expected) {
  const actual = this.state
  console.assert(actual === expected,
    'State should be ' + expected + ', is ' + actual)
}

Brain.prototype._startCompliance = function _startCompliance () {
  const amount = this.bill.fiat;
  const triggerTx = { fiat: amount, direction: this.tx.direction}

  const nonCompliantTiers = this.nonCompliantTiers(this.trader.triggers, this.customerTxHistory, triggerTx)
  const isCompliant = _.isEmpty(nonCompliantTiers)

  // If threshold is 0,
  // the sms verification is being handled at the beginning of this.startScreen.
  if (!isCompliant) {
    // Cancel current bill

    // console.log("Rejecting Bill");
    // this._billRejected();

    // If id tier force another verification screen
    const nonCompliantTier = _.head(nonCompliantTiers)
    const idTier = nonCompliantTier === 'idCardData' || nonCompliantTier === 'idCardPhoto'
    if (idTier) return this.transitionToVerificationScreen(nonCompliantTier)

    return this.runComplianceTiers(nonCompliantTiers)
  }
}

Brain.prototype._handleScan = function _handleScan (address) {
  const waitingTimeout = setTimeout(() => {
    this._transitionState('cashInWaiting')
  }, MIN_WAITING)

  const t0 = Date.now()

  return this.updateTx({toAddress: address})
    .then(it => {
      clearTimeout(waitingTimeout)

      const elapsed = Date.now() - t0
      const extraTime = MIN_WAITING * 2 - elapsed
      const remaining = this.state === 'cashInWaiting'
        ? Math.max(0, extraTime)
        : 0

      if (it.addressReuse) {
        return setTimeout(() => {
          this._timedState('addressReuse')
        }, remaining)
      }

      if (it.blacklisted) {
        return setTimeout(() => {
          this._timedState('suspiciousAddress')
        }, remaining)
      }

      console.log("After scanning");
      console.log(this.bill);  

      setTimeout(() => {

        //Modified by Shiv
        if (this.bill) {
          //Also, need to provide a return state to smsCompliace otherwise it goes to start screen
          // return this.smsCompliance();
          // return this._continueSmsCompliance();
          return this._startCompliance();
        }

        return this._firstBill()
      }, remaining)
    })
}

function emit (_event) {
  const event = _.isString(_event)
    ? {action: _event}
    : _event

  actionEmitter.emit('brain', event)
}

function browserEmit (_event) {
  const event = _.isString(_event)
    ? {action: _event}
    : _event

  actionEmitter.emit('browserEvent', event)
}

Brain.prototype._firstBill = function _firstBill () {
  console.log(_firstBill);
  this._setState('acceptingFirstBill')
  browserEmit({
    action: 'scanned',
    buyerAddress: coinUtils.formatAddress(this.tx.cryptoCode, this.tx.toAddress)
  })

  //There in no bill validator in POS - sp then??
  // this.enableBillValidator()

  this._screenTimeout(() => this._idle(), this.config.billTimeout)
}


function getHighestBill (fiat) {
  console.log("Get Highest Bill");
  // const bills = _.values(null)
  // const filtered = bills.filter(bill => fiat.gte(bill))
  // if (_.isEmpty(filtered)) return BN(-Infinity)
  return BN(fiat);
}

function getLowestBill (fiat) {
  console.log("Get Lowest Bill");
  // const bills = _.values(null);
  // const filtered = bills.filter(bill => fiat.lte(bill))
  // if (_.isEmpty(filtered)) return BN(_.min(bills))
  // return BN(_.min(filtered))
  return BN("1")
}


//Instead of Bill Read, write logic to check fiat amount before vending
Brain.prototype._handleFiatInput = function _handleFiatInput (data) {

  //Use this 
  this.insertBill(data.denomination)

  // Current inserting bill
  const currentBill = this.bill.fiat

  // Limit next bills by failed compliance value
  // if value is null it was triggered by velocity or consecutive days
  const failedTierThreshold = _.isNil(this.failedCompliance) ? BN(Infinity) : BN(this.failedComplianceValue || 0)

  // Available cryptocurrency balance expressed in fiat not including current bill
  const remainingFiatToInsert = BN.klass.min(this.balance(), failedTierThreshold).minus(currentBill)

  // Minimum allowed transaction
  const minimumAllowedTx = this.tx.minimumTx

  //Reject if balance not available 
  if (remainingFiatToInsert.lt(0)) {
    // billValidator.reject()
    this._billRejected();

    console.log('DEBUG: low balance, attempting disable')
    browserEmit({
      action: 'errorTransaction',
      cryptoCode: this.tx.cryptoCode,
      reason: "lowBalance"
    })

    return
  }

  if (currentBill.lt(minimumAllowedTx)) {
    // billValidator.reject()
    this._billRejected();

    // const lowestBill = billValidator.lowestBill(minimumAllowedTx)
    const lowestBill = getLowestBill(minimumAllowedTx);

    browserEmit({
      action: 'minimumTx',
      lowestBill: lowestBill.toNumber()
    })

    return
  }

  //Before compliance triggers, check for address -- Added by Shiv 
  if (data.reason == "checkBalance" || !this.tx.toAddress) {
  
    //But bill is not rejected yet! so this.bill is not null   (this information can be used to route after scanning)
    
    return this._previewRates()
    // return this._startAddressScan();
  }

  const amount = currentBill; //fiatBeforeBill.plus(currentBill)
  const triggerTx = { fiat: amount, direction: this.tx.direction}

  const nonCompliantTiers = this.nonCompliantTiers(this.trader.triggers, this.customerTxHistory, triggerTx)
  const isCompliant = _.isEmpty(nonCompliantTiers)

  // If threshold is 0,
  // the sms verification is being handled at the beginning of this.startScreen.

  //Is this code ever-reached in POS
  if (!isCompliant) {
    // Cancel current bill
    this._billRejected();

    // If id tier force another verification screen
    const nonCompliantTier = _.head(nonCompliantTiers)
    const idTier = nonCompliantTier === 'idCardData' || nonCompliantTier === 'idCardPhoto'
    if (idTier) return this.transitionToVerificationScreen(nonCompliantTier)

    return this.runComplianceTiers(nonCompliantTiers)
  }

  this._requestConfirmation();
}


Brain.prototype.runComplianceTiers = function (nonCompliantTiers) {

  console.log("Running Compiace check");
  console.log(nonCompliantTiers);

  const tier = _.head(nonCompliantTiers)

  const isCashIn = this.tx.direction === 'cashIn'
  const idTier = tier === 'idCardData' || tier === 'idCardPhoto'
  const smsTier = tier === 'sms'
  const cameraTier = tier === 'facephoto'
  const usSsnTier = tier === 'usSsn'

  const smsScreen = smsTier && isCashIn && !_.get('sms')(this.permissionsGiven)
  const idScreen = idTier && isCashIn && !_.get('id')(this.permissionsGiven)
  const photoScreen = cameraTier && !_.get('photo')(this.permissionsGiven)
  const usSsnScreen = usSsnTier && !_.get('usSsn')(this.permissionsGiven)

  if (smsScreen || idScreen || photoScreen || usSsnScreen) {
    return this.transitionToVerificationScreen(tier)
  }
  
  complianceTiers.run(tier, this.rootConfig.cryptomatModel || 'sintra')
}

Brain.prototype.transitionToVerificationScreen = function (tier) {
  switch (tier) {
    case 'idCardData':
    case 'idCardPhoto':
      this._transitionState('permission_id', {
        tx: this.tx
      })
      break
    case 'facephoto':
      this._transitionState('permission_face_photo', {
        tx: this.tx
      })
      break
    case 'usSsn':
      this._transitionState('usSsnPermission', {
        tx: this.tx
      })
      break
    default:
      this._transitionState('smsVerification', {
        threshold: this.trader.smsVerificationThreshold,
        tx: this.tx
      })
  }
}

Brain.prototype.saveTx = function saveTx (tx) {
  console.log("Brain - In save Tx");
  return db.save(this.dbRoot, tx)
}

Brain.prototype.postTx = function postTx (tx) {

  console.log("Brain - In Post Tx");
  // console.log(tx);
  const postTxF = timedout => {
    const updatedTx = _.assign(tx, {timedout})

    console.log("Sending to Trader - PostTx")
    return this.trader.postTx(updatedTx)
      .then(serverTx => ({tx: serverTx}))
  }

  const timeout$ = Rx.Observable.timer(NETWORK_TIMEOUT_INTERVAL)
    .mapTo({timedout: true})
    .startWith({timedout: false})
    .share()

  const source$ = Rx.Observable.interval(POLL_INTERVAL)
    .startWith(-1)
    .combineLatest(timeout$, (x, r) => r.timedout)
    .mergeMap(postTxF)
    .share()

  // Keep trying in background forever until success
  source$.first(r => r.tx).subscribe(r => this.saveTx(r.tx), _ => {})

  return source$
    .merge(timeout$)
    .first(r => r.tx || r.timedout)
    .toPromise()
    .then(r => {
      if (r.tx) return r.tx
      throw new Error('timeout')
    })
}

Brain.prototype.updateTx = function updateTx (updateTx) {

  console.log("Brains - In Update TX")
  //On Buy Error - 
  const newTx = Tx.update(this.tx, updateTx)
  this.tx = newTx

  console.log("New Tx");
  console.log(newTx);

  return this.saveTx(newTx)
    .then(() => this.postTx(newTx))
    .then(tx => {
      this.tx = tx
      return tx
    })
}

// Don't wait for server response
Brain.prototype.fastUpdateTx = function fastUpdateTx (updateTx) {
  console.log('fastUpdateTx', updateTx)
  const newTx = Tx.update(this.tx, updateTx)
  this.tx = newTx

  this.postTx(newTx)
    .catch(err => console.log(err))

  console.log("Saving tx -  fastUpdateTx");
  return this.saveTx(newTx)
}


//This is replacement to updateBillScreen
Brain.prototype._finalizeSale = function _finalizeSale (cardData) {
  this._setState('finalizeSale');

  return this.trader.processPayment(this.tx, this.bill.fiat, cardData)
  .then(r => {

    console.log("Payment - Success");
    console.log(r);
      
    console.log("After successfull payment  - In finalize Sale");
    const bill = this.bill

    // No going back
    this.clearBill()
    this.lastRejectedBillFiat = BN(0)

    var billUpdate
    // BACKWARDS_COMPATIBILITY 7.5.0-beta.1
    const serverVersion = this.trader.serverVersion
    if (!serverVersion || semver.lt(serverVersion, '7.5.0-beta.1')) {
      billUpdate = Tx.billUpdateDeprecated(bill)
    } else {
      billUpdate = Tx.billUpdate(bill)
    }

    console.log("Doing the fast update")
    return this.fastUpdateTx(billUpdate)
    .then(() => {
      // console.log("Transitioning State: acceptingBills")
      // this._transitionState('acceptingBills', { tx: this.tx })
      // this._transitionState('sendCoins', { tx: this.tx })
      this._sendCoins();
    })    
  })
  .catch(err => {

      console.log("Payment - Error");
      console.log(err);

      this._billRejected();

      console.log('DEBUG: Error processing Payment');
      browserEmit({
        action: 'errorTransaction',
        cryptoCode: this.tx.cryptoCode,
        reason: "paymentError"
      })

      this.cancelTransaction(null, 'payment');
  })
 
}

// TODO: clean this up
Brain.prototype._billRejected = function _billRejected () {
  const self = this
  if (!_.includes(this.state, BILL_ACCEPTING_STATES) && !_.includes(this.state, COMPLIANCE_VERIFICATION_STATES)) return

  this.clearBill()

  const returnState = this.tx.fiat.eq(0)
    ? 'acceptingFirstBill'
    : 'acceptingBills'

  this._transitionState(returnState)

  this._screenTimeout(function () {
    returnState === 'acceptingFirstBill'
      ? self._idle()
      : self._sendCoins()
  }, this.config.billTimeout)

  const response = {
    action: 'rejectedBill',
    credit: this._uiCredit()
  }

  browserEmit(response)
}


Brain.prototype._uiCredit = function _uiCredit () {
  var updatedBill
  // BACKWARDS_COMPATIBILITY 7.5.0-beta.1
  const serverVersion = this.trader.serverVersion
  if (!serverVersion || semver.lt(serverVersion, '7.5.0-beta.1')) {
    updatedBill = Tx.billUpdateDeprecated(this.bill)
  } else {
    updatedBill = Tx.billUpdate(this.bill)
  }
  const tx = Tx.update(this.tx, updatedBill)

  return {
    cryptoCode: tx.cryptoCode,
    fiat: tx.fiat.toNumber(),
    cryptoAtoms: tx.cryptoAtoms.toNumber(),
    lastBill: _.last(tx.bills.map(bill => bill.fiat.toNumber()))
  }
}

/**
 * Clear the rejected bill and keep it's
 * amount as the lastRejectedBillFiat
 *
 * @name clearBill
 * @function
 *
 */
Brain.prototype.clearBill = function clearBill () {
  this.lastRejectedBillFiat = this.bill ? this.bill.fiat : BN(0)
  this.bill = null
}

Brain.prototype.insertBill = function insertBill (bill) {

  console.log("In Insert Bill");
  console.assert(!this.bill || this.bill.fiat.eq(0), "bill fiat is positive, can't start tx")
  const cryptoCode = this.tx.cryptoCode

  // BACKWARDS_COMPATIBILITY 7.5.1
  const serverVersion = this.trader.serverVersion
  if (!serverVersion || semver.lt(serverVersion, '7.5.1-beta.0')) {
    console.log("Tx.createBill - 1");
    const exchangeRate = this.trader.rates(cryptoCode).cashIn
    console.log(exchangeRate);

    this.bill = Tx.createBillDeprecated(bill, exchangeRate, this.tx)

  } else {

    console.log("Tx.createBill - 2");
    this.bill = Tx.createBill(bill, this.tx)
  }
}

Brain.prototype._insertPromoCode = function _insertPromoCode () {
  this._transitionState('insertPromoCode')
}

Brain.prototype._cancelPromoCode = function _cancelPromoCode () {
  if (this.tx.direction === 'cashIn') this.returnToCashInState()
}

Brain.prototype._submitPromoCode = function _submitPromoCode (data) {
  const promoCode = data.input

  this.trader.verifyPromoCode(promoCode, this.tx).then(res => {
    this.tx = Tx.update(this.tx, { discount: res.promoCode.discount })

    const rec = {
      rates: {
        rates: Tx.getRates(this.tx)[this.tx.cryptoCode],
        cryptoCode: this.tx.cryptoCode,
        coins: Tx.coins
      },
      credit: this._uiCredit()
    }

    browserEmit(rec)

    this.returnToCashInState()

  }).catch(err => {
    console.log('Promo code not found: Error ' + err)
    this._transitionState('invalidPromoCode')
    this._screenTimeout(() => {
      this._cancelPromoCode()
    }, this.config.promoCodeTimeout)
  })
}

Brain.prototype.returnToScanState = function returnToScanState () {
  const callback = this._start.bind(this)
  this._screenTimeout(callback, this.config.qrTimeout)
}

Brain.prototype.returnToCashInState = function returnToCashInState () {
  if (!this.tx.toAddress) return this.returnToScanState()
  const returnState = this.tx.fiat.eq(0)
    ? 'acceptingFirstBill'
    : 'acceptingBills'

  const callback = returnState === 'acceptingFirstBill'
    ? this._idle.bind(this)
    : this._sendCoins.bind(this)

  this._transitionState(returnState, { tx: this.tx })
  this._screenTimeout(callback, this.config.billTimeout)
}


Brain.prototype._sendCoins = function _sendCoins () {
  browserEmit({
    action: 'cryptoTransferPending',
    buyerAddress: coinUtils.formatAddress(this.tx.cryptoCode, this.tx.toAddress)
  })

  this._doSendCoins();
  console.log("Not fulfilled");
  console.log(this.tx)
}

Brain.prototype._doSendCoins = function _doSendCoins () {

  console.log("In Do Send Coins")

  const complianceStates = _.concat(COMPLIANCE_VERIFICATION_STATES, COMPLIANCE_REJECTED_STATES)
  console.log("In Do Send Coins - 1")
  console.log(complianceStates);

  console.log("State");
  console.log(this.state)

  if (this.state !== 'finalizeSale' && !_.includes(this.state, complianceStates)) return
  
  console.log("In Do Send Coins - 2")  
  return this._executeSendCoins()
}

// This keeps trying until success
Brain.prototype._executeSendCoins = function _executeSendCoins () {
  
  console.log("in _executeSendCoins");  
  // emit('billValidatorPendingOff')
  // this.disableBillValidator() -- Not Required in POS

  this._verifyTransaction()

  return this.updateTx({send: true})
    .then(tx => this._cashInComplete(tx))
    .catch(err => {
      this._sendCoinsError(err)
      this.tx = _.set('timedout', true, this.tx)
      this.saveTx(this.tx)
    })
}

// Giving up, go to special screens asking user to contact operator
Brain.prototype._sendCoinsError = function _sendCoinsError (err) {
  console.log('Error sending cryptos: %s', err.message)

  const withdrawFailureRec = {
    credit: this._uiCredit(),
    txId: this.tx.id
  }

  const self = this
  if (err.statusCode === INSUFFICIENT_FUNDS_CODE) {
    setTimeout(function () { self._idle() }, self.config.insufficientFundsTimeout)
    return this._transitionState('insufficientFunds')
  }

  this._transitionState('withdrawFailure', withdrawFailureRec)
  this._timeoutToIdle(60000)

  if (this.tx.isPaperWallet || this.trader.receiptPrintingActive) {
    this._printReceipt()
  }
}

// And... we're done!
Brain.prototype._cashInComplete = function _cashInComplete () {
  this._setState('completed')

  browserEmit({
    action: 'cryptoTransferComplete',
    tx: this.tx,
    receipt: this._getReceipt(this.tx)
  })

  //Time out to return to idle screen aagain;
  this._screenTimeout(this._completed.bind(this), this.config.completedTimeout)

  // if (this.tx.isPaperWallet || this.trader.receiptPrintingActive) {
  //   this._printReceipt()
  // }
}

Brain.prototype._getReceipt = function _getReceipt (tx) {
  const cashInCommission = BN(1).plus(BN(tx.commissionPercentage))

  const rate = BN(tx.rawTickerPrice).multipliedBy(cashInCommission).precision(2)
  
  //This is fine for current transaction but what about earlier transaction
  // const date = new Date()
  // const dateString = date.toLocaleString('es-GT',{ hour12: true}).toLocaleUpperCase().replace("A. M.","AM").replace("P. M.","PM");
  const dateString = moment.tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss');

  const data = {
    operatorInfo: this.trader.operatorInfo,
    location: deviceConfig.machineLocation,
    // customer: this.customer ? this.customer.phone : 'Anonymous',
    customer: tx.phone,
    session: tx.id,
    time: dateString,
    direction: tx.direction === 'cashIn' ? 'Cash-in' : 'Cash-out',
    fiat: `${tx.fiat.toString()} ${tx.fiatCode}`,
    crypto: `${this.toCryptoUnits(tx.cryptoAtoms, tx.cryptoCode)} ${tx.cryptoCode}`,
    rate: `1 ${tx.cryptoCode} = ${rate} ${tx.fiatCode}`,
    address: tx.toAddress,
    txId: tx.txHash
  }

  console.log(data);
  return data;
}

Brain.prototype._printReceipt = function _printReceipt () {
  if (!this.printer) {
    console.log('[ERROR]: The kiosk printer is not loaded')
    return
  }

  const cashInCommission = BN(1).plus(BN(this.tx.commissionPercentage))

  const rate = BN(this.tx.rawTickerPrice).multipliedBy(cashInCommission).precision(2)
  const date = new Date()

  const offset = this.trader.timezone.dstOffset
  date.setMinutes(date.getMinutes() + parseInt(offset))

  const dateString = `${date.toISOString().replace('T', ' ').slice(0, 19)}`

  const data = {
    operatorInfo: this.trader.operatorInfo,
    location: deviceConfig.machineLocation,
    customer: this.customer ? this.customer.phone : 'Anonymous',
    session: this.tx.id,
    time: dateString,
    direction: this.tx.direction === 'cashIn' ? 'Cash-in' : 'Cash-out',
    fiat: `${this.tx.fiat.toString()} ${this.tx.fiatCode}`,
    crypto: `${this.toCryptoUnits(this.tx.cryptoAtoms, this.tx.cryptoCode)} ${this.tx.cryptoCode}`,
    rate: `1 ${this.tx.cryptoCode} = ${rate} ${this.tx.fiatCode}`,
    address: this.tx.toAddress,
    txId: this.tx.txHash
  }

  this.printer.checkStatus(deviceConfig.kioskPrinter, STATUS_QUERY_TIMEOUT)
    .then(() => {
      this.printer.printReceipt(data, deviceConfig.kioskPrinter)
    })
    .catch((err) => {
      console.log('[ERROR]: The kiosk printer is in an invalid state.', err)
    })
}

Brain.prototype._verifyTransaction = function _verifyTransaction () {
  if (!this.idVerify.inProgress()) return

  this.idVerify.addTransaction(this.tx)
  this.idVerify.verifyTransaction(function (err) { console.log(err) })
}

Brain.prototype._screenTimeoutHandler = function _screenTimeoutHandler (callback) {
  this.currentScreenTimeout = null
  callback()
}

Brain.prototype._screenTimeout = function _screenTimeout (callback, timeout) {
  const self = this

  if (this.currentScreenTimeout) {
    clearTimeout(this.currentScreenTimeout)
    this.currentScreenTimeout = null
  }

  this.currentScreenTimeout =
    setTimeout(function () { self._screenTimeoutHandler(callback) }, timeout)
}

Brain.prototype._timeoutToIdle = function _timeoutToIdle (timeout) {
  const self = this
  this._screenTimeout(function () { self._idle() }, timeout)
}

Brain.prototype._completed = function _completed () {
  if (this.state === 'goodbye' || this.state === 'maintenance') return
  if (this._isTestMode()) return this._testModeOff()

  this._transitionState('goodbye')

  this._screenTimeout(() => this._idle(), this.config.goodbyeTimeout)
}

Brain.prototype._machine = function _machine () {
  browserEmit({action: 'machine', machineInfo: this.config.unit})
  this._setState('machine')
}

Brain.prototype._cancelMachine = function _cancelMachine () {
  this._idle()
}

Brain.prototype._powerOffButton = function _powerOffButton () {
  const self = this
  this.wifi.clearConfig(function () {
    self._powerOff()
  })
}

Brain.prototype._abortTransaction = function _abortTransaction () {
  this._idle()
}


Brain.prototype._unpair = function _unpair () {
  if (!pairing.isPaired(this.connectionInfoPath)) return

  console.log('Unpairing')
  this.stop()
  pairing.unpair(this.connectionInfoPath)

  console.log('Unpaired. Rebooting...')
  this._setState('unpaired')
  browserEmit({action: 'unpaired'})
}


Brain.prototype._sendSecurityCode = function _sendSecurityCode (number) {
  const self = this

  return this.trader.phoneCode(number)
    .then(result => {
      this.currentPhoneNumber = number
      this.currentSecurityCode = result.code
    })
    .catch(err => {
      if (err.name === 'BadNumberError') {
        return self._timedState('badPhoneNumber')
      }

      console.log(err.stack)
      return this._fiatError(err)
    })
}


Brain.prototype.toCryptoUnits = function toCryptoUnits (cryptoAtoms, cryptoCode) {
  const unitScale = coinUtils.getCryptoCurrency(cryptoCode).unitScale 
  return cryptoAtoms.shiftedBy(-unitScale)
}


Brain.prototype._fiatError = function _fiatError (err) {
  console.log('fiatError', err)
  const state = this.tx.started ? 'fiatTransactionError' : 'fiatError'
  this._timedState(state)
  return Promise.reject(err)
}


Brain.prototype._redeem = function _redeem () {
  this.redeem = true
  this.smsCompliance()
}

Brain.prototype._fiatReceipt = function _fiatReceipt () {
  const tx = this.tx
  const toAddress = coinUtils.formatAddress(tx.cryptoCode, tx.toAddress)
  const displayTx = _.set('toAddress', toAddress, tx)

  this._timedState('fiatReceipt', {
    data: { tx: displayTx },
    timeout: 120000
  })
}

Brain.prototype.areYouSureHandled = function areYouSureHandled (action) {
  return _.includes(action, ARE_YOU_SURE_HANDLED) ||
    (_.includes(action, ARE_YOU_SURE_SMS_HANDLED) &&
      _.includes(this.complianceReason, ARE_YOU_SURE_HANDLED_SMS_COMPLIANCE))
}

Brain.prototype.areYouSure = function areYouSure () {
  this._timedState('areYouSure', { timeoutHandler: () => this.cancelTransaction() })
}

Brain.prototype.continueTransaction = function continueTransaction (previousState) {
  this._timedState(previousState)
}

Brain.prototype.cancelTransaction = function cancelTransaction (previousState, reason) {
  console.log("in cancel Transaction");
  
  this.trader.cancelTransaction(this.tx.id, reason);

  switch (previousState) {
    case 'security_code':
    case 'register_phone':
      if (this.flow) {
        this.returnState = null
        this.flow.handle('cancelPhoneNumber')
      }
      break
    default :
      this._idle()
  }
}


function determineDevicePath (path) {
  if (!path || path.indexOf('/sys/') !== 0) return path
  try {
    const files = fs.readdirSync(path)
    const device = _.find(startsWithUSB, files)
    return device ? '/dev/' + device : null
  } catch (e) {
    console.log('hub path not connected: ' + path)
    return null
  }
}



module.exports = Brain
