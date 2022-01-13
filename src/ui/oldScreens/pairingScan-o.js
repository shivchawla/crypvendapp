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

class PairingScan extends Component {
  
  cancel = () => {
    console.log("In Scan")
    actionEmitter.emit('message', {button: 'pairingCancel'});
  }

  onScanning = (totem) => {
    
    if (!this.barcodeRead) {
      this.barcodeRead = true;
      console.log("In Scanning");
      console.log(totem);
      // const {navigation} = this.props;
      // navigation.navigate('status', {message: 'Processing....'});
      actionEmitter.emit('message', {button: 'pairingScan', data:{totem}});  
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Header title="Scan QR code" goBack={false}/>

        <RNCamera
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
            {/*console.log("Bar Code detected");*/}
            {/*console.log(data);*/}
            {/*console.log(rawData);*/}
            {/*console.log(type);*/}
            this.onScanning(data);
          }}
        />
        
        {/*<View style={{flex:1}}>
          <Text>Pair with remote server</Text>
          <Text>         
            Please scan the pairing QR code you got from your remote server.
          </Text>
          
          <Footer title="Cancel" onPress={this.cancel}/>
        </View>
*/}
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

export default PairingScan;
