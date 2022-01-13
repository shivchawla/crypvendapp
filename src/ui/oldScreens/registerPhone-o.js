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

import Header from '../components/header'
import Footer from '../components/footer'

import actionEmitter from '../../lib/action-emitter';

import PhoneInput from 'react-native-phone-input';
import CountryPicker from 'react-native-country-picker-modal';

class RegisterPhone extends Component {

	constructor(props) {
		super(props)
		this.state = {countryCode: "GT", visibleModal: false, phoneInputValue: ''};
		// this.countryPicker = null;
		this.phone = null;
	}

	onPressFlag = () => {
    	// this.countryPicker.openModal()
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
		console.log("In Register Phone Proceed");
		console.log(this.state.phoneInputValue);
		const {navigation} = this.props;
    	navigation.navigate('status', {message: 'Wait....'});
		actionEmitter.emit('message', {button:'phoneNumber', data: this.state.phoneInputValue});
	}

  	render() {
		return (
      	<View>
        	<Header title="Register Phone" goBack={false}/>
        	<View style={styles.container}>
            	<PhoneInput
                	ref={(r) => {this.phone = r}}
	                onPressFlag={this.onPressFlag}
	                initialCountry={'gt'}
	                onChangePhoneNumber={this.onPhoneInputChange}
	                textProps={{
	                    placeholder: 'Enter a phone number...'
	                }}
	            />

	            <CountryPicker
	                onSelect={this.selectCountry}
	                translation='eng'
	                countryCode={this.state.countryCode}
	                visible={this.state.visibleModal}
	            />

	        </View>

	        <Footer title="Proceed" onPress={this.proceed}/>
 
      	</View> 
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
});


export default RegisterPhone;
