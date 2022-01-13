
global.Buffer = require('buffer/').Buffer;
window.process = { cwd: () => '' , env: {NODE_ENV: 'development'}, version: ""};

import React, {Component} from 'react';
import Router from './src/ui/router';
import { AppState} from 'react-native';
import Keyguard from 'react-native-keyguard';

import './config-i18n';


import actionEmitter from './src/lib/action-emitter';   

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {appState: AppState.currentState, pinSuccess: false};
  }

  componentDidMount() {
    console.log("App.js - componentWillMount()")
    AppState.addEventListener("change", this._handleAppStateChange);
    actionEmitter.on('removeAppStateChange', () => {
      AppState.removeEventListener("change", this._handleAppStateChange);  
    })

    actionEmitter.on('addAppStateChange', () => {
      AppState.addEventListener("change", this._handleAppStateChange);  
    })
  }

  componentWillUnmount() {
    console.log("App.js - componentWillUnmount()")
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _proceedToPincode = (nextAppState) => {
    console.log("In Proceed to pincode");
    Keyguard
    .unlock("Enter you pin", "Are you sure?")
    .then(() => {
      console.log("Success"); 
      this.setState({appState: nextAppState});    
    })
    .catch(error => {
      console.log("Error ", err);
    })
  }

  _handleAppStateChange = (nextAppState) => {
    
    const {appState, pinSuccess} = this.state;

    console.log('Current App State: ' + appState);
    console.log('Next App State: ' + nextAppState);

    if (appState != nextAppState) {
      if (appState.match(/inactive|background/) 
            && nextAppState === 'active') {
        console.log(
          'App State: ' +
          'App has come to the foreground!'
        );

          this._proceedToPincode(nextAppState)
      }  else {
        console.log("Setting state to background");
        this.setState({appState: nextAppState});
      }
    }
  };


  render() {
    const {appState} = this.state;
    console.log("In render");
    console.log(appState);

    return (
      <Router />
    );
  }
};

export default App;


