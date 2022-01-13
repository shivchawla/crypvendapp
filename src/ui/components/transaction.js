import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";
import { withTranslation } from 'react-i18next';

const downArrowIcon = require('../assets/images/icon-arrow-down.png');
const upArrowIcon = require('../assets/images/icon-arrow-up.png');

const miniViewTxFieldsMap = {
  'customer': 'transaction:customer', 
  "fiat": 'transaction:fiat',
  "crypto": 'transaction:crypto', 
  "status": 'transaction:status',
  "date": 'transaction:date',
};

const restViewTxFieldsMap = {
  "rate": 'transaction:rate', 
  "address": 'transaction:address', 
  'session': 'transaction:session', 
  "txId": 'transaction:txId',
};

const cryptoImages = {
  'BTC': require('../assets/images/btc.png'),
  'ETH': require('../assets/images/eth.png'),
  'DASH': require('../assets/images/dash.png'),
  'BCH': require('../assets/images/bch.png'),
  'ZEC': require('../assets/images/zec.png'),
  'LTC': require('../assets/images/ltc.png')
};
   
class Transaction extends Component {

  constructor(props) {
    super(props)
    this.state = {expanded: false}
  }

	render() {
		const {t, tx} = this.props;
		const {expanded} = this.state;

		return (
			<View style={[styles.transactionContainer, this.props.style]}> 
        {
          Object.keys(miniViewTxFieldsMap).map((key, index) => {
            if (tx[key]) {
              return <View key={key} style={styles.singleValueContainer}>
                <Text style={styles.label}>{t(miniViewTxFieldsMap[key])}: </Text>
                <Text style={styles.value}>{tx[key]}</Text>
                </View> 
            }
          })
        } 

        {expanded && 
          Object.keys(restViewTxFieldsMap).map((key, index) => {
            if (tx[key]) {
              return <View key={key} style={[styles.singleValueContainer, key!='rate' ? {width: '100%'} : {}]}>
                  <Text  style={styles.label}>{t(restViewTxFieldsMap[key])}: </Text>
                  <Text style={styles.value}>{tx[key]}</Text>
                </View> 
            }
          })
        }
        <TouchableOpacity onPress={() => this.setState({expanded: !expanded})} style={styles.iconButton}> 
          <Image source={expanded ? upArrowIcon : downArrowIcon} resizeMode="contain" style={styles.image} />
        </TouchableOpacity>
        <Image source={cryptoImages[tx.cryptoCode]} resizeMode="contain" style={styles.cryptoImage} />
        
      </View>  
    )
	}
}

const styles = StyleSheet.create({
  transactionContainer: {
    backgroundColor: "#E6E6E6",
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    width:'95%',
    padding: 10,
    flexWrap: 'wrap',
    marginTop:20
  },
  singleValueContainer:{
    // flex:1,
    // flexDirection: 'row',
    width: '50%',
    marginTop:20

  },
  label: {
    fontFamily: "roboto-regular",
    fontWeight:'700',
    fontSize: 15
  },
  value: {
    fontFamily: "roboto-regular",
    fontSize: 15
  },
  iconButton: {
    position:'absolute',
    bottom: 10,
    right:10
  },
  cryptoImage: {
    height:35,
    position:'absolute',
    right: -35,
    top: 10
  }
});

export default withTranslation()(Transaction);