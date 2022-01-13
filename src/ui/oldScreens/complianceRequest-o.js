
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

class ComplianceRequest extends Component {
  
  proceed = () => {
    console.log("In Compliance Proceed");
    const {requestType} = this.props.route.params;
    actionEmitter.emit('message', {button: requestType});
  }

  render() {
    const {title, message} = this.props.route.params;
    return (
      <View>
        <Header title="Compliance Request" goBack={false}/>
        <View>
          <Text>{title}</Text>
          <Text>{message}</Text>
        </View>

        <Footer title="Proceed" onPress={this.proceed}/>
 
      </View> 
    );
  }
}

export default ComplianceRequest;