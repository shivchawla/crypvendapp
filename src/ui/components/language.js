import React, { Component } from "react";
import { TouchableOpacity, StyleSheet, View, Text, Image } from "react-native";
import { withTranslation } from 'react-i18next';

const flagIcons = {
  'en': require('../assets/images/icon-us-flag.png'),
  'es': require('../assets/images/icon-gt-flag.png'),
};

class Language extends Component {

	render() {
		const {t, locale, selected} = this.props;
		
    const code = locale.split("-")[0];

		return (
			<TouchableOpacity onPress={this.props.onSelect} style={[styles.flagContainer, selected ? styles.selectedContainer : {}]}> 
        <Image
          source={flagIcons[code]}
          resizeMode="contain"
          style={styles.image}
        ></Image>
        <Text style={[styles.flagText, selected ? styles.selectedText : {}]}>{t('language:' + code)}</Text>
    	</TouchableOpacity>
		)
	}
}

const styles = StyleSheet.create({
  flagContainer: {
    backgroundColor: "#E6E6E6",
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: 120,
    height: 40,
    marginLeft:10,
    marginRight:10
  },
  selectedContainer: {
    backgroundColor: '#FE9901',
  },
  image: {
    width: 20,
    height: 20,
  },
  flagText: {
    fontFamily: "roboto-regular",
    color: "#121212",
    fontSize: 18,
    marginLeft: 5
  },
  selectedText: {
    color: 'white'
  }
});

export default withTranslation()(Language);