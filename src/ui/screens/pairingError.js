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

class PairingError extends Component {
  
  scan = () => {
    console.log("In Scan")
    actionEmitter.emit('message', {button: 'pairingScan'});
  }

  render() {
    return (
      <View>
        <Header title="Pairing Error" goBack={false}/>
        <View>
          <Text>Pairing Failed</Text>
          <Text>         
            When attempting to pair, we experienced an error:
          </Text>
          
          <Footer title="Try Again" onPress={this.scan}/>
        </View> 
      </View> 
    );
  }
}

export default PairingError;
