import React, { Component } from "react";
import { StyleSheet, View, Text, Image } from "react-native"

import PosDeviceSdk from 'react-native-pos-device-sdk';
// import actionEmitter from '../../lib/action-emitter';   

import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import DisplayCoin from "../components/displayCoin";
const qrCodeIcon = require("../assets/images/icon-big-qr.png");

class ScanAddress extends Component {

  constructor(props) {
    super(props);
    this.state = {preview: false, address: ""};
  }
  
  cancel = () => {
    console.log("In Cancel Scan")
    actionEmitter.emit('message', {button: 'cancelScan'});
  }

  startScan = () => {
    const {tx, bill} = this.props.route.params;

    return PosDeviceSdk.startScan()
    .then(address => {
      console.log("In Scanning");
      console.log(address);
      //If bill is present, show Preview
      if(bill) {
        this.setState({address, preview: true});
      } else { //Proceed to next step of compliance
        actionEmitter.emit('message', {button: 'addressScan', data:{address}});
      } 

    })
    .catch(err => {
      console.log(err);
    })
  }

  proceedToNextStep = () => {
    // const {navigation} = this.props;
    // navigation.navigate('', {});
    const {address} = this.state;
    actionEmitter.emit('message', {button: 'addressScan', data:{address}});
  }

  render() {
    const {preview, address} = this.state;
    const {tx} = this.props.route.params;

    console.log("In render - Scan Address");
    console.log(tx);

    return (

      <View style={styles.container}>
        {!preview ?
          <>  
            <ScreenTitle title="Escanea Tu Dirección"/>

            <View style={styles.whiteContainer}>
              <Text style={styles.instructionText}>Scan el código QR de tu drección</Text>
              <Image
                source={qrCodeIcon}
                resizeMode="contain"
                style={styles.image}
              ></Image>
            </View>
            <NextButton text="START SCAN" onSelect={this.startScan}/>
          </>
          :
          <>
            <ScreenTitle title="Revisa tu compra"/>

            <View style={styles.whiteContainer}>
              <Text style={styles.instructionText}>Revise la transacción del cliente antes de continuar</Text>
              <DisplayCoin coin={tx}/>
              <Text style={styles.q500}>Q 500</Text>
              <Text style={styles.btc000264}>( BTC 0.00264 )</Text>
              <Text style={styles.loremIpsum}>{address}</Text>
            </View>
            <NextButton text="SEGUIENTE" onSelect={this.proceedToNextStep}/>
          </>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: "rgba(34,112,205,1)"
  },
  whiteContainer: {
    width: 280,
    height: 440,
    backgroundColor: "#E6E6E6",
    marginTop: 50,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: "roboto-700",
    color: "#121212",
    height: 60,
    textAlign: "center",
    fontSize: 16,
    marginTop: 80
  },
  image: {
    width: 200,
    height: 200,
  },
});

export default ScanAddress;
