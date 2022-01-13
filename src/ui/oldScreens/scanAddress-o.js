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

import { RNCamera } from 'react-native-camera';

import Header from '../components/header'
import Footer from '../components/footer'
import actionEmitter from '../../lib/action-emitter';   
import PosDeviceSdk from 'react-native-pos-device-sdk';

class ScanAddress extends Component {
  
  cancel = () => {
    console.log("In Cancel Scan")
    actionEmitter.emit('message', {button: 'cancelScan'});
  }

  startScan = () => {
    return PosDeviceSdk.startScan()
    .then(address => {
      console.log("In Scanning");
      console.log(address);
      const {navigation} = this.props;
      navigation.navigate('status', {message: 'Processing....'});
      actionEmitter.emit('message', {button: 'addressScan', data:{address}});
    })
    .catch(err => {
      console.log(err);
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <Header title="Scan QR code" goBack={false}/>
        <Footer title="Start Scan" onPress={this.startScan}/>
        <Footer title="Cancel" onPress={this.cancel}/>
      </View> 
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    // height: 300
  },
  preview: {
    // flex: 1,
    height:300,
    // justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default ScanAddress;
