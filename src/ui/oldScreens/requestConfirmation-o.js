
import React, {Component} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  TouchableHighlight
} from 'react-native';

import Header from '../components/header'
import Footer from '../components/footer'

import actionEmitter from '../../lib/action-emitter';   

import Keyguard from 'react-native-keyguard';
import PosDeviceSdk from 'react-native-pos-device-sdk';

class RequestConfirmation extends Component {

  constructor(props) {
    super(props)
    this.state = {paymentMethod: ''};
  }
  
  proceedToSend = (paymentData) => {
    console.log("In Final Proceed to send");
    actionEmitter.emit('message', {button: 'finalizeSale'});
    const {navigation} = this.props;
    navigation.navigate('status', {message: 'Sending Coins....'});
  }

  proceedToPincode = () => {
    console.log("In Proceed to pincode");
    actionEmitter.emit('removeAppStateChange');

    Keyguard
    .unlock("Enter you pin", "Are you sure?")
    .then(() => {
      actionEmitter.emit('removeAppStateChange');
      console.log("Success"); 
      this.proceedToSend();
    })
    .catch(error => {
      const {navigation} = this.props;
      navigation.navigate('status', {error: true, message: "Authentication Error", nextStep: "idle"});
    })
    .finally(() => {
      actionEmitter.emit('addAppStateChange');
    })
  }

  proceedToAcceptCard = () => {
    console.log("In CheckCard - starting process");
    
    return PosDeviceSdk.checkCard()
    .then(cardData => {
      console.log("In Check Card - success");
      console.log(cardData);
      // const {navigation} = this.props;
      // navigation.navigate('status', {message: 'Processing....'});
      // actionEmitter.emit('message', {button: 'addressScan', data:{address}});
    })
    .catch(err => {
      console.log(err);
    })
  }

  render() {
    const {bill} = this.props.route.params;
    console.log("Bill")
    console.log(bill);

    console.log("In Render");
    console.log(this.state);
    const  {paymentMethod} = this.state;
    const headerMessage = paymentMethod == '' ? 'Select Payment method' :  
            paymentMethod == 'cash' ?  'Payment Confirmation' : 'Swipe Card';

    const cash = `${bill.fiat} ${bill.fiatCode}`;

    return (
      <View style={{flex:1}}>
        <Header title={headerMessage} goBack={false}/>

        {paymentMethod == '' &&
          <>
          <Footer title="Cash" onPress={() => this.setState({paymentMethod: 'cash'})} />
          <Footer title="Credit"  onPress={() => this.setState({paymentMethod: 'credit'})} />
          </>
        }

        {paymentMethod == 'cash' &&
          <>
          <View>
            <Text>Have you received cash: {cash}</Text>
          </View>

          <Footer title="Are you sure" onPress={this.proceedToPincode} />
          </>
        }

        {
          paymentMethod == 'credit' &&
          <Footer title="Swipe Card" onPress={this.proceedToAcceptCard} />
        }

      </View> 
    );
  }
}

export default RequestConfirmation;