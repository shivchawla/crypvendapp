import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";

const coinUtils = require('../../lib/coins/utils');

const cryptoImages = {
  'BTC': require('../assets/images/btc.png'),
  'ETH': require('../assets/images/eth.png'),
  'DASH': require('../assets/images/dash.png'),
  'BCH': require('../assets/images/bch.png'),
  'ZEC': require('../assets/images/zec.png'),
  'LTC': require('../assets/images/ltc.png')
};

const CRYPTO_CURRENCIES = [
  {cryptpCode: 'BTC' , display: 'Bitcoin'},
  {cryptpCode: 'ETH', display: 'Ethereum'},
  {cryptpCode: 'DASH', display: 'Dash'},
  {cryptpCode: 'BCH', display: 'Bitcoin Cash'},
  {cryptpCode: 'ZEC', display: 'ZCash'},
  {cryptpCode: 'LTC', display: 'Litecoin'}
];
  

class DisplayCoin extends Component {
	render() {
		const {coin} = this.props;
		var {cryptoCode} = coin;
    var {display} = CRYPTO_CURRENCIES.find(item => item.cryptoCode == cryptoCode);

		return (
			<View style={[styles.cryptoContainer, this.props.style]}> 
        <Image
          source={cryptoImages[cryptoCode]}
          resizeMode="contain"
          style={styles.image}
        />
        {display && <Text style={styles.cryptoText}>{display}</Text>}
    	</View>
          	
		)
	}
}

const styles = StyleSheet.create({
  cryptoContainer: {
    backgroundColor: "#E6E6E6",
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
  },
  cryptoText: {
    fontFamily: "roboto-regular",
    color: "#121212",
    fontSize: 25,
    marginLeft: 10
  },
  
});

export default DisplayCoin;