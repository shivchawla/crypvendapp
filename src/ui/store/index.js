import AsyncStorage from '@react-native-async-storage/async-storage';

const storeData = async (key, value) => {
  try {
    AsyncStorage.setItem(key, value)
  } catch (e) {
    console.log(`Error saving in local storage: ${key}`);
    // saving error
  }
}

const getData = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch(e) {
    // error reading value
  }
}

const setCountry = (country) => {
  storeData("country", country);
} 

const setPrimaryLocales = (locales) => {
  storeData("locales", JSON.stringify(locales));
}

const setLocale = async (locale) => {    
  storeData("locale", locale);  
}  

const setLocaleInfo = async (data) => {
  setCountry(data.country);
  setPrimaryLocales(data.primaryLocales);
  setLocale(data.primaryLocale)  
}  

const setFiatCode = async (code) => {
  storeData("fiatCode", code);
}

const setExchangeRate = async (rates) => {
  storeData("lastRates", JSON.stringify(rates));
}

const setBuyerAddress = async (address) => {
  storeData("buyerAddress", address);
}

const setVersion = async (version) => {
  storeData("version", version);
}

const setFixedFee = async (_fee) => {
  const fee = parseFloat(_fee)

  //Locale is not a variable
  //Then how to use Locale
  storeData("fixedFee", fee > 0 ? 
      locale.translate('Transaction Fee: %s').fetch(formatFiat(fee, 2)) : '')
}

const setDirection = async (direction) => {
  storeData("direction", direction);
}

const setOperatorInfo = async (operator) => {
  if (!operator || !operator.active) {
    storeData("operator", JSON.stringify(operator))
  }
}

const setCryptomatModel = async (model) => {
  storeData("cryptomatModel", model);
}

const setCoins = async (supportedCoins) => {
  storeData("coins", JSON.stringify(supportedCoins));
}

const getCryptoCurrency = async (cryptoCode) => {
  const coins = JSON.parse(await getData("coins"));
  var cryptoCurrency = coins.find(function (c) {
    return c.cryptoCode === cryptoCode;
  });
  
  if (!cryptoCurrency) throw new Error('Unsupported crypto: ' + cryptoCode);
  return cryptoCurrency;
}

const getLocales = async () => {
  return JSON.parse(await getData('locales'));
}



//Is the static information passed every time or once
//If once, then we need to save all info to local storage

const processData = async (data) => {
  // console.log("In Process Data");
  // console.log(data);

  if (data.localeInfo) await setLocaleInfo(data.localeInfo);
  if (data.locale) {await setLocale(data.locale);};
  
  const locale = await getData("locale");
  if (!locale) {console.log("Locale is empty. Can't proceed"); return;}

  if (data.fiatCode) await setFiatCode(data.fiatCode)

  if (data.rates) await setExchangeRate(data.rates) //-- More screen operation
  

  // if (data.buyerAddress) setBuyerAddress(data.buyerAddress) -- Direct screen operations
  
  // if (data.credit) { -- Direct screen operation
  //   var lastBill = data.action === 'rejectedBill' ? null : data.credit.lastBill
  //   setCredit(data.credit.fiat, data.credit.cryptoAtoms, lastBill, data.credit.cryptoCode)
  // }

  // if (data.tx) setTx(data.tx) -- Direct screen operation
  // if (data.wifiList) setWifiList(data.wifiList) -- Not required
  // if (data.wifiSsid) setWifiSsid(data.wifiSsid) -- Not required
  // if (data.sendOnly) sendOnly(data.reason) -- Direct screen operation
  // if (data.fiatCredit) fiatCredit(data.fiatCredit) -- Direct screen operation
  // if (data.depositInfo) setDepositAddress(data.depositInfo) -- Direct screen operation
  if (data.version) await setVersion(data.version)

  // if (data.cassettes) setupCassettes(data.cassettes) -- Not required
  // if (data.sent && data.total) setPartialSend(data.sent, data.total) -- Direct screen operation
  // if (data.readingBill) readingBill(data.readingBill) -- Not required
  // if (data.cryptoCode) translateCoin(data.cryptoCode) -- Direct Screen operation
  
  // if (data.tx && data.tx.cashInFee) await setFixedFee(data.tx.cashInFee) // -- More screen operation
  
  // if (data.terms) setTermsScreen(data.terms)  -- Direct screen operation
  // if (data.dispenseBatch) dispenseBatch(data.dispenseBatch) -- What is this?
  // if (data.direction) setDirection(data.direction)
  if (data.operatorInfo) await setOperatorInfo(data.operatorInfo)
  // if (data.hardLimit) setHardLimit(data.hardLimit) -- Direct screen operation
  if (data.cryptomatModel) await setCryptomatModel(data.cryptomatModel)
  // if (data.supportedCoins) await setCoins(data.supportedCoins);
  //What to do? -- Direct on screen
  // if (data.areThereAvailablePromoCodes !== undefined) setAvailablePromoCodes(data.areThereAvailablePromoCodes)
   
   //What to do? -- Direct on screen
  // if (data.tx && data.tx.discount) setCurrentDiscount(data.tx.discount)
}


module.exports = {
  processData,
  getLocales
};