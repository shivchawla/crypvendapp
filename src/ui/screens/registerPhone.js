import React, {Component} from 'react';
import { StyleSheet, Text, View} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { withTranslation } from 'react-i18next';

import PhoneInput from 'react-native-phone-input';
import CountryPicker from 'react-native-country-picker-modal';

import ScreenTitle from '../components/screenTitle';
import NextButton from '../components/nextButton';
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';

class RegisterPhone extends Component {

  constructor(props) {
    super(props)
    this.state = {countryCode: "GT", visibleModal: false, phoneInputValue: ''};
    // this.countryPicker = null;
    this.phone = null;
  }

  onPressFlag = () => {
      this.setState({visibleModal: true});
  }

  selectCountry = (country) => {
      this.phone.selectCountry(country.cca2.toLowerCase())
      this.setState({countryCode: country.cca2, visibleModal: false})
  }

  // Updates the Flag on change
  onPhoneInputChange = (value, iso2) => {
      const newState = {
          phoneInputValue: value,
      };

      if (iso2) {
          newState.countryCode = iso2?.toUpperCase();
      }

      this.setState(newState);
  }

  proceed = () => {
    const {navigation, t} = this.props;
    navigation.navigate('status', {message: t('status:sendingCode') + '....', loading: true});
   
    actionEmitter.emit('message', {button:'phoneNumber', data: this.state.phoneInputValue});
  }

  render() {
    const {t} = this.props;

    return (
        <AppView>
          <ScreenTitle title={t('registerPhone:title')} />
          <KeyboardAwareScrollView contentContainerStyle={{alignItems: 'center'}} enableOnAndroid={true} extraScrollHeight={50}>

            <View style={styles.textContainer}>
              <Text style={styles.helperText}>{t('registerPhone:message')}</Text>
            </View>

            <PhoneInput
              style={styles.phoneInputContainer}
              textStyle={styles.telephoneNumberText}
              ref={(r) => {this.phone = r}}
              onPressFlag={this.onPressFlag}
              initialCountry={'gt'}
              onChangePhoneNumber={this.onPhoneInputChange}
              textProps={{
                  placeholder: 'Enter a phone number...'
              }}
          />
        </KeyboardAwareScrollView>

          <CountryPicker
              onSelect={this.selectCountry}
              translation='eng'
              countryCode={this.state.countryCode}
              visible={this.state.visibleModal}
              withFlagButton={false}              
          />

        <NextButton text={t('buttonText:next')} onSelect={this.proceed}/>
        </AppView> 
    );
  }
}


const styles = StyleSheet.create({
  textContainer: {
    width: '90%',
    marginTop: 100,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'white',
  },
  phoneInputContainer: {
    marginTop: 100,
    width: '80%',
    marginBottom:50,
  },

  telephoneNumberText: {
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 25,
    height: 40,
  }
});

export default withTranslation()(RegisterPhone);
