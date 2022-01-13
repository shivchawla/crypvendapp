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

class EnterFiat extends Component {
  
  constructor(props) {
    super(props);
    this.state = {fiatSelected : ""};
  }        

  proceed = () => {
    console.log("Proceed to accept cash/credit")
    console.log(this.state);
    const {fiatSelected} = this.state;
    const {navigation} = this.props;
    navigation.navigate('status', {message: 'Checking Limits....'});

    const {reason} = this.props.route.params; 
    actionEmitter.emit('message', {button: 'fiatValidate', data:{denomination: fiatSelected.toString(), reason}});
  }

  cancel = () => {
    console.log("In cancel Fiat");
  }

  onFiatUpdate = (number) => {
    console.log("On Fiat Update");
    console.log(number);
    this.setState({fiatSelected: number.toString()});
  }

  render() {
    return (
      <View style={styles.container}>
        <Header title="Enter Fiat Amount" goBack={false}/>

        <TextInput
          style={styles.input}
          onChangeText={this.onFiatUpdate}
          value={this.state.fiatSelected}
          placeholder="0"
          keyboardType="numeric"
        />
        
        <View>
          <Text>Add amount to purchase</Text>
          
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

export default EnterFiat;
