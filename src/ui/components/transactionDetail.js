import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";

const coinUtils = require('../../lib/coins/utils')

import DisplayCoin from './displayCoin';

class TransactionDetail extends Component {

	render() {
		const {tx, showId, text} = this.props;
    const {fiat, fiatCode, cryptoCode, cryptoAtoms, toAddress, id: transactionId} = tx;
    const exchangeRate = (fiat.toNumber()/coinUtils.toUnit(cryptoAtoms, cryptoCode).toNumber()).toFixed(2);
  
    const formattedCrypto = `${cryptoCode} ${coinUtils.toUnit(cryptoAtoms, cryptoCode)} @ ${fiatCode} ${exchangeRate}`;
    const formattedFiat = `${fiatCode} ${fiat}`;
    
		return (
			<View style={[styles.container, this.props.style]}> 
        {text && <Text style={styles.instructionText}>{text}</Text>}
        <DisplayCoin coin={tx} style={{marginTop: 25}}/>
        <View style={styles.detailContainer}>
          <Text style={styles.fiatText}>{formattedFiat}</Text>
          <Text style={styles.cryptoText}>{formattedCrypto}</Text>
          {toAddress && 
            <View style={styles.addressContainer}>
              <Text style={styles.address}>Receiver Address</Text>
              <Text style={styles.address}>{toAddress}</Text>
            </View> 
          }   
          {showId && transactionId && <Text style={styles.transactionId}>Id: {transactionId}</Text>}
        </View>
      </View>
		)
	}
}

const styles = StyleSheet.create({
  container: {
    width: '80%',
    height: '70%',
    backgroundColor: "#E6E6E6",
    alignItems: 'center',
    fontFamily: "roboto-regular",
    marginTop: 50,
  },
  instructionText: {
    fontFamily: "roboto-700",
    color: "#121212",
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
    marginBottom:25,
    width:'90%',
    fontWeight: '700'
  },
  detailContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fiatText: {
    fontSize: 25,
    color: "#121212",
  },
  cryptoText: {
    fontSize: 16,
    color: "#121212",
  },
  addressContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  address: {
    fontSize: 13, 
    color: "#121212",
    textAlign: 'center'  
  },
  transactionId: {
    marginTop: 10,
    fontSize: 12,
    color: "#121212",
  }
});

export default TransactionDetail;