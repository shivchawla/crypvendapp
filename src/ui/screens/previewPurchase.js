import React, { Component } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { withTranslation } from 'react-i18next';

const { utils: coinUtils } = require('lamassu-coins');

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import Instruction from '../components/instruction';
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

import TransactionDetail from "../components/transactionDetail";
const qrCodeIcon = require("../assets/images/icon-big-qr.png");

class PreviewPurchase extends Component {
  
  cancel = () => {
    console.log("In Cancel - PreviewPurchase")
  }

  proceedToScan = () => {
    actionEmitter.emit('message', {button: 'startAddressScan'});   
  }

  render() {
    const {tx, nextStep} = this.props.route.params;
    const {t} = this.props;

    return (

      <AppView>
        <ScreenTitle title={t('previewPurchase:title')}/>
        <TransactionDetail {...{tx}} text={t('previewPurchase:message')} style={{height: '60%'}}/>
        <NextButton text={t('buttonText:proceedScan')} onSelect={this.proceedToScan}/>
      </AppView>
    );
  }
}

const styles = StyleSheet.create({
  whiteContainer: {
    width: '80%',
    height: '70%',
    backgroundColor: "#E6E6E6",
    marginTop: 50,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: "roboto-700",
    color: "#121212",
    textAlign: "center",
    fontSize: 16,
    marginTop: 80,
    width:'90%',
    fontWeight: '700'
  }
});

export default withTranslation()(PreviewPurchase);
