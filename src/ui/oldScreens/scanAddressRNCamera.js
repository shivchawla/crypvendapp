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

  onScanning = (address) => {
    if (!this.barcodeRead) {
      this.barcodeRead = true;
      console.log("In Scanning");
      console.log(address);
      const {navigation} = this.props;
      navigation.navigate('status', {message: 'Processing....'});
      actionEmitter.emit('message', {button: 'addressScan', data:{address}});  
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Header title="Scan QR code" goBack={false}/>

        {/*<RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onBarCodeRead={({ data, rawData, type }) => {
            console.log("Bar Code detected");
            console.log(data);
            {/*console.log(rawData);*/}
            {/*console.log(type);*/}
            {/*this.onScanning(data);*/}
          }}
        />*/}
        
        <View>
          <Footer title="Start Scan" onPress={this.startScan}/>
          <Footer title="Cancel" onPress={this.cancel}/>
        </View>

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
