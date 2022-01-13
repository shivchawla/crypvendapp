import React, {Component} from 'react';
import { StyleSheet } from "react-native";
import OtpInputs from 'react-native-otp-inputs';

class ConfirmCode extends Component {
	render() {
		const {digits} = this.props; 
		return (
			<OtpInputs
        handleChange={this.props.onCodeUpdate}
        secureTextEntry={false|| this.props.secure}
        keyboardType="decimal-pad"
        numberOfInputs={digits}
        style={[styles.container, this.props.containerStyle]}
        inputContainerStyles={[styles.inputContainer, this.props.inputContainerStyle]}
        inputStyles={[styles.inputText, this.props.inputTextStyle]}
        autofillFromClipboard={false}
			/>
		);
	}
}

const styles = StyleSheet.create({
  container: {
  	flex:1,
  	flexDirection: 'row',
  },	
  inputContainer: {
    backgroundColor: 'white',
    marginRight:5,
    width: 40,
    maxHeight: 60
  },
  inputText: {
    fontFamily: "roboto-regular",
    color: "#000",
    fontSize: 25,
    textAlign: 'center'
  }

});

export default ConfirmCode;