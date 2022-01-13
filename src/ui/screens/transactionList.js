import React, { Component } from "react";
import { StyleSheet, View, ScrollView, Text, FlatList} from "react-native";
import { withTranslation } from 'react-i18next';
import {BarIndicator} from 'react-native-indicators';

import Transaction from '../components/transaction'; 
import ScreenTitle from '../components/screenTitle';
import NextButton from '../components/nextButton';
import AppView from '../components/appView';

import actionEmitter from '../../lib/action-emitter';   
import brain from '../server';

class TransactionList extends Component {
	constructor(props){
		super(props)
		this.state = {txs: [], page: 0, searchParams: {}, firstLoad: true};
	}

	fetchTransactions = () => {
		const {txs, page, searchParams} = this.state;

		const nPage = page + 1;

		return brain.getTransactions({...searchParams, page: nPage})
		.then(ntxs => {
			txs.push(...ntxs)
			this.setState({txs, page: nPage, firstLoad: false});
		})
		.catch(err => {
			this.setState({firstLoad: false});	
		})
	}

	componentDidMount() {
		this.fetchTransactions();
	}


	render() {
		const {t} = this.props;
		const {txs, firstLoad} = this.state;
		
		return (
			<AppView back={true}>
				{txs && txs.length > 0 && !firstLoad && <ScreenTitle title={t('transactionList:title')} hasBackButton={false} titleStyle={{fontSize: 20}}/>}
				{firstLoad && <BarIndicator color='white' />}
				{txs && txs.length > 0 && <FlatList
                    data={txs}
                    keyExtractor={item => item.session}
                    onEndReached={this.fetchTransactions}
                    renderItem={({ item }) => {return <Transaction tx={item} /> }}
                />
            	}	
                {(!txs || txs.length == 0) && !firstLoad &&
					<>
					<Text style={styles.noTransactions}>{t('transactionList:noTransactions')}</Text>
					<NextButton noHomeButton={true} text={t('buttonText:goBack')} onSelect={() => actionEmitter.emit('message', {button: 'idle'})} />
					</>
				}

			</AppView>
		)
	}
}

const styles = StyleSheet.create({
	allTransactionContainer: {
		alignItems: 'center',
	},
	noTransactions: {
		marginTop: 50,
		textAlign:'center',
		fontSize: 25,
		color: 'white'
	}
});

export default withTranslation()(TransactionList);
