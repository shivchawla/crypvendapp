const _ = require('lodash/fp')
const uuid = require('uuid')

const BN = require('./bn')
const { utils: coinUtils } = require('lamassu-coins')
// const BillMath = require('./bill_math')

const DECIMAL_PLACES = 3

// const coins = coinUtils.coins

// This function rounds precision so that the displayed amount matches
// amount actually sent.
function truncateCrypto (cryptoAtoms, cryptoCode) {

  // console.log("truncateCrypto");
  // console.log(cryptoAtoms);

  if (cryptoAtoms.eq(0)) return cryptoAtoms

  const scale = coinUtils.getCryptoCurrency(cryptoCode).displayScale
  const scaleFactor = BN(10).pow(scale)

  // console.log("BN Crypto Atoms")
  // console.log(BN(cryptoAtoms));

  //In newer version of BN librarary, truncated is not supported
  // return BN(cryptoAtoms).truncated().div(scaleFactor)
  //   .precision(DECIMAL_PLACES).times(scaleFactor)

  return BN(cryptoAtoms).integerValue().div(scaleFactor)
    .precision(DECIMAL_PLACES).times(scaleFactor)    
}

function mergeTx (oldTx, updateTx) {
  // console.log("in Merge Tx");
  // console.log("Old Tx");
  // console.log(oldTx);
  // console.log("Update Tx");
  // console.log(updateTx);

  const bills = _.unionBy(_.get('id'), oldTx.bills, updateTx.bills)
  const cryptoCode = oldTx.cryptoCode
  const mergedTx = _.defaults(oldTx, updateTx)
  const cashInFee = mergedTx.cashInFee ? BN(mergedTx.cashInFee) : BN(0)

  const cashInNewFields = () => ({
    bills,
    fiat: updateTx.fiat ? oldTx.fiat.plus(updateTx.fiat) : oldTx.fiat,
    cryptoAtoms: truncateCrypto(
      _.reduce((acc, v) => acc.plus(toCrypto(mergedTx, BN(v.fiat - v.cashInFee))), BN(0), bills),
      cryptoCode),
    cashInFeeCrypto: truncateCrypto(toCrypto(mergedTx, cashInFee), cryptoCode)
  })

  const cashOutNewFields = () => ({
    fiat: oldTx.fiat.plus(updateTx.fiat || 0),
    cryptoAtoms: truncateCrypto(toCrypto(mergedTx, oldTx.fiat.plus(updateTx.fiat || 0)), cryptoCode)
  })

  var newFields
  if (oldTx.direction === 'cashIn') {
    newFields = cashInNewFields()
  } else if (oldTx.direction === 'cashOut') {
    newFields = cashOutNewFields()
  }

  return _.assignAll([oldTx, updateTx, newFields])
}

function getExchangeRate (tx) {
  const cryptoCode = tx.cryptoCode
  const rates = getRates(tx)
  const exchangeRate = rates[cryptoCode][tx.direction]
  const unitScale = coinUtils.getCryptoCurrency(cryptoCode).unitScale
  const unitScaleFactor = BN(10).pow(unitScale)

  return exchangeRate.div(unitScaleFactor)
}

function toCrypto (tx, value) {
  return truncateCrypto(value.div(getExchangeRate(tx)), tx.cryptoCode)
}

function getRates (tx) {
  const cryptoCode = tx.cryptoCode
  const direction = tx.direction
  const tickerPrice = tx.rawTickerPrice ? BN(tx.rawTickerPrice) : BN(0)
  const discount = getDiscountRate(tx.discount, tx.commissionPercentage)

  const rates = cryptoCode ? {
    [cryptoCode]: {
      [direction]: (direction === 'cashIn')
        ? tickerPrice.multipliedBy(discount).precision(5)
        : tickerPrice.div(discount).precision(5)
    }
  } : {}

  return convertToBN(rates)
}

function convertToBN (rates) {
  return _.mapValues(_.mapValues(
    function toBN (obj) {
      try {
        return BN(obj)
      } catch (__) {
        return obj
      }
    }), rates)
}

function getDiscountRate (discount, commissionPercentage) {
  const discountBN = discount ? BN(discount) : BN(0)
  const percentageCommissionBN = commissionPercentage ? BN(commissionPercentage) : BN(0)
  const percentageDiscount = BN(1).minus(discountBN.div(100))
  return BN(1).plus(percentageDiscount.multipliedBy(percentageCommissionBN))
}

function isBillsEq (a, b, k) {
  const required = ['id', 'cryptoCode', 'fiat', 'cryptoAtoms']
  if (_.isNumber(k)) return _.some(f => _.isEmpty(_.get(f, a)), required) ? false : undefined

  switch (k) {
    case 'fiat':
    case 'cryptoAtoms':
      return a.eq(b)
    case undefined:
      return a.length === b.length ? undefined : false
    default:
  }
}

function isTxEq (a, b, k) {
  switch (k) {
    case 'bills':
      return _.isEqualWith(isBillsEq, a, b)
    case 'fiat':
    case 'cryptoAtoms':
      return a.eq(b)
    case undefined:
      return _.some(f => _.isEmpty(_.get(f, a)), ['id']) ? false : undefined
    default:
  }
}

function eq (a, b) {
  return _.isEqualWith(isTxEq, a, b)
}

function update (oldTx, updateTx) {
  const newTx = mergeTx(oldTx, updateTx)
  const dirty = newTx.dirty || !eq(oldTx, newTx)
  const txVersion = newTx.txVersion + 1

  return _.assign(newTx, {dirty, txVersion})
}

function billUpdate (bill) {
  if (!bill) return {}

  return {
    fiat: bill.fiat,
    bills: [bill]
  }
}

function billUpdateDeprecated (bill) {
  if (!bill) return {}

  return {
    cryptoAtoms: bill.cryptoAtoms,
    fiat: bill.fiat,
    bills: [bill]
  }
}

function createBill (bill, tx) {

  console.log("In create bill");

  const applyCashInFee = _.isEmpty(tx.bills)
  const fiatCode = tx.fiatCode
  const cashInFee = applyCashInFee ? tx.cashInFee : BN(0)
  const deviceTime = Date.now()

  console.log("Creating Bill");

  return {
    id: uuid.v4(),
    fiat: BN(bill),
    fiatCode,
    cryptoCode: tx.cryptoCode,
    cashInFee,
    cashInTxsId: tx.id,
    deviceTime
  }
}

function createBillDeprecated (bill, exchangeRate, tx) {

  console.log("in createBillDeprecated");
  console.log(bill);
  console.log(exchangeRate);
  console.log(tx);


  const applyCashInFee = _.isEmpty(tx.bills)
  const cryptoCode = tx.cryptoCode
  const unitScale = coinUtils.getCryptoCurrency(cryptoCode).unitScale
  const unitScaleFactor = BN(10).pow(unitScale)
  const atomRate = exchangeRate.div(unitScaleFactor)
  const fiatCode = tx.fiatCode
  const cashInFee = applyCashInFee ? tx.cashInFee : BN(0)
console.log("Truncatinggggg - 1");
console.log("Atom Rate");
console.log(atomRate);
  const cashInFeeCrypto = truncateCrypto(cashInFee.div(atomRate), cryptoCode)

console.log("Truncatinggggg - 2");
  const cryptoAtoms = truncateCrypto(BN(bill).div(atomRate), cryptoCode)

  console.log("Truncatinggggg");

  //In newer version of BN librarary, sub is not supported
  // const cryptoAtomsAfterFee = truncateCrypto(cryptoAtoms.sub(cashInFeeCrypto), cryptoCode)
  const cryptoAtomsAfterFee = truncateCrypto(cryptoAtoms.minus(cashInFeeCrypto), cryptoCode)

  const deviceTime = Date.now()

  return {
    id: uuid.v4(),
    fiat: BN(bill),
    fiatCode,
    cryptoAtoms,
    cryptoAtomsAfterFee,
    cryptoCode,
    cashInFee,
    cashInFeeCrypto,
    cashInTxsId: tx.id,
    deviceTime
  }
}

function computeCashOut (tx, cassettes, virtualCassettes, txLimit) {
  const denominationIsAvailable = denom =>
    !!BillMath.makeChange(cassettes, tx.fiat.plus(denom))

  const denominationUnderLimit = denom => BN(denom).lte(txLimit)

  const denominationIsActive = _.overEvery([denominationUnderLimit, denominationIsAvailable])
  const denoms = _.union(virtualCassettes, _.map(_.get('denomination'), cassettes))
  const activeMap = _.zipObject(denoms.map(r => r.toNumber()), _.map(denominationIsActive, denoms))
  const noMore = !_.some(_.identity, _.values(activeMap))
  const txLimitReached = noMore && _.some(denominationIsAvailable, denoms)
  const isEmpty = noMore && !txLimitReached

  return {isEmpty, txLimitReached, activeMap}
}

function addCash (denomination, tx) {
  const fiat = BN(denomination)

  return update(tx, { fiat })
}

function addCashDeprecated (denomination, exchangeRate, tx) {
  const cryptoCode = tx.cryptoCode
  const unitScale = coinUtils.getCryptoCurrency(cryptoCode).unitScale
  const unitScaleFactor = BN(10).pow(unitScale)
  const fiat = BN(denomination)
  const cryptoAtoms = truncateCrypto(fiat.div(exchangeRate).multipliedBy(unitScaleFactor), cryptoCode)

  return update(tx, { fiat, cryptoAtoms })
}

function newTx () {
  return {
    id: uuid.v4(),
    fiat: BN(0),
    cryptoAtoms: BN(0),
    bills: [],
    dirty: true,
    termsAccepted: false,
    txVersion: 0
  }
}

module.exports = {
  newTx,
  update,
  billUpdate,
  billUpdateDeprecated,
  createBill,
  createBillDeprecated,
  eq,
  truncateCrypto,
  toCrypto,
  addCash,
  addCashDeprecated,
  computeCashOut,
  getRates
}
