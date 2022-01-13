import React, { Component } from "react";
import { StyleSheet, View, Text, Image } from "react-native";


class Instruction extends Component {
	render() {
		const  {instructionText, icon} = this.props
		return (
			<View style={styles.whiteContainer}>
    		<Text style={styles.instructionText}>{instructionText}</Text>
      	<Image
        	source={icon}
        	resizeMode="contain"
        	style={styles.image}
      	></Image>
    </View>
		)
	}	
}

const styles = StyleSheet.create({
  whiteContainer: {
    width: '80%',
    height: '60%',
    backgroundColor: "#E6E6E6",
    marginTop: 50,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: "roboto-700",
    color: "#121212",
    // height: 60,
    textAlign: "center",
    fontSize: 16,
    marginTop: 30,
    width:'90%',
    fontWeight: 'bold'
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 30
  },
});

export default Instruction;