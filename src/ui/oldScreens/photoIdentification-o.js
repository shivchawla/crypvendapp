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

class PhotoIdentification extends Component {
  
  cancel = () => {
    console.log("In ID scan cancel")
    const {cancelType} = this.props.route.params;
    actionEmitter.emit('message', {button: cancelType});
  }

  takePicture = async () => {
    console.log("In Take Picture")

    if (this.camera) {
      // const options = { quality: 0.5, base64: true };
      let picture = null;
      let err = null;
      try {
        picture = await this.camera.takePictureAsync({quality: 0.5, base64: true, doNotSave: true});
      } catch (e) {
        err = e
      }

      // console.log(picture);

      const {navigation} = this.props;
      navigation.navigate('status', {message: 'Processing....'});

      const {successType} = this.props.route.params;
      actionEmitter.emit('message', {button: successType, data:{err, result:picture.base64}});
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Header title="Scan Identification Document" goBack={false}/>

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
        />
        

        <Footer title="Take Photo" onPress={this.takePicture}/>
        {/*<Footer title="Cancel" onPress={this.cancel}/>*/}
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
  },
  preview: {
    // flex: 1,
    height:'80%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default PhotoIdentification;
