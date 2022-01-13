
import React, {Component} from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import {BarIndicator} from 'react-native-indicators';

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

const errorIcon = require("../assets/images/icon-error.png");


class Status extends Component {
  
  proceed = (state) => {
    actionEmitter.emit('message', {button: state || 'idle'});
  }
   
  render() {
    const {message, subMessages, error = false, nextStep, loading = true} = this.props.route.params;
    return (
      <AppView>
          {error && 
            <Image
              source={errorIcon  }
              resizeMode="contain"
              style={styles.image}
            />
          }
          <Text style={styles.statusMessage}>{message}</Text>

          {subMessages && subMessages.length > 0 &&
            subMessages.map((value, index) => {
              return <Text key={index} style={styles.statusSubMessage}>{value}</Text>
            })
          }
          {loading && <BarIndicator color='white' />}
          {nextStep && <NextButton noHomeButton={true} text={nextStep.buttonText} onSelect={() => this.proceed(nextStep.state)}/>}        
      </AppView> 
    );
  }
}


const styles = StyleSheet.create({
  statusMessage :{
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 25,
    marginTop:50,
    textAlign:'center'
  },

  statusSubMessage :{
    marginTop: 20,
    fontFamily: "roboto-regular",
    color: "rgba(255,255,255,1)",
    fontSize: 16,
    width: '80%',
    textAlign: 'center'
  },
  image: {
    marginTop: 50,
    height: 50
  }
});

export default Status;
