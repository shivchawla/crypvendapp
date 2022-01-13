import React, { Component } from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { withTranslation } from 'react-i18next';

import PosDeviceSdk from 'react-native-pos-device-sdk';
import actionEmitter from '../../lib/action-emitter';   

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import DisplayCoin from "../components/displayCoin";
import Instruction from '../components/instruction';

import AppView from '../components/appView';

const qrCodeIcon = require("../assets/images/icon-big-qr.png");

class ScanAddress extends Component {

  constructor(props) {
    super(props);
    this.state = {preview: false, address: ""};
  }
  
  cancel = () => {
    // console.log("In Cancel Scan")
    actionEmitter.emit('message', {button: 'cancelScan'});
  }

  startScan = () => {
    const address = "1LEBU9C6y2MaMmuTtJbDDCWpEJxTaT8Dt1";
    actionEmitter.emit('message', {button: 'addressScan', data:{address}});
    return;

    return PosDeviceSdk.startScan()
    .then(address => {
      const {navigation} = this.props;
      navigation.navigate('status', {message: t('status:validatingAddress') + '....', loading: true});

      // console.log("In Scanning");
      // console.log(address);
      actionEmitter.emit('message', {button: 'addressScan', data:{address}});

    })
    .catch(err => {
      console.log(err);
    })
  }

  render() {
    const {preview, address} = this.state;
    const {t} = this.props;

    return (
      <AppView>
        <ScreenTitle title={t('scanAddress:title')}/>
        <Instruction instructionText={t('scanAddress:message')} icon={qrCodeIcon} />
        <NextButton text={t('buttonText:startScan')} onSelect={this.startScan}/>
      </AppView>
    );
  }
}

const styles = StyleSheet.create({
});

export default withTranslation()(ScanAddress);
