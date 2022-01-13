
import React, {Component} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  TouchableHighlight
} from 'react-native';

import Header from '../components/header'
import Footer from '../components/footer'

class AdressReuse extends Component {
	
	render() {
		return (
			<View>
				<Header title="WARNING" goBack={false}/>
				<View>
					<Text>It looks like you've used this address already</Text>
      				<Text>
        				For both your privacy and safety against scams, please generate a new one from your wallet and scan that one instead.
      				</Text>
					<Footer title="Restart" onPress={this.restart}/>
				</View> 
			</View>	
		);
	}
}

export default AdressReuse;