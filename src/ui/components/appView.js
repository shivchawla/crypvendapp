
import React, { Component } from "react";
import { StyleSheet, View, ScrollView, BackHandler, Alert } from "react-native";
import { withTranslation } from 'react-i18next';
import { AndroidBackHandler } from "react-navigation-backhandler";

const actionEmitter = require('../../lib/action-emitter');

class Appview extends Component {
  
  onBackButtonPressAndroid = () => {
    const {navigation, t, backButton} = this.props;

    const backAlertTitle = t('permissions:' + (backButton || "goback") + ':title');
    const backAlertMessage = t('permissions:' + (backButton || "goback") + ':message');
    const backAlertAction = () => { backButton == "shutdown" ? BackHandler.exitApp() : actionEmitter.emit('message', {button: 'idle'}) }; 

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
    const {back, scroll} = this.props;
    return (
      <>
      {scroll ? 
          back ? 
            <ScrollView contentContainerStyle={[this.props.noParentStyle ? {} : styles.container, this.props.style]}>
              {this.props.children}
            </ScrollView>
          :
            <AndroidBackHandler onBackPress={this.onBackButtonPressAndroid}>
              <ScrollView contentContainerStyle={[this.props.noParentStyle ? {} : styles.container, this.props.style]}>
                {this.props.children}
              </ScrollView>
          </AndroidBackHandler>
          :
          
          back ? 
            <View style={[this.props.noParentStyle ? {} : styles.container, this.props.style]}>
              {this.props.children}
            </View>
          :
          <AndroidBackHandler onBackPress={this.onBackButtonPressAndroid}>
            <View style={[this.props.noParentStyle ? {} : styles.container, this.props.style]}>
              {this.props.children}
            </View>
          </AndroidBackHandler> 
      }
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor:'#2c2dba'
  },
});

export default withTranslation()(Appview);
