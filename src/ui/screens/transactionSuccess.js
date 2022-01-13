
import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";
import { withTranslation } from 'react-i18next';

import PosDeviceSdk from 'react-native-pos-device-sdk';
import actionEmitter from '../../lib/action-emitter';   

import DisplayCoin from '../components/displayCoin'; 
import ScreenTitle from '../components/screenTitle';
import TransactionDetail from '../components/transactionDetail';
import NextButton from '../components/nextButton';
import AppView from '../components/appView';

const successIcon = require('../assets/images/icon-success.png');

class TransactionSuccess extends Component {

  startAgain = () => {
    actionEmitter.emit('message', {button: 'idle'});
  }

  printReceipt = () => {
    const {receipt} = this.props.route.params;
    console.log(receipt);
    return PosDeviceSdk.printReceipt(JSON.stringify(receipt))
    .then(success => {
        return this.startAgain();
    })
    .catch(error => {
      const {navigation, t} = this.props;
      this.navigation.navigate('status', {
        error: true, loading: false, message: t('errorMessage:printingError:title'),
        subMessages: [t('errorMessage:printingError:message')]
      });
    })
  }
   
  render() {
    const {tx} = this.props.route.params;
    const {t} = this.props;

    return (
      <AppView style={styles.container}>
        <Image
          source={successIcon}
          resizeMode="contain"
          style={styles.image}
        />
        <Text style={styles.headerText}>{t('transactionSuccess:title')}</Text>
        <TransactionDetail {...{tx}} showId={true} style={{height: '50%', marginTop: 30}}/>
        <NextButton 
          noHomeButton={true}
          text={t('buttonText:printReceipt')} 
          onSelect={this.printReceipt} 
          cancelText={t('buttonText:newTransactin')}
          onCancel={this.startAgain}/>        
      </AppView> 
    );
  }
}

const styles = StyleSheet.create({
  headerText: {
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 18,
    marginTop: 20
  },
  
  image: {
    height: 75,
    width: 75,
    marginTop: 30
  }
});

export default withTranslation()(TransactionSuccess);
