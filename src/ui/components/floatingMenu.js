import React, { Component } from "react";
import { withTranslation } from 'react-i18next';
import { FloatingAction } from "react-native-floating-action";

const actionEmitter = require('../../lib/action-emitter');

// const menuIcon = require("../assets/images/icon-menu.png");
const languageIcon = require("../assets/images/icon-language.png");
const transactionIcon = require("../assets/images/icon-transaction-btc.png");
import {getLocales} from '../store';

class FloatingMenu extends Component {
	
	onItemSelect = (name) => {
		const {navigation} = this.props;
		switch(name) {
			case "language":
			return getLocales()
			.then(locales => {
				console.log("In Language switch");
				console.log(locales);
				navigation.navigate('selectLanguage', {locales});
			})
			break;

		case "transactions":
			// actionEmitter.emit('message', {button: 'getTransactions'});
			navigation.navigate('transactionList');
			break;
		}
	}

	render() {
		const {t} = this.props;

		const actions = [
		{
		    text: t('buttonText:language'),
		    icon: languageIcon,
		    name: "language",
		    color:'#FE9901',
		    position: 1
		  },
		  {
		    text: t('buttonText:transactions'),
		    icon: transactionIcon,
		    name: "transactions",
		    color:'#FE9901',
		    position: 2
		  }
		];

		return (
			<FloatingAction
	            color="#FE9901"
	            actions={actions}
	            onPressItem={this.onItemSelect}
	          />
      	)
	}
}

export default withTranslation()(FloatingMenu);