import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";
const cryptoImages = {
  'BTC': require('../assets/images/btc.png'),
  'ETH': require('../assets/images/eth.png'),
  'DASH': require('../assets/images/dash.png'),
  'BCH': require('../assets/images/bch.png'),
  'ZEC': require('../assets/images/zec.png'),
  'LTC': require('../assets/images/ltc.png')
};

class SelectCoin extends Component {
	render() {
		const {coin} = this.props;
		var {cryptoCode, display} = coin;  
		return (
			<TouchableOpacity onPress={this.props.onSelect} style={styles.cryptoContainer}> 
        <Image
          source={cryptoImages[cryptoCode]}
          resizeMode="contain"
          style={styles.image}
        ></Image>
        <Text style={styles.cryptoText}>{display}</Text>
    	</TouchableOpacity>
          	
		)
	}
}

const styles = StyleSheet.create({
  cryptoContainer: {
    width: 156,
    height: 140,
    backgroundColor: "#E6E6E6",
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginLeft:10,
    marginRight:10
  },
  image: {
    width: 75,
    height: 75,
  },
  cryptoText: {
    fontFamily: "roboto-regular",
    color: "#121212",
    fontSize: 24,
    marginTop: 9,
  },
  
});

export default SelectCoin;