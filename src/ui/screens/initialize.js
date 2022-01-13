
import React, {Component} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { withTranslation } from 'react-i18next';

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

class Initialize extends Component {
  
  initialize = () => {
    const {navigation} = this.props;

    //Added here as intializing can take the complete thread
    navigation.navigate('status', {message: 'Initializing......', loading: true});

    actionEmitter.emit('message', {button: 'initialize'});
  }

  render() {
    const {t} = this.props;

    return (
      <AppView backButton="shutdown">
        <ScreenTitle title={t('initialize:title')} />
        <View style={styles.content}>
          <Text style={styles.bigText}>{t('initialize:message_1')}</Text>
          <Text style={styles.smallText}>{t('initialize:message_2')}</Text>
          <Text style={styles.smallText}>{t('initialize:warningMessage')}</Text>
        </View>

        <NextButton text={t('buttonText:initialize')} onSelect={this.initialize} noHomeButton={true}/>
 
      </AppView> 
    );
  }
}


const styles = StyleSheet.create({
  content: {
    color: '#fff',
    marginTop: 50,
    width: '80%'
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center'
  },
  bigText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 50,
    textAlign: 'center'

  }

});

export default withTranslation()(Initialize);