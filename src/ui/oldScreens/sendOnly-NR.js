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

class Sendonly extends Component {
  
  goback = () => {
    console.log("In Go Back")
    actionEmitter.emit('message', {button: 'idle'});
  }

  render() {
    const {errorTitle, errorMessage} = this.props.route.params;
    return (
      <View>
        <Header title="Error" goBack={false}/>
        <View>
          <Text>{errorTitle}</Text>

          {errorMessage && 
            <Text>{errorMessage}</Text>
          }
          
          <Footer title="Try Later" onPress={this.goback}/>
        </View> 
      </View> 
    );
  }
}

export default Sendonly;
