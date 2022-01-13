import React, { Component } from "react";
import { StyleSheet, View, TouchableOpacity, Image, Text, Alert } from "react-native";
import { withTranslation } from 'react-i18next';

const gobackIcon = require('../assets/images/icon-back-home-bg-white.png');
const actionEmitter = require('../../lib/action-emitter');

class NextButton extends Component {
  onBackButtonPress = () => {
    const {t} = this.props;

    const backAlertTitle = t('permissions:goback:title');
    const backAlertMessage = t('permissions:goback:message');
    const backAlertAction = () => actionEmitter.emit('message', {button: 'cancelTransaction'}); 

    Alert.alert(backAlertTitle, backAlertMessage, [
      {
        text: t('permissions:cancel'),
        onPress: () => null,
        style: "cancel"
      },
      { text: t('permissions:ok'), onPress: backAlertAction }
    ]);
    return true;
  };

  render() {
    const {props} = this;
    const {text, cancelText, noHomeButton } = props; 
    return (

      <>
        {!noHomeButton && 
          <TouchableOpacity onPress={this.onBackButtonPress} style={styles.backButtonContainer}>
            <Image source={gobackIcon} resizeMode="contain" style={styles.image} />  
          </TouchableOpacity>
        }
        <View style={[styles.buttonContainer, props.containerStyle, noHomeButton ? styles.centerButtonContainer : styles.rightButtonContainer]}>
        
          <TouchableOpacity style={[styles.button, props.buttonStyle]} onPress={this.props.onSelect}>
            <Text style={[styles.buttonText, props.buttonText]}>{text}</Text>
          </TouchableOpacity>

          {
            this.props.onCancel &&
            <TouchableOpacity style={[styles.button, props.buttonStyle, {marginTop:10}]} onPress={this.props.onCancel}>
              <Text style={[styles.buttonText, props.buttonText]}>{cancelText}</Text>
            </TouchableOpacity>
          }
        </View>
      </>

    );
  }
}

const styles = StyleSheet.create({

  buttonContainer: {
    position: 'absolute',
    bottom:20,
    width: '90%',
  },
  centerButtonContainer : {
    alignItems:'center',
    justifyContent:'center',
    alignSelf: 'center',
  },
  rightButtonContainer: {
   left: 80
  },
  button: {
    backgroundColor:'#FE9901',
    height: 35,
    justifyContent:'center',
    alignItems:'center',
    width:'80%'
  },
  buttonText: {
    fontFamily: "roboto-700",
    color: 'white',
    fontSize: 16,
    fontWeight:"700"
  },
  backButtonContainer: {
    position: 'absolute',
    left: 15,
    bottom: 20 
  },
  image: {
    height: 35
  }
});

export default withTranslation()(NextButton);
