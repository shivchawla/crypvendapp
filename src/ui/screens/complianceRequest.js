
import React, {Component} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { withTranslation } from 'react-i18next';

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

class ComplianceRequest extends Component {
  
  proceed = () => {
    const {requestType} = this.props.route.params;
    actionEmitter.emit('message', {button: requestType});
  }

  render() {
    const {title, subTitle, message} = this.props.route.params;
    const {t} = this.props;
    
    return (
      <AppView>
        <ScreenTitle {...{title, subTitle}} />
        
        <Text style={styles.helperText}>{message}</Text>

        <NextButton text={t('buttonText:proceed')} onSelect={this.proceed}/>
 
      </AppView> 
    );
  }
}

const styles = StyleSheet.create({
  helperText : {
    marginTop: '30%',
    color: 'white',
    width: '80%',
    textAlign  : 'center',
    fontSize: 18
  }
});

export default withTranslation()(ComplianceRequest);