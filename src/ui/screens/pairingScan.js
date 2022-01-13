import React, {Component} from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { withTranslation } from 'react-i18next';

import PosDeviceSdk from 'react-native-pos-device-sdk';

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import Instruction from "../components/instruction";
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

const qrCodeIcon = require("../assets/images/icon-big-qr.png");
const pairingScanHelperText = "Press SCAN and present the machine with the pairing QR code from your remote server.";

class PairingScan extends Component {
  
  startScan = () => {

    return PosDeviceSdk.startScan()
    .then(totem => {
      const {navigation, t} = this.props;
      navigation.navigate('status', {message: t('status:pairing') + '....', loading: true});

      actionEmitter.emit('message', {button: 'pairingScan', data:{totem}});  
    })
    .catch(err => {
      console.log(err);
    })
  }

  render() {
    const {t} = this.props;

    return (
      <AppView backButton="shutdown">
        <ScreenTitle title={t('pairingScan:title')} />
        <Instruction instructionText={t('pairingScan:message')} icon={qrCodeIcon} />
        <NextButton text={t('buttonText:startScan')} onSelect={this.startScan} noHomeButton={true}/>
      </AppView> 
    );
  }
}


const styles = StyleSheet.create({
});

export default withTranslation()(PairingScan);
