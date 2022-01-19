import 'react-native-gesture-handler';
import React, { Component } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';

import { withTranslation } from 'react-i18next';


// import Main from '../modules/main/Main'
// import IntroMain from '../modules/intro/MainIntro'
// import LocationShare from '../modules/intro/LocationShare'

// import BottomTabs from './BottomTabs'
// import DrawerRouter from './Drawer'

import Splash from '../screens/splash';
import Initialize from '../screens/initialize';
import PairingScan from '../screens/pairingScan';
import Status from '../screens/status';
import ChooseCoin from '../screens/chooseCoin';
import ScanAddress from '../screens/scanAddress';
import PreviewPurchase from '../screens/previewPurchase';
import EnterFiat from '../screens/enterFiat';
import ComplianceRequest from '../screens/complianceRequest';
import RegisterPhone from '../screens/registerPhone';
import SecurityCode from '../screens/securityCode';
import PhotoIdentification from '../screens/photoIdentification';
import RequestConfirmation from '../screens/requestConfirmation';
import TransactionSuccess from '../screens/transactionSuccess';
import SelectLanguage from '../screens/selectLanguage';
import TransactionList from '../screens/transactionList';
import AcceptBills from '../screens/acceptBills';

import {processData} from '../store';
import {serverStart} from '../server';

const actionEmitter = require('../../lib/action-emitter');

const Stack = createStackNavigator();
const headeroptions = { headerShown: false }

class Router extends Component {
    constructor(props) {
        super(props);
        Icon.loadFont()
        this.isRefReady = false;
        this.navRef = null;
    }

    attachNavEvents = () => {
        actionEmitter.on('browserEvent', (data) => {
            // console.log("Brain.js: Launching browser Event");
            // console.log(data);
            this.handleNavEvent(data);
        });
    }

    handleNavEvent = async (data) => {

        console.log("in Handle Nav Event");
        console.log(data);

        console.log("Process Action in FE: ", data.action);

        await processData(data);

        const {t} = this.props;

        switch(data.action) {
            case "virgin":
                this.navRef.navigate('initialize');
                break;

            case "networkDown":
                this.navRef.navigate('status', {
                    loading: false, error: true, 
                    message: t('errorMessage:networkDown:title'), 
                    subMessages: [t('errorMessage:networkDown:message')],
                });
                break;

            case "wifiConnecting":
                this.navRef.navigate('status', {
                    loading: false, error: true, 
                    message: t('errorMessage:noInternet:title'), 
                    subMessages: [t('errorMessage:noInternet:message')],
                });
                break;                             

            case "initializing":
                console.log("Navigating to Status")
                this.navRef.navigate("status", {message: t('status:initialize') + '....', loading: true});    
                break;    

            case "unpaired":
                this.navRef.navigate("pairingScan");
                break;
            
            case "pairing":
                this.navRef.navigate("status", {message: t('status:pairing') + '....'});    
                break;

            case "pairingError":
                this.navRef.navigate("status", {
                    error: true, 
                    loading: false,
                    message: t('errorMessage:pairingDevice:title'), 
                    subMessages: [t('errorMessage:pairingDevice:message')],
                    nextStep:{buttonText: t('buttonText:scanAgain'), state: 'pairingScan'}});
                break;   

            case "addressReuse":
                this.navRef.navigate("status", {
                    error: true, 
                    loading: false,
                    message: t('errorMessage:addressReuse:title'),
                    subMessages: [t('errorMessage:addressReuse:message'),],
                    nextStep:{buttonText: t('buttonText:startAgain'), state: 'idle'}});
                break;  

            // case "booting":
            //     this.navRef.navigate("splash");    
            //     break;

            case "chooseCoin":
                this.navRef.navigate("chooseCoin", {coins: data.coins, twoWayMode: data.twoWayMode || false});
                break;

            case "cashOrCredit": //?
                this.navRef.navigate("cashOrCredit");
                break;

            case "checkBalance":
                this.navRef.navigate("enterFiat", {"reason": "checkBalance"});
                break;

            case "errorTransaction":
                let message = t('errorMessages:' + data.reason) || t('errorMessages:lowBalance');
                let subMessages = [];                    
                this.navRef.navigate("status", {
                    error: true, 
                    loading: false,
                    message: t('errorMessage:' + data.reason + '.title') || t('errorMessage:lowBalance:title'),
                    subMessages: data.reason ? [t('errorMessage:' + data.reason + ':message')] : [],
                    nextStep:{buttonText: t('buttonText:tryAgain'), state: 'idle'}});
                break;

            case "previewRates":
                this.navRef.navigate("previewPurchase", {tx: data.tx});
                break;

            case "scanAddress":
                this.navRef.navigate("scanAddress");
                break;

            case "smsVerification":
                this.navRef.navigate("compliance", {
                    title:t('compliance:title'),
                    subTitle:t('compliance:smsVerification:subTitle'), 
                    message: t('compliance:smsVerification:message'),
                    requestType: "permissionSmsCompliance"
                });
                break;

            case "registerPhone":
                this.navRef.navigate("registerPhone");
                break; 

            case "securityCode":
                this.navRef.navigate("securityCode");
                break;

            case "badSecurityCode":
                this.navRef.navigate('status', {
                    loading: false, error: true, 
                    message: t('errorMessage:badSecurityCode:title'), 
                    subMessages: [t('errorMessage:badSecurityCode:message')],
                    nextStep:{buttonText: t('buttonText:startAgain'), state: 'idle'}
                }); 
                break;

            case "scanned":    
            case "acceptingFirstBill":
            case "acceptingBills":
                // this.navRef.navigate("enterFiat", {});
                this.navRef.navigate("acceptBills", {credit: data.credit});
                break;

            case "permission_id":
                this.navRef.navigate("compliance", {
                    title: t('compliance:title'),
                    subTitle: t('compliance:idVerification:subTitle'), 
                    message: t('compliance:idVerification:message'),
                    requestType: "permissionIdCompliance"
                });
                break;

            case "scan_id_photo":
                this.navRef.navigate("photoIdentification", {
                    title: t('identityVerification:title'),
                    subTitle: t('identityVerification:document:subTitle'),
                    iconType: "idPhoto", 
                    instructionText: t('identityVerification:document:instructionText'),
                    successType: 'idPhotoValidate',
                    cancelType: 'idPhotoActionCancel'
                });
                break;

            case "permission_face_photo":
                this.navRef.navigate("compliance", {
                    title: t('compliance:title'),
                    subTitle:  t('compliance:photoVerification:subTitle'), 
                    message:  t('compliance:photoVerification:message'), 
                    requestType: "permissionPhotoCompliance"
                });
                break; 

            case "scan_face_photo":
                this.navRef.navigate("photoIdentification", {
                    title: t('identityVerification:title'),
                    subTitle: t('identityVerification:photo:subTitle'),
                    message: t('identityVerification:photo:message'), 
                    successType: 'facePhotoValidate',
                    cancelType: 'idPhotoActionCancel'
                });
                break; 

            case "requestConfirmation":
                this.navRef.navigate('requestConfirmation', {tx: data.tx})
                break;       
            
            case 'cryptoTransferComplete':
                const {tx, receipt} = data;
                this.navRef.navigate('transactionSuccess', {tx, receipt})
                break;  

            case 'showTransactions':
                const {txs} = data
                console.log("In switch");
                console.log(data);
                this.navRef.navigate('transactionList', {txs});
                break;             
        }
    }

    onStackReady = async () => {
        this.isRefReady = true;
        this.navRef.navigate('splash');
        //Attach event listener
        this.attachNavEvents();
        await serverStart();       
    }

    render() {
        return (
            <NavigationContainer
                ref={r => {this.navRef = r}}
                onReady={() => this.onStackReady()}
                >
                <Stack.Navigator>
                    <Stack.Screen options={headeroptions} name="splash" component={Splash} />
                    <Stack.Screen options={headeroptions} name="initialize" component={Initialize} />
                    <Stack.Screen options={headeroptions} name="pairingScan" component={PairingScan} />
                    <Stack.Screen options={headeroptions} name="status" component={Status} />
                    <Stack.Screen options={headeroptions} name="chooseCoin" component={ChooseCoin} />
                    <Stack.Screen options={headeroptions} name="scanAddress" component={ScanAddress} />
                    <Stack.Screen options={headeroptions} name="enterFiat" component={EnterFiat} />
                    <Stack.Screen options={headeroptions} name="acceptBills" component={AcceptBills} />
                    <Stack.Screen options={headeroptions} name="previewPurchase" component={PreviewPurchase} />
                    <Stack.Screen options={headeroptions} name="compliance" component={ComplianceRequest} />
                    <Stack.Screen options={headeroptions} name="registerPhone" component={RegisterPhone} />
                    <Stack.Screen options={headeroptions} name="securityCode" component={SecurityCode} />
                    <Stack.Screen options={headeroptions} name="photoIdentification" component={PhotoIdentification} />
                    <Stack.Screen options={headeroptions} name="requestConfirmation" component={RequestConfirmation} />
                    <Stack.Screen options={headeroptions} name="transactionSuccess" component={TransactionSuccess} />
                    <Stack.Screen options={headeroptions} name="transactionList" component={TransactionList} />
                    <Stack.Screen options={headeroptions} name="selectLanguage" component={SelectLanguage} />
                </Stack.Navigator>
            </NavigationContainer>

        );
    }
}

export default withTranslation()(Router);