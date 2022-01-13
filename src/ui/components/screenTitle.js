import React, { Component } from "react";
import { StyleSheet, View, TouchableOpacity, Text, Image, Alert} from "react-native";
import { withTranslation } from 'react-i18next';

const gobackIcon = require('../assets/images/icon-back-home-white.png');
const actionEmitter = require('../../lib/action-emitter');

class ScreenTitle extends Component {

  onBackButtonPress = () => {
    const {t} = this.props;

    const backAlertTitle = t('permissions:goback:title');
    const backAlertMessage = t('permissions:goback:message');
    const backAlertAction = () => actionEmitter.emit('message', {button: 'idle'}); 

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
    const {title, subTitle, hasBackButton} = this.props;

    return (
      <>
      {hasBackButton && 
        <TouchableOpacity onPress={this.onBackButtonPress} style={styles.backButtonContainer}>
          <Image source={gobackIcon} resizeMode="contain" style={styles.image} />  
        </TouchableOpacity>
      } 

      <View style={[styles.titleContainer, this.props.titleContainerStyle]}>
        
        <Text style={[styles.title, this.props.titleStyle]}>{title}</Text>

        {subTitle && <Text style={styles.subTitle}>{subTitle}</Text>}
      </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  titleContainer: {
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',  
    width:'90%'  
  },
  title: {
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 25,
    textAlign:'center'
  },
  subTitleContainer: {
    flexDirection: "row",
  },
  subTitle: {
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 18,
    textAlign:'center'
  },
  backButtonContainer: {
    position: 'absolute',
    left: 10,
    top: 35 
  },
  image: {
    height: 25
  }
});

export default withTranslation()(ScreenTitle);
