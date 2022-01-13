import React, {Component} from 'react';
import { StyleSheet, Text, View, Image} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { withTranslation } from 'react-i18next';

import ScreenTitle from '../components/screenTitle';
import NextButton from '../components/nextButton';
import Instruction from '../components/instruction';
import AppView from '../components/appView';

const idPhotoIcon = require("../assets/images/icon-big-id-photo.png");
const facePhotoIcon = require("../assets/images/icon-big-face-photo.png");

import actionEmitter from '../../lib/action-emitter';   

class PhotoIdentification extends Component {

  constructor(props) {
    super(props)
    this.state = {readyToScan: false, preview: false, picture: null, err: null}
  }
  
  cancel = () => {
    const {cancelType} = this.props.route.params;
    actionEmitter.emit('message', {button: cancelType});
  }

  takePicture = async () => {

    if (this.camera) {
      // const options = { quality: 0.5, base64: true };
      let picture = null;
      let err = null;
      try {
        picture = await this.camera.takePictureAsync({quality: 0.5, base64: true, doNotSave: true});
      } catch (e) {
        err = e
      }

      this.setState({picture, preview: true, readyToScan: false, err})
    }
  }

  acceptImage = () => {
    const {navigation, t} = this.props;
    navigation.navigate('status', {message: t('status:processing') + '....'});

    const {picture} = this.state;
    const {successType} = this.props.route.params;
    actionEmitter.emit('message', {button: successType, data:{err, result:picture.base64}});
  }

  takeAgain = () => {
    this.setState({readyToScan: true, preview: false, picture: null});
  }

  render() {

    const {title, subTitle, iconType, instructionText} = this.props.route.params;
    const {readyToScan, preview, picture} = this.state;
    const {t} = this.props;
    
    return (
      <AppView noParentStyle={readyToScan || preview ? true : false}>
        {readyToScan && !preview ?
          <>
            <RNCamera
              ref={ref => {
                this.camera = ref;
              }}
              style={styles.cameraContainer}
              type={RNCamera.Constants.Type.back}
              flashMode={RNCamera.Constants.FlashMode.off}
              androidCameraPermissionOptions={{
                title: t('permissions:camera:title'),
                message: t('permissions:camera:message'),
                buttonPositive: t('permissions:ok'),
                buttonNegative: t('permissions:cancel'),
              }}
              androidRecordAudioPermissionOptions={{
                title: t('permissions:audio:title'),
                message: t('permissions:audio:message'),
                buttonPositive: t('permissions:ok'),
                buttonNegative: t('permissions:cancel'),
              }}
            />
            <NextButton 
              text={t('buttonText:takePhoto')} onSelect={this.takePicture}
              cancelText={t('buttonText:cancel')} onCancel={this.cancel} />  
          </>
          : 

          preview ? 
            <>         
            <Image source={{uri: "data:image/png;base64," + picture.base64}} resizeMode="contain" style={styles.captureImage} />
            <NextButton text={t('buttonText:accept')} onSelect={this.acceptImage} cancelText={t('buttonText:takeAgain')} onCancel={this.takeAgain}/>
            </>
          :
                        
          <>
            <ScreenTitle {...{title, subTitle}} />
            <Instruction instructionText={instructionText} icon={iconType == 'idPhoto' ? idPhotoIcon : facePhotoIcon} />
            <NextButton 
              text={t('buttonText:startScan')} onSelect={() => this.setState({readyToScan: true})}
              cancelText={t('buttonText:cancel')} onCancel={this.cancel} />
          </> 
        } 
       
      </AppView> 
    );
  }
}

const styles = StyleSheet.create({
  cameraContainer: {
    height:'100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  captureImage: {
    height: '100%',
    width: '100%'
  }
});

export default withTranslation()(PhotoIdentification);
