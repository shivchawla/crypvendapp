import React, {Component} from 'react';
import { StyleSheet, Text, View, BackHandler} from 'react-native';
import Keyguard from 'react-native-keyguard';
import PosDeviceSdk from 'react-native-pos-device-sdk';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { withTranslation } from 'react-i18next';
import {BarIndicator} from 'react-native-indicators';

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import TransactionDetail from '../components/transactionDetail';
import Instruction from '../components/instruction';
import ConfirmCode from '../components/confirmCode';
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

const creditCardIcon = require("../assets/images/icon-big-credit-card.png");

class RequestConfirmation extends Component {
  constructor(props) {
    super(props)
    this.state = {reviewComplete: false, cvvScreen: false, cardData: null, processAgain: false, numAttempts: 0, loading: false};
  }
 
  proceedToSend = () => {
    const {cardData} = this.state;

    const {navigation, t} = this.props;
    navigation.navigate('status', {message: t('status:sendingCoins') + '....', loading: true});

    const fData = {
      nameCard: ((cardData["track1"] || "").split("^")[1] || "").trim().split("/").reverse().join(" "),
      accountNumber: cardData["PAN"],
      expirationMonth: cardData["expDate"].slice(-2),
      expirationYear: cardData["expDate"].slice(0,2),
      CVVCard: cardData.cvv
    };

    actionEmitter.emit('message', {button: 'finalizeSale', data: fData});
  }

  proceedToPincode = () => {
    actionEmitter.emit('removeAppStateChange');

    Keyguard
    .unlock("Enter you pin", "Are you sure?")
    .then(() => {
      actionEmitter.emit('removeAppStateChange');
      this.proceedToSend();
    })
    .catch(error => {
      const {navigation} = this.props;
      navigation.navigate('status', {error: true, message: "Authentication Error", nextStep: "idle", loading: false});
      //Do we need to force exit?
      // BackHandler.exitApp()
    })
    .finally(() => {
      actionEmitter.emit('addAppStateChange');
    })
  }

  onReview = () => {
    this.setState({reviewComplete: true}, () => this.proceedToAcceptCard());
  }

  proceedToAcceptCard = () => {
    return PosDeviceSdk.checkCard()
    .then(data => {
      this.setState({loading: true});

      const ccData =  JSON.parse(data);

      const {numAttempts} = this.state;

      if (ccData["PAN"] == '' || ccData["expDate"] == '') {
        if (numAttempts < 3) {
          this.setState({processAgain: true, numAttempts: numAttempts + 1, loading: false}, () => this.proceedToAcceptCard())
        } else {
          const {navigation} = this.props;
          navigation.navigate('status', {error: true, message: "Authentication Error", nextStep: "idle", loading: false});
        } 
      } else {
        this.setState({cardData: ccData, cvvScreen: true, loading: false})
      }
    })
    .catch(err => {
      console.log(err);
    })
  }

  onCodeUpdate = (cvv) => {
    const {cardData} = this.state;
    this.setState({cardData: {...cardData, cvv}})
  }

  render() {
    const {tx} = this.props.route.params;
    const {reviewComplete, cvvScreen, processAgain, loading} = this.state;
    const {t} = this.props;

    const headerMessage = cvvScreen ? t('requestConfirmation:cvvScreen:title') :  
            reviewComplete ? (processAgain ?  t('requestConfirmation:creditCardAgain:title') : t('requestConfirmation:creditCard:title') ) : t('requestConfirmation:review:title');

    return (
      <AppView>
        <ScreenTitle title={headerMessage} />

        {!reviewComplete &&
          <>
          <TransactionDetail {...{tx}} text={t('requestConfirmation:review:message')} style={{height:'65%'}}/>
          <NextButton text={t('buttonText:proceedPay')} onSelect={this.onReview} />
          </>
        }

        {reviewComplete && !processAgain && !cvvScreen &&
          <>
          <Instruction instructionText={t('requestConfirmation:creditCard:message')} icon={creditCardIcon} />
          {loading && <BarIndicator color='white' />}
          </>
        }

        {reviewComplete && processAgain && !cvvScreen &&
          <>
          <Instruction instructionText={t('requestConfirmation:creditCardAgain:message')} icon={creditCardIcon} />
          {loading && <BarIndicator color='white' />}
          </>
        }

        {reviewComplete && cvvScreen &&
          <>
          <KeyboardAwareScrollView contentContainerStyle={{alignItems: 'center'}} enableOnAndroid={true} extraScrollHeight={50}>
            <View style={styles.textContainer}>
              <Text style={styles.helperText}>{t('requestConfirmation:cvvScreen:message')}</Text>
              <ConfirmCode secure={true} digits={3} onCodeUpdate={this.onCodeUpdate} containerStyle={{marginTop:50}}/>
            </View>
          </KeyboardAwareScrollView>
          <NextButton text={t('buttonText:confirmPay')} onSelect={this.proceedToPincode}/>
          </>
        }

      </AppView> 
    );
  }
}

const styles = StyleSheet.create({
  textContainer: {
    marginTop: 100,
    alignItems: 'center',
    width:'90%'
  },
  helperText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
  }
});

export default withTranslation()(RequestConfirmation);