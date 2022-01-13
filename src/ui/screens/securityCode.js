import React, {Component} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import OtpInputs from 'react-native-otp-inputs';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { withTranslation } from 'react-i18next';

import ScreenTitle from '../components/screenTitle';
import NextButton from '../components/nextButton';
import ConfirmCode from '../components/confirmCode'; 
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

class SecurityCode extends Component {
  
  constructor(props) {
    super(props);
    this.state = {codeSelected : ""};
  }        

  proceed = () => {
    const {codeSelected} = this.state;
    const {navigation, t} = this.props;
    navigation.navigate('status', {message: t('status:validatingCode') + '....', loading: true});    
    actionEmitter.emit('message', {button: 'securityCode', data:codeSelected.toString()});
  }

  cancel = () => {
    console.log("In cancel Security Code");
  }

  onCodeUpdate = (number) => {
    this.setState({codeSelected: number.toString()});
  }

  render() {
    const {t} = this.props;
    return (
      <AppView>
        <ScreenTitle title={t('securityCode:title')} />
        <KeyboardAwareScrollView contentContainerStyle={{alignItems: 'center'}} enableOnAndroid={true} extraScrollHeight={50}>
          <View style={styles.textContainer}>
            <Text style={styles.helperText}>{t('securityCode:message')}</Text>
            <ConfirmCode onCodeUpdate={this.onCodeUpdate} digits={3} containerStyle={{marginTop: 50}}/>   
          </View>
        </KeyboardAwareScrollView>

        <NextButton text={t('buttonText:next')} onSelect={this.proceed}/>

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
    fontSize: 18,
    color: 'white',
  }
});


export default withTranslation()(SecurityCode);
