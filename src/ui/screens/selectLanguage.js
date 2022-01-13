import React, { Component } from "react";
import { StyleSheet, View} from "react-native";
import { withTranslation } from 'react-i18next';

import Language from '../components/language'; 
import ScreenTitle from '../components/screenTitle';
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

class SelectLanguage extends Component  {

  constructor(props) {
    super(props) 
    const {i18n} = props;
    console.log("In Select Language Constructor");
    console.log("Current Language", i18n.language);
    this.state = {currentLocale: i18n.language};
  }
  onSelectLanguage = (locale) => {
    const {i18n} = this.props;
    //In the brain side, it triggers idle after updating the locale
    this.setState({currentLocale: locale}, () => {
      actionEmitter.emit('message', {button: 'setLocale', data:{locale}});
      i18n.changeLanguage(locale);  
    })
  }

  render() {
    const {t} = this.props;
    const {locales} = this.props.route.params;
    const {currentLocale} = this.state;

    return (
      <AppView>
        <ScreenTitle {...{title: t('selectLanguage:title')}}/>
        <View style={styles.allLanguageContainer}>
          {locales && 
            locales.map((locale, index) => { 
              return <Language selected={locale == currentLocale} key={locale} {...{locale}} onSelect={() => this.onSelectLanguage(locale)}/> 
            })
          }
        </View>
      </AppView>
    );
  }
}

const styles = StyleSheet.create({
  allLanguageContainer: {
    flex:1,
    flexDirection: "row",
    marginTop: 30,
    flexWrap: 'wrap',
    // justifyContent: 'center',
    alignItems: 'center',
    // width: '100%'
  }

});


export default withTranslation()(SelectLanguage);
