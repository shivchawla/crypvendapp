import React, {Component} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity
} from 'react-native';

import Header from '../components/header'
import Footer from '../components/footer'
import * as Helpers from '../helpers/exporter'

import actionEmitter from '../../lib/action-emitter';   

class ChooseCoin extends Component {
  
  onSelectCoin = (coin) => {
    console.log("Coin Selected")
    console.log(coin);
    actionEmitter.emit('message', {button: 'start', data: {cryptoCode: coin.cryptoCode, direction: 'cashIn'}});
    // this.props.navigation.navigate('pairingScan');
  }


  render() {
    const {coins, twoWayMode} = this.props.route.params;
    console.log(coins);

    const defaultCoin = coins[0]
    currentCryptoCode = defaultCoin.cryptoCode
    currentCoin = defaultCoin
    currentCoins = coins.slice(0)
    // const translatedCoin = locale.translate(coin.display).fetch()
    // const buyStr = locale.translate('Buy<br/>%s').fetch(translatedCoin)

    return (
      <View>
        <Header title="Select Crypto" goBack={false}/>
        <View>
          {coins && coins.length >0 && 
            coins.map((coin, index) => {
              return <TouchableOpacity key={coin.cryptoCode} onPress={() => this.onSelectCoin(coin)}>
                  <Text style={Helpers.Typography.fourPointFive}>{coin.cryptoCode}</Text>
                  </TouchableOpacity>
            })
          }
        </View> 
      </View> 
    );
  }
}

export default ChooseCoin;
