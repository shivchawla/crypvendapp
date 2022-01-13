import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";
import { withTranslation } from 'react-i18next';

import SelectCoin from '../components/selectCoin'; 
import ScreenTitle from '../components/screenTitle';
import AppView from '../components/appView';
import FloatingMenu from '../components/floatingMenu';

import actionEmitter from '../../lib/action-emitter';   

class ChooseCoin extends Component  {

  onSelectCoin = (coin) => {
    const {navigation, t} = this.props;
    navigation.navigate('status', {message: t('status:startTransaction') + '....', loading: true});
    actionEmitter.emit('message', {button: 'start', data: {cryptoCode: coin.cryptoCode, direction: 'cashIn'}});
  }

  render() {
    const {coins} = this.props.route.params;
    const {t} = this.props;

    return (
      <AppView backButton="shutdown">
        <ScreenTitle {...{title: t('chooseCoin:title')}}/>
        <View style={styles.allCryptoContainer}>
          {coins && coins.length > 0 && 
            coins.map((coin, index) => { 
              return <SelectCoin key={coin.cryptoCode} coin={coin} onSelect={() => this.onSelectCoin(coin)}/> 
            })
          }
          <FloatingMenu navigation={this.props.navigation}/>
        </View>
      </AppView>
    );
  }
}

const styles = StyleSheet.create({
  allCryptoContainer: {
    height: 140,
    flexDirection: "row",
    marginTop: 30,
    // marginLeft: 32,
    // marginRight: 22,
    flex:1,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});



export default withTranslation()(ChooseCoin);
