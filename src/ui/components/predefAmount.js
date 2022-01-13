import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";

class PredefAmount extends Component {
  render() {
    const {amount, selected} = this.props;
    return (
      <TouchableOpacity onPress={this.props.onSelect}>
        <View style={[styles.container, selected ? {backgroundColor:'#FE9901'} : {}]}>
            <Text style={[styles.textAmount, selected ? {color: "white"} : {}]}>Q {amount}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: 70,
    // height: 30,
    backgroundColor: "#E6E6E6",
    margin:5,
  },
  textAmount: {
    fontFamily: "roboto-regular",
    color: "rgba(74,74,74,1)",
    fontSize: 18,
    margin: 5,
    textAlign: 'center',
  }
});

export default PredefAmount;
