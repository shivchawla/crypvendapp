import React, { Component } from "react";
import { StyleSheet, View, Text, Image, TextInput, TouchableOpacity } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { withTranslation } from 'react-i18next';

import PredefAmount from "../components/predefAmount";
import NextButton from "../components/nextButton";
import ScreenTitle from "../components/screenTitle";
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   

const editIcon = require("../assets/images/icon-edit.png");
const predefAmounts = [200, 300, 500, 800, 1000, 2000];


class EnterFiat extends Component {

  constructor(props) {
    super(props);
    const idx = predefAmounts.length > 1 ? 1 : 0;
    this.state = {fiatSelected : predefAmounts[idx].toString(), edit: false, selectedIndex: idx};
  }        

  proceed = () => {
    const {fiatSelected} = this.state;
    const {navigation, t} = this.props;
    navigation.navigate('status', {message: t('status:checkingLimits') + '....', loading: true});

    const {reason} = this.props.route.params; 
    actionEmitter.emit('message', {button: 'fiatValidate', data:{denomination: fiatSelected.toString(), reason}});
  }

  cancel = () => {
    console.log("In cancel Fiat");
  }

  onFiatUpdate = (amount) => {
    const idx = predefAmounts.indexOf(parseInt(amount));
    this.setState({fiatSelected: amount, selectedIndex: idx});
  }

  onSelectPredef = (index, amount) => {
    this.setState({fiatSelected: amount.toString(), selectedIndex: index}); 
  }

  render() {
    const {edit, fiatSelected, selectedIndex} = this.state;
    const {t} = this.props;

    return (
      <AppView>
        <ScreenTitle title={t('enterFiat:title')} />
        <KeyboardAwareScrollView style={{flex:1}} enableOnAndroid={true} extraScrollHeight={50}>
          <View style={styles.predefAmountContainer}>
            {
              predefAmounts && predefAmounts.map((amount, index) => {
                return <PredefAmount selected={selectedIndex == index} key={index} {...{amount}} onSelect={() => this.onSelectPredef(index, amount)}/> 
              }) 
            }
          </View>
          <View style={styles.inputRow}>
            
            {edit ?
              <>
                <Text style={styles.input}>Q </Text> 
                <TextInput
                  style={styles.input}
                  onChangeText={this.onFiatUpdate}
                  value={this.state.fiatSelected}
                  keyboardType="numeric"
                  autoFocus={true}
                />
              </>
              :
              <>             
                <Text style={styles.input}>Q {fiatSelected}</Text>
                <TouchableOpacity onPress={() => this.setState({edit: true})}>            
                  <Image source={editIcon} resizeMode="contain" style={styles.image}/>
                </TouchableOpacity>
              </>
            }
          </View>
        </KeyboardAwareScrollView>
        
        <NextButton text={t('buttonText:next')} onSelect={this.proceed}/>
      </AppView>
    );
  }
}

const styles = StyleSheet.create({
  predefAmountContainer: {
    height: 30,
    marginTop: 150,
    flexDirection: "row",
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  image: {
    width: 20,
    height: 20,
    marginLeft: 10,
    marginTop: 5
  },
  inputRow: {
    // height: 46,
    flexDirection: "row",
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 40,
    color: 'white'
  }
});

export default withTranslation()(EnterFiat);
