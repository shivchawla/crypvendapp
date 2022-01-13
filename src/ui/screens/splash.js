
import React, {Component} from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { withTranslation } from 'react-i18next';

import AppView from '../components/appView';

const appIcon = require("../assets/images/logo-app.png");

class Splash extends Component {
    
  render() {
    const {t} = this.props;
    
    return (
      <AppView style={{backgroundColor:'white', justifyContent:'center'}}>
        <Image
          source={appIcon}
          resizeMode="contain"
          style={styles.image}
        />
        <Text style={styles.tagline}>{t('splash:tagline')}</Text>  
      </AppView> 
    );
  }
}


const styles = StyleSheet.create({
  tagline :{
    fontFamily: "roboto-regular",
    color: "#000",
    fontSize: 16,
    marginTop:10
  },

  image: {
    // marginTop: 50,
    height: 50
  }
});

export default withTranslation()(Splash);
