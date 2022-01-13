import React, {Component} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  TouchableHighlight
} from 'react-native';


import Header from '../components/header'
import Footer from '../components/footer'
import actionEmitter from '../../lib/action-emitter';   

class SecurityCode extends Component {
  
  constructor(props) {
    super(props);
    this.state = {codeSelected : ""};
  }        

  proceed = () => {
    const {codeSelected} = this.state;
    const {navigation} = this.props;
    navigation.navigate('status', {message: 'Validating Security Code....'});    
    actionEmitter.emit('message', {button: 'securityCode', data:codeSelected.toString()});
  }

  cancel = () => {
    console.log("In cancel Security Code");
  }

  onCodeUpdate = (number) => {
    console.log("On Code Update");
    console.log(number);
    this.setState({codeSelected: number.toString()});
  }

  render() {
    return (
      <View style={styles.container}>
        <Header title="Security Code" goBack={false}/>

        <TextInput
          style={styles.input}
          onChangeText={this.onCodeUpdate}
          value={this.state.codeSelected}
          placeholder="0"
          keyboardType="numeric"
        />
        
        <View>
          <Text>We've texted you a security code. When you get it, enter it here.</Text>
          <Footer title="Proceed" onPress={this.proceed}/>
          {/*<Footer title="Cancel" onPress={this.cancel}/>*/}
        </View>

      </View> 
    );
  }
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
  },
});

export default SecurityCode;
