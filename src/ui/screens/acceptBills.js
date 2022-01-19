
import React, {Component} from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import {BarIndicator} from 'react-native-indicators';

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import AppView from '../components/appView';
import coins from '../coins';

console.log("Coins");
console.log(coins);

import actionEmitter from '../../lib/action-emitter';   

const errorIcon = require("../assets/images/icon-error.png");
const BN = require('../../lib/bn')


//TODO
//Get fiat Code and jsLocale from async storage;

class AcceptBills extends Component {
  
  constructor(props) {
    super(props);
    this.state = {inserted: '', deposited: ''};

    actionEmitter.on('browserEvent', (data) => {
        this.processData(data);
    });
  }

  processData(data) {
    if (data.credit) {

      var lastBill = data.action === 'rejectedBill' ? null : data.credit.lastBill
      // setCredit(data.credit.fiat, data.credit.cryptoAtoms, lastBill, data.credit.cryptoCode)
      var fiat = data.credit.fiat;
      var crypto = data.credit.cryptoAtoms;
      var cryptoCode = data.credit.cryptoCode;

      var coin = coins[cryptoCode];
      var scale = BN(10).pow(coin.displayScale);
      var cryptoAmount = BN(crypto).div(scale).toNumber();
      var cryptoDisplayCode = coin.displayCode;

      var inserted = lastBill
          ? `You inserted a ${this.formatFiat(lastBill)} bill`
          : 'Lamassu Cryptomat';
      
      // var deposited = `You deposited ${fiat} ${fiatCode}`;
      var deposited = `You deposited ${fiat} USD`;

      this.setState({inserted, deposited});
         
    }
  }

  lookupDecimalChar(localeCode) {
    var num = 1.1;
    var localized = num.toLocaleString("en-US", {
      useGrouping: true,
      maximumFractionDigits: 1,
      minimumFractionDigits: 1
    });

    return localized[1];
  }

  splitNumber(localize, localeCode) {
    var decimalChar = this.lookupDecimalChar(localeCode);
    var split = localize.split(decimalChar);

    if (split.length === 1) {
      return split[0];
    }

    return [split[0], decimalChar, split[1]].join('');
  }

  formatNumber (num) {
    var localized = num.toLocaleString("en-US", {
      useGrouping: true,
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    })

    return this.splitNumber(localized, "en-US")
  }

  formatCrypto (amount) {
    return this.formatNumber(amount)
  }

  formatFiat (amount, fractionDigits) {
    if (!fractionDigits) fractionDigits = 0

    const localized = amount.toLocaleString("en-US", {
      useGrouping: true,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits
    })
    // return this.splitNumber(localized, "en-US") + ' ' + fiatCode
    return this.splitNumber(localized, "en-US") + ' ' + 'USD';
  }

  sendCoins() {
    actionEmitter.emit('message', {button: 'sendCoins'});
  }
   
  render() {
   
    var title = "Accepting Bills";
    const {deposited, inserted} = this.state;

    console.log("Deposited: ", !!(deposited && deposited != ''));
    console.log("Inserted: ", !!(inserted && inserted != ''));

    return (
      <AppView>
        <Text style={styles.statusMessage}>{title}</Text>

        {!!deposited && (<Text style={styles.statusSubMessage}>{deposited}</Text>)} 
        {!!inserted && (<Text style={styles.statusSubMessage}>{inserted}</Text>) }

        {!!deposited && (<NextButton text="Send Coins Now" onSelect={this.sendCoins}/>)}
      </AppView> 
    );
  }
}


const styles = StyleSheet.create({
  statusMessage :{
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 25,
    marginTop:50,
    textAlign:'center'
  },

  statusSubMessage :{
    marginTop: 20,
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 16,
    width: '80%',
    textAlign: 'center'
  },
  image: {
    marginTop: 50,
    height: 50
  }
});

export default AcceptBills;
